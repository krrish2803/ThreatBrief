from backend.models import RawAlert


def ingest_alerts(state):
    alerts_data = state["alerts"] or []
    splunk_mode = state.get("splunk_mode", False)

    if splunk_mode and not alerts_data:
        from backend.splunk_client import SplunkClient
        client = SplunkClient()
        alerts_data = client.search_alerts()

    raw_alerts = []
    for a in alerts_data:
        raw_alerts.append(RawAlert(
            _time=str(a.get("_time", "")),
            src_ip=str(a.get("src_ip", "")),
            dest_ip=str(a.get("dest_ip", "")),
            user=str(a.get("user", "")),
            action=str(a.get("action", "")),
            severity=str(a.get("severity", "low")),
            event_type=str(a.get("event_type", "")),
            host=str(a.get("host", "")),
            message=str(a.get("message", "")),
        ))

    state["alerts"] = [a.model_dump() for a in raw_alerts]
    state["current_agent"] = "triager"
    return state
