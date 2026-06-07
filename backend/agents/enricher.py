import json
import re
from backend.nim_client import call_nim


ENRICHER_SYSTEM_PROMPT = """You are a threat intelligence analyst. Analyze the alerts and triage results.
Map alerts to relevant MITRE ATT&CK techniques and extract IOCs.

Reference MITRE techniques:
- T1110 Brute Force (Credential Access)
- T1078 Valid Accounts (Defense Evasion/Privilege Escalation)
- T1068 Privilege Escalation (Privilege Escalation)
- T1021 Remote Services (Lateral Movement)
- T1046 Network Discovery (Discovery)
- T1041 Exfiltration Over C2 (Exfiltration)
- T1486 Data Encrypted for Impact (Impact)
- T1490 Inhibit System Recovery (Impact)
- T1059 Command and Scripting Interpreter (Execution)
- T1562 Impair Defenses (Defense Evasion)

Return ONLY valid JSON with:
- mitre_techniques: list of objects with id, name, tactic
- iocs: list of objects with type (IP/Domain/Hash/Username/FilePath) and value
- threat_category: one of "Credential Attack", "Lateral Movement", "Ransomware", "Data Exfiltration", "Multiple"

Return ONLY valid JSON. No markdown, no explanation, no code fences."""


def _strip_markdown_fences(text):
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def enrich_alerts(state):
    alerts = state["alerts"]
    triage = state["triage"]

    context = {
        "alert_count": len(alerts),
        "triage": triage,
        "sample_alerts": alerts[:10],
    }
    user_prompt = json.dumps(context, indent=2)

    try:
        response = call_nim(ENRICHER_SYSTEM_PROMPT, user_prompt)
        content = response.choices[0].message.content
        cleaned = _strip_markdown_fences(content)
        enrichment_data = json.loads(cleaned)
    except Exception:
        enrichment_data = {
            "mitre_techniques": [],
            "iocs": [],
            "threat_category": "Unknown",
        }

    state["enrichment"] = enrichment_data
    state["current_agent"] = "analyst"
    return state
