import os
import re
import uuid
import json
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class SplunkClient:
    def __init__(self):
        self.host = os.getenv("SPLUNK_HOST", "localhost")
        self.port = os.getenv("SPLUNK_PORT", "8089")
        self.hec_port = os.getenv("SPLUNK_HEC_PORT", "8088")
        self.username = os.getenv("SPLUNK_USERNAME", "admin")
        self.password = os.getenv("SPLUNK_PASSWORD", "")
        self.hec_token = os.getenv("SPLUNK_HEC_TOKEN", "")
        self.base_url = f"https://{self.host}:{self.port}"
        self.session_key = None

    def _get_session_key(self):
        url = f"{self.base_url}/services/auth/login"
        data = {"username": self.username, "password": self.password}
        resp = requests.post(url, data=data, verify=False, timeout=10)
        resp.raise_for_status()
        match = re.search(r'<sessionKey>(.*?)</sessionKey>', resp.text)
        if not match:
            raise RuntimeError(f"Failed to parse session key from Splunk: {resp.text[:200]}")
        self.session_key = match.group(1)

    def search_alerts(self):
        if not self.session_key:
            self._get_session_key()
        url = f"{self.base_url}/services/search/jobs"
        spl_query = (
            'search index=main (severity=critical OR severity=high) '
            'earliest=-7d | fields _time, src_ip, dest_ip, user, action, '
            'severity, event_type, host, message | head 100'
        )
        data = {
            "search": spl_query,
            "output_mode": "json",
            "exec_mode": "oneshot",
        }
        headers = {"Authorization": f"Splunk {self.session_key}"}
        resp = requests.post(url, data=data, headers=headers, verify=False, timeout=30)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        parsed = []
        for r in results:
            parsed.append({
                "_time": r.get("_time", ""),
                "src_ip": r.get("src_ip", ""),
                "dest_ip": r.get("dest_ip", ""),
                "user": r.get("user", ""),
                "action": r.get("action", ""),
                "severity": r.get("severity", "low"),
                "event_type": r.get("event_type", ""),
                "host": r.get("host", ""),
                "message": r.get("message", ""),
            })
        return parsed

    def inject_mock_events(self, events):
        url = f"https://{self.host}:{self.hec_port}/services/collector/event"
        channel = str(uuid.uuid4())
        headers = {
            "Authorization": f"Splunk {self.hec_token}",
            "X-Splunk-Request-Channel": channel,
        }
        for event in events:
            payload = {
                "index": os.getenv("SPLUNK_INDEX", "main"),
                "source": "threatbrief",
                "sourcetype": "_json",
                "event": event,
            }
            resp = requests.post(
                url, json=payload, headers=headers, verify=False, timeout=10
            )
            resp.raise_for_status()
        return {"status": "ok", "injected": len(events)}
