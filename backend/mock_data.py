import copy

SCENARIOS = [
    {
        "id": "brute-force",
        "name": "Brute Force + Privilege Escalation",
        "description": "47 failed login attempts from external IP followed by successful admin login and privilege escalation via net localgroup on domain controller.",
        "alerts": (
            [
                {
                    "_time": f"2026-06-07 0{str(h).zfill(2)}:{str(m).zfill(2)}:00",
                    "src_ip": "192.168.1.105",
                    "dest_ip": "10.0.0.10",
                    "user": "Administrator",
                    "action": "LOGIN_FAILED",
                    "severity": "high",
                    "event_type": "Authentication",
                    "host": "dc01.corp.local",
                    "message": f"Failed login attempt #{i} for user Administrator from 192.168.1.105",
                }
                for i, (h, m) in enumerate(
                    [(9, 0), (9, 2), (9, 5), (9, 7), (9, 10),
                     (9, 12), (9, 15), (9, 17), (9, 20), (9, 22),
                     (9, 25), (9, 27), (9, 30), (9, 32), (9, 35),
                     (9, 37), (9, 40), (9, 42), (9, 45), (9, 47),
                     (9, 50), (9, 52), (9, 55), (9, 57),
                     (10, 0), (10, 2), (10, 5), (10, 7), (10, 10),
                     (10, 12), (10, 15), (10, 17), (10, 20), (10, 22),
                     (10, 25), (10, 27), (10, 30), (10, 32), (10, 35),
                     (10, 37), (10, 40), (10, 42), (10, 45), (10, 47),
                     (10, 50), (10, 52), (10, 55)]
                )
            ][:46]
        )
        + [
            {
                "_time": "2026-06-07 10:57:00",
                "src_ip": "192.168.1.105",
                "dest_ip": "10.0.0.10",
                "user": "Administrator",
                "action": "LOGIN_SUCCESS",
                "severity": "critical",
                "event_type": "Authentication",
                "host": "dc01.corp.local",
                "message": "Successful admin login from 192.168.1.105 after 47 failed attempts",
            },
            {
                "_time": "2026-06-07 11:00:00",
                "src_ip": "192.168.1.105",
                "dest_ip": "10.0.0.10",
                "user": "Administrator",
                "action": "PRIVILEGE_ESCALATION",
                "severity": "critical",
                "event_type": "Process Execution",
                "host": "dc01.corp.local",
                "message": "net localgroup Administrators corp\\svc_backup /add executed by Administrator from 192.168.1.105",
            },
        ],
    },
    {
        "id": "lateral-movement",
        "name": "Lateral Movement + Data Exfiltration",
        "description": "Internal host scanning subnet, establishing SMB connections to 6 servers, then exfiltrating 2.3GB of data to an external IP.",
        "alerts": [
            {
                "_time": "2026-06-07 08:30:00",
                "src_ip": "10.0.0.45",
                "dest_ip": "10.0.0.0/24",
                "user": "svc_monitor",
                "action": "PORT_SCAN",
                "severity": "high",
                "event_type": "Network",
                "host": "srv-monitor.internal",
                "message": "Internal host 10.0.0.45 initiated port scan across subnet 10.0.0.0/24",
            },
        ]
        + [
            {
                "_time": "2026-06-07 08:35:00",
                "src_ip": "10.0.0.45",
                "dest_ip": f"10.0.0.{i}",
                "user": "svc_monitor",
                "action": "SMB_CONNECT",
                "severity": "high",
                "event_type": "Network",
                "host": f"srv-{chr(96+i)}.internal",
                "message": f"SMB connection established from 10.0.0.45 to 10.0.0.{i}",
            }
            for i in range(11, 17)
        ]
        + [
            {
                "_time": "2026-06-07 08:40:00",
                "src_ip": "10.0.0.45",
                "dest_ip": "10.0.0.11",
                "user": "svc_monitor",
                "action": "FILE_ACCESS",
                "severity": "high",
                "event_type": "File",
                "host": "srv-a.internal",
                "message": "Bulk read of 500MB from \\\\srv-a.internal\\finance\\reports_q2.xlsx",
            },
            {
                "_time": "2026-06-07 08:45:00",
                "src_ip": "10.0.0.45",
                "dest_ip": "10.0.0.12",
                "user": "svc_monitor",
                "action": "FILE_ACCESS",
                "severity": "high",
                "event_type": "File",
                "host": "srv-b.internal",
                "message": "Bulk read of 400MB from \\\\srv-b.internal\\hr\\employee_records.db",
            },
            {
                "_time": "2026-06-07 08:50:00",
                "src_ip": "10.0.0.45",
                "dest_ip": "10.0.0.13",
                "user": "svc_monitor",
                "action": "FILE_ACCESS",
                "severity": "high",
                "event_type": "File",
                "host": "srv-c.internal",
                "message": "Bulk read of 600MB from \\\\srv-c.internal\\legal\\case_files",
            },
            {
                "_time": "2026-06-07 09:00:00",
                "src_ip": "10.0.0.45",
                "dest_ip": "185.234.219.33",
                "user": "svc_monitor",
                "action": "DATA_EXFIL",
                "severity": "critical",
                "event_type": "Network",
                "host": "srv-monitor.internal",
                "message": "2.3GB data transfer from 10.0.0.45 to external IP 185.234.219.33 on port 443",
            },
        ],
    },
    {
        "id": "ransomware",
        "name": "Ransomware Indicators",
        "description": "Ransomware attack chain: shadow copy deletion, mass file encryption (.locked), and network share encryption detected across the environment.",
        "alerts": (
            [
                {
                    "_time": "2026-06-07 02:10:00",
                    "src_ip": "10.0.0.88",
                    "dest_ip": "10.0.0.88",
                    "user": "SYSTEM",
                    "action": "PROCESS_START",
                    "severity": "critical",
                    "event_type": "Process Execution",
                    "host": "srv-db.internal",
                    "message": "vssadmin.exe Delete Shadows /All /Quiet executed by SYSTEM",
                },
                {
                    "_time": "2026-06-07 02:12:00",
                    "src_ip": "10.0.0.88",
                    "dest_ip": "10.0.0.88",
                    "user": "SYSTEM",
                    "action": "PROCESS_START",
                    "severity": "critical",
                    "event_type": "Process Execution",
                    "host": "srv-db.internal",
                    "message": "bcdedit.exe /set {default} recoveryenabled No executed by SYSTEM",
                },
                {
                    "_time": "2026-06-07 02:12:30",
                    "src_ip": "10.0.0.88",
                    "dest_ip": "10.0.0.88",
                    "user": "SYSTEM",
                    "action": "PROCESS_START",
                    "severity": "critical",
                    "event_type": "Process Execution",
                    "host": "srv-db.internal",
                    "message": "wbadmin.exe delete catalog -quiet executed by SYSTEM",
                },
            ]
            + [
                {
                    "_time": f"2026-06-07 02:{str(m).zfill(2)}:{str(s).zfill(2)}",
                    "src_ip": "10.0.0.88",
                    "dest_ip": f"10.0.0.{100 + (i % 50)}",
                    "user": "SYSTEM",
                    "action": "FILE_RENAME",
                    "severity": "high",
                    "event_type": "File",
                    "host": f"workstation-{i % 20}.internal",
                    "message": f"File renamed: example_document_{i}.pdf -> example_document_{i}.pdf.locked",
                }
                for i, (m, s) in enumerate(
                    [(15, 0), (15, 5), (15, 10), (15, 15), (15, 20),
                     (15, 25), (15, 30), (15, 35), (15, 40), (15, 45),
                     (15, 50), (15, 55),
                     (16, 0), (16, 5), (16, 10), (16, 15), (16, 20),
                     (16, 25), (16, 30), (16, 35), (16, 40), (16, 45),
                     (16, 50), (16, 55),
                     (17, 0), (17, 5), (17, 10), (17, 15), (17, 20),
                     (17, 25), (17, 30), (17, 35), (17, 40), (17, 45),
                     (17, 50), (17, 55),
                     (18, 0), (18, 5), (18, 10), (18, 15), (18, 20),
                     (18, 25), (18, 30), (18, 35), (18, 40), (18, 45),
                     (18, 50), (18, 55),
                     (19, 0), (19, 5), (19, 10), (19, 15), (19, 20),
                     (19, 25), (19, 30), (19, 35), (19, 40), (19, 45),
                     (19, 50), (19, 55),
                     (20, 0), (20, 5), (20, 10), (20, 15), (20, 20),
                     (20, 25), (20, 30), (20, 35), (20, 40), (20, 45),
                     (20, 50), (20, 55),
                     (21, 0), (21, 5), (21, 10), (21, 15), (21, 20),
                     (21, 25), (21, 30), (21, 35), (21, 40), (21, 45),
                     (21, 50), (21, 55),
                     (22, 0), (22, 5), (22, 10), (22, 15), (22, 20),
                     (22, 25), (22, 30), (22, 35), (22, 40), (22, 45),
                     (22, 50), (22, 55),
                     (23, 0), (23, 5), (23, 10), (23, 15), (23, 20),
                     (23, 25), (23, 30), (23, 35), (23, 40), (23, 45),
                     (23, 50), (23, 55)]
                )
            ]
        )
        + [
            {
                "_time": "2026-06-07 02:20:00",
                "src_ip": "10.0.0.88",
                "dest_ip": f"10.0.0.{100 + i}",
                "user": "SYSTEM",
                "action": "SHARE_ENCRYPT",
                "severity": "critical",
                "event_type": "File",
                "host": f"workstation-{i}.internal",
                "message": f"Network share \\\\10.0.0.{100+i}\\documents\\ encrypted with .locked extension",
            }
            for i in range(5)
        ]
        + [
            {
                "_time": "2026-06-07 02:25:00",
                "src_ip": "10.0.0.88",
                "dest_ip": "10.0.0.88",
                "user": "SYSTEM",
                "action": "NOTE_DROPPED",
                "severity": "critical",
                "event_type": "File",
                "host": "srv-db.internal",
                "message": "Ransom note README_TO_DECRYPT.txt dropped on desktop of srv-db.internal",
            },
        ],
    },
]


def get_scenario(scenario_id):
    for s in SCENARIOS:
        if s["id"] == scenario_id:
            return copy.deepcopy(s)
    return None


def get_scenarios():
    return [
        {"id": s["id"], "name": s["name"], "description": s["description"]}
        for s in SCENARIOS
    ]
