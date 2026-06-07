import json
import re
from backend.nim_client import call_nim


ANALYST_SYSTEM_PROMPT = """You are a senior incident analyst reconstructing a security attack timeline.
Analyze the triage results, enrichment data, and raw alerts to build a complete picture.

Return ONLY valid JSON with:
- timeline: list of objects with timestamp (str), event (str), significance ("critical"/"high"/"medium")
- attack_chain: 2-3 sentence narrative of how the attack unfolded
- blast_radius: description of what systems and data are affected

Return ONLY valid JSON. No markdown, no explanation, no code fences."""


def _strip_markdown_fences(text):
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def analyze_alerts(state):
    alerts = state["alerts"]
    triage = state["triage"]
    enrichment = state["enrichment"]

    context = {
        "alert_count": len(alerts),
        "triage": triage,
        "enrichment": enrichment,
        "alerts": alerts[:20],
    }
    user_prompt = json.dumps(context, indent=2)

    try:
        response = call_nim(ANALYST_SYSTEM_PROMPT, user_prompt)
        content = response.choices[0].message.content
        cleaned = _strip_markdown_fences(content)
        analysis_data = json.loads(cleaned)
    except Exception:
        analysis_data = {
            "timeline": [],
            "attack_chain": "Unable to reconstruct attack chain automatically.",
            "blast_radius": "Unable to assess blast radius automatically.",
        }

    state["analysis"] = analysis_data
    state["current_agent"] = "writer"
    return state
