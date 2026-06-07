import json
import re
from backend.nim_client import call_nim


WRITER_SYSTEM_PROMPT = """You are a senior SOC analyst writing a formal incident brief for the CISO.
Use all previous analysis data to generate a complete incident report.

Return ONLY valid JSON with exactly these fields:
- executive_summary: string, 3 sentences non-technical
- what_happened: string, detailed technical 4-6 sentences
- affected_systems: list of strings
- confidence_score: integer 0-100
- confidence_reasoning: string, one sentence
- recommended_actions: list of strings (each action is a plain string with NO numbering prefix)

IMPORTANT: recommended_actions must be a plain JSON array of strings, like ["action one", "action two"]. Do NOT prefix items with numbers. Do NOT use "1." or "2." inside the strings.

Return ONLY valid JSON. No markdown, no explanation, no code fences."""


def _strip_markdown_fences(text):
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def write_brief(state):
    triage = state["triage"]
    enrichment = state["enrichment"]
    analysis = state["analysis"]

    context = {
        "triage": triage,
        "enrichment": enrichment,
        "analysis": analysis,
    }
    user_prompt = json.dumps(context, indent=2)

    try:
        response = call_nim(WRITER_SYSTEM_PROMPT, user_prompt)
        content = response.choices[0].message.content
        cleaned = _strip_markdown_fences(content)
        cleaned = re.sub(r'^\s*\d+\.\s*"', '"', cleaned, flags=re.MULTILINE)
        brief_data = json.loads(cleaned)
        if "recommended_actions" in brief_data:
            cleaned_actions = []
            for a in brief_data["recommended_actions"]:
                a_clean = re.sub(r'^\d+\.\s*', '', a)
                cleaned_actions.append(a_clean)
            brief_data["recommended_actions"] = cleaned_actions
    except Exception:
        brief_data = {
            "executive_summary": "Automated analysis completed.",
            "what_happened": "See alert details for technical information.",
            "affected_systems": list(set(a.get("host", "") for a in state["alerts"] if a.get("host"))),
            "confidence_score": 50,
            "confidence_reasoning": "Generated with fallback logic due to parsing error.",
            "recommended_actions": ["Review all alerts in SIEM for further investigation."],
        }

    brief_data["mitre_mapping"] = enrichment.get("mitre_techniques", [])
    brief_data["ioc_list"] = enrichment.get("iocs", [])
    brief_data["timeline"] = analysis.get("timeline", [])
    brief_data["severity"] = triage.get("severity_level", "medium")

    state["brief"] = brief_data
    state["current_agent"] = "writer"
    state["status"] = "complete"
    return state
