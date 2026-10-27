from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.lead import Lead, AssignmentRule
from app.models.user import User


class LeadRoutingService:
    @staticmethod
    async def assign_lead(lead: Lead, db: AsyncSession) -> Optional[User]:
        """
        Evaluates active assignment rules and selects the best available agent.
        Preconditions for assignment:
        - User is active (is_active = True)
        - User is punched in on active duty (is_punched_in = True)
        - User is within lead capacity limit (current_active_leads_count < max_active_leads)
        """
        # 1. Fetch available eligible agents
        stmt = (
            select(User)
            .where(
                User.is_active == True,
                User.is_punched_in == True,
                User.role.in_(["AGENT", "MANAGER"]),
                User.current_active_leads_count < User.max_active_leads
            )
            .order_by(asc(User.current_active_leads_count))
        )
        res = await db.execute(stmt)
        available_agents = res.scalars().all()

        if not available_agents:
            # Fallback: Check if any active agent exists regardless of punch status
            backup_stmt = (
                select(User)
                .where(User.is_active == True, User.role.in_(["AGENT", "MANAGER"]))
                .order_by(asc(User.current_active_leads_count))
            )
            backup_res = await db.execute(backup_stmt)
            backup_agents = backup_res.scalars().all()
            if not backup_agents:
                return None
            chosen_agent = backup_agents[0]
        else:
            # 2. Check for Geo / Territory matching
            if lead.preferred_location:
                geo_matches = [
                    a for a in available_agents 
                    if a.assigned_territory and a.assigned_territory.lower() in lead.preferred_location.lower()
                ]
                if geo_matches:
                    chosen_agent = geo_matches[0]
                else:
                    chosen_agent = available_agents[0]
            else:
                chosen_agent = available_agents[0]

        # 3. Apply assignment and SLA clock
        lead.assigned_agent_id = chosen_agent.id
        now = datetime.now(timezone.utc)
        lead.sla_deadline = now + timedelta(minutes=settings.SLA_FIRST_RESPONSE_MINUTES)
        lead.is_sla_breached = False

        # 4. Increment agent's current active load
        chosen_agent.current_active_leads_count += 1
        return chosen_agent
