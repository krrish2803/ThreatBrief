import json
import re
from backend.nim_client import call_nim


TRIAGER_SYSTEM_PROMPT = """You are a senior SOC analyst performing triage on security alerts.
Analyze the following batch of alerts and return a JSON object with:
- severity_level: one of "critical", "high", "medium", "low"
- alert_count: total number of alerts
- primary_event_type: the most common or significant event type
- affected_hosts: list of unique affected hostnames/IPs
- affected_users: list of unique affected usernames

Return ONLY valid JSON. No markdown, no explanation, no code fences."""


def _strip_markdown_fences(text):
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def triage_alerts(state):
    alerts = state["alerts"]

    if not alerts:
        state["triage"] = {
            "severity_level": "low",
            "alert_count": 0,
            "primary_event_type": "none",
            "affected_hosts": [],
            "affected_users": [],
        }
        state["current_agent"] = "enricher"
        return state

    batch = alerts[:30]
    user_prompt = json.dumps(batch, indent=2)

    try:
        response = call_nim(TRIAGER_SYSTEM_PROMPT, user_prompt)
        content = response.choices[0].message.content
        cleaned = _strip_markdown_fences(content)
        triage_data = json.loads(cleaned)
    except Exception:
        triage_data = {
            "severity_level": "critical",
            "alert_count": len(batch),
            "primary_event_type": batch[0].get("event_type", "unknown"),
            "affected_hosts": list(set(a.get("host", "") for a in batch if a.get("host"))),
            "affected_users": list(set(a.get("user", "") for a in batch if a.get("user"))),
        }

    state["triage"] = triage_data
    state["current_agent"] = "enricher"
    return state
