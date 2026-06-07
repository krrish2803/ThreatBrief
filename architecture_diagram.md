# ThreatBrief Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER (localhost:5173)                  │
│                    React + Tailwind + SSE Client                      │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP / SSE
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Vite Dev Server)                          │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────────┐     │
│  │AlertInput│ │PipelineStatus│ │Incident  │ │AskTheBrief      │     │
│  │(scenario │ │(agent        │ │Brief     │ │(Q&A chat)       │     │
│  │ buttons) │ │ progress)    │ │(summary) │ │                 │     │
│  └──────────┘ └──────────────┘ └──────────┘ └─────────────────┘     │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────────┐     │
│  │Confidence│ │MitreBadges   │ │IOCTable  │ │Timeline         │     │
│  │Score     │ │(MITRE ATT&CK)│ │(IOCs)    │ │(attack events)  │     │
│  └──────────┘ └──────────────┘ └──────────┘ └─────────────────┘     │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ POST /api/analyze
                            │ GET /api/stream/{job_id} (SSE)
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI - port 8000)                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  5-AGENT PIPELINE (LangGraph)                 │    │
│  │                                                              │    │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │    │
│  │  │ Ingestor │──►│ Triager  │──►│ Enricher │──►│ Analyst  │  │    │
│  │  │(validate │   │(AI triage│   │(MITRE +  │   │(timeline │  │    │
│  │  │ normalize│   │ classify)│   │ IOC ext.)│   │ blast    │  │    │
│  │  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘  │    │
│  │                                                    │         │    │
│  │                                                    ▼         │    │
│  │                                          ┌──────────────┐    │    │
│  │                                          │   Writer     │    │    │
│  │                                          │(exec summary │    │    │
│  │                                          │ + brief)     │    │    │
│  │                                          └──────────────┘    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐     │
│  │ SplunkClient │  │  nim_client    │  │    mock_data.py      │     │
│  │(REST + HEC)  │  │(NVIDIA NIM     │  │(3 attack scenarios)  │     │
│  │              │  │ Llama 3.1 70B) │  │ brute-force: 48     │     │
│  │ localhost    │  │                │  │ lateral-move: 11    │     │
│  │ :8089 / :8088│  │ build.nvidia.. │  │ ransomware: 117     │     │
│  └──────┬───────┘  └────────────────┘  └──────────────────────┘     │
└─────────┼────────────────────────────────────────────────────────────┘
          │                                    ▲
          ▼                                    │
┌──────────────────┐              ┌──────────────────────────────┐
│  SPLUNK ENTERPRISE│              │     NVIDIA NIM API           │
│  (localhost)      │              │  (cloud)                     │
│                   │              │  meta/llama-3.1-70b-instruct │
│  REST API :8089   │              │                              │
│  HEC      :8088   │              │  Returns: JSON responses     │
│  index: main      │              │  for each agent              │
└──────────────────┘              └──────────────────────────────┘

```

## Data Flow

```
1. User clicks a scenario button (or toggles Splunk)
       │
       ▼
2. POST /api/analyze { alerts, splunk_mode }
       │
       ▼
3. Backend creates job_id, starts pipeline in thread
       │
       ▼
4. Pipeline runs synchronously (updates jobs dict at each step):
   ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌────────┐
   │Ingestor │──►│ Triager │──►│Enricher  │──►│ Analyst │──►│ Writer │
   │validate │   │AI triage│   │MITRE+IOC │   │timeline │   │summary │
   └─────────┘   └─────────┘   └──────────┘   └─────────┘   └────────┘
       │
       ▼
5. SSE endpoint streams events: triager → enricher → analyst → writer → complete
       │
       ▼
6. Frontend renders: executive summary, severity, IOCs, MITRE, timeline, confidence
       │
       ▼
7. User can ask questions via POST /api/brief/{id}/ask (NVIDIA NIM answers)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Python, FastAPI, Uvicorn |
| Pipeline | LangGraph StateGraph |
| LLM | NVIDIA NIM (Llama 3.1 70B) |
| SIEM | Splunk Enterprise (REST API + HEC) |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Vercel (frontend), Render (backend) |
