# ThreatBrief

AI-powered security incident briefing system. Connects to Splunk Enterprise, pulls SIEM alerts, runs them through a 5-agent LangGraph pipeline powered by NVIDIA NIM (Llama 3.1 70B), and generates structured incident briefs with MITRE ATT&CK mapping, IOC extraction, attack timelines, confidence scoring, and AI-written executive summaries.

![Architecture](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB?logo=react)
![LLM](https://img.shields.io/badge/LLM-NVIDIA_NIM-76B900?logo=nvidia)
![SIEM](https://img.shields.io/badge/SIEM-Splunk-000000?logo=splunk)

## Features

- **3 Built-in Attack Scenarios**: Brute Force (48 alerts), Lateral Movement (11 alerts), Ransomware (117 alerts)
- **5-Agent AI Pipeline**: Ingestor → Triager → Enricher → Analyst → Writer
- **MITRE ATT&CK Mapping**: Automatic technique identification and mapping
- **IOC Extraction**: Pulls IPs, domains, hashes, usernames from alerts
- **Timeline Reconstruction**: Chronological attack timeline with significance ratings
- **Confidence Scoring**: AI-evaluated confidence with reasoning
- **Ask The Brief**: Chat with the brief using natural language questions
- **Live Splunk Integration**: Pull real alerts from your Splunk instance
- **SSE Streaming**: Real-time pipeline progress via Server-Sent Events

## Quick Start (Local)

### Prerequisites

- Python 3.9+
- Node.js 18+
- NVIDIA NIM API key (free from [build.nvidia.com](https://build.nvidia.com))
- (Optional) Splunk Enterprise for live mode

### 1. Clone and Set Up Environment

```bash
git clone https://github.com/krrish2803/ThreatBrief.git
cd ThreatBrief
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NVIDIA_NIM_API_KEY=nvapi-your-key-here

# Splunk (optional - mock data works without it)
SPLUNK_HOST=localhost
SPLUNK_PORT=8089
SPLUNK_HEC_PORT=8088
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=your_password
SPLUNK_INDEX=main
SPLUNK_HEC_TOKEN=your-hec-token
```

### 2. Install Backend Dependencies

```bash
# Use a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

If you get an "externally-managed-environment" error:

```bash
pip install --break-system-packages -r requirements.txt
```

### 3. Start the Backend

```bash
uvicorn backend.main:app --reload --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","service":"ThreatBrief"}
```

### 4. Install and Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the App

Navigate to **http://localhost:5173** in your browser.

## Testing the App

### Without Splunk (Recommended First Run)

1. The app loads with 3 scenario buttons: **Brute Force**, **Lateral Movement**, **Ransomware**
2. Click any scenario button to start the pipeline
3. Watch the pipeline stepper animate: Ingestor → Triager → Enricher → Analyst → Writer
4. After ~30-60 seconds, the incident brief populates with:
   - Executive summary and severity badge
   - Affected systems list
   - Recommended actions
   - MITRE ATT&CK techniques (right panel)
   - Indicators of Compromise (right panel)
   - Attack timeline (right panel)
   - Confidence score ring (right panel)
5. Type questions in "Ask The Brief" to get AI answers about the incident

### With Live Splunk

1. Start Splunk: `/Applications/Splunk/bin/splunk start`
2. Enable HEC on port 8088 in Splunk settings
3. Ensure `.env` has your Splunk credentials and HEC token
4. Toggle **"Use Live Splunk"** on in the app
5. Click **"Fetch & Analyze"** — pulls alerts from Splunk and runs the pipeline

### Injecting Mock Data into Splunk

To test the live Splunk flow with data:

```bash
curl -X POST "http://localhost:8000/api/splunk/inject?scenario_id=lateral-movement"
```

This injects 11 lateral movement alerts into your Splunk `main` index. Then toggle Splunk on and click **"Fetch & Analyze"**.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/scenarios` | List mock scenarios |
| POST | `/api/scenarios/{id}/run` | Run a mock scenario |
| POST | `/api/analyze` | Analyze custom alerts |
| GET | `/api/stream/{job_id}` | SSE stream for pipeline progress |
| POST | `/api/brief/{job_id}/ask` | Ask a question about the brief |
| GET | `/api/splunk/alerts` | Fetch alerts from Splunk |
| POST | `/api/splunk/inject?scenario_id={id}` | Inject mock alerts into Splunk |

## Project Structure

```
threatbrief/
├── backend/
│   ├── main.py              # FastAPI server + SSE routes
│   ├── pipeline.py          # LangGraph StateGraph pipeline
│   ├── nim_client.py        # NVIDIA NIM API client
│   ├── splunk_client.py     # Splunk REST API + HEC client
│   ├── mock_data.py         # 3 attack scenarios (48/11/117 alerts)
│   ├── models.py            # Pydantic models
│   └── agents/
│       ├── ingestor.py      # Alert validation & normalization
│       ├── triager.py       # AI severity triage & classification
│       ├── enricher.py      # MITRE ATT&CK mapping & IOC extraction
│       ├── analyst.py       # Timeline & blast radius analysis
│       └── writer.py        # Executive summary & brief compilation
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── config.js          # API URL (VITE_API_URL)
│       ├── index.css
│       └── components/
│           ├── AlertInput.jsx      # Scenario buttons & Splunk toggle
│           ├── PipelineStatus.jsx   # Agent progress stepper
│           ├── IncidentBrief.jsx    # Executive summary & details
│           ├── MitreBadges.jsx      # MITRE ATT&CK technique badges
│           ├── Timeline.jsx         # Attack timeline
│           ├── IOCTable.jsx         # Indicators of Compromise
│           ├── ConfidenceScore.jsx  # Animated confidence ring
│           └── AskTheBrief.jsx      # Q&A chat interface
├── .env.example
├── .gitignore
├── requirements.txt
├── render.yaml
└── README.md
```

## Architecture

| Component | Technology |
|-----------|------------|
| Backend | Python, FastAPI (port 8000) |
| LLM | NVIDIA NIM — `meta/llama-3.1-70b-instruct` |
| SIEM | Splunk Enterprise REST API (8089), HEC (8088) |
| Frontend | React 18 + Tailwind CSS, Vite (port 5173) |
| Streaming | Server-Sent Events (SSE) |
| Pipeline | LangGraph StateGraph (synchronous, thread-based) |

### Pipeline Agents

| Agent | Responsibility |
|-------|---------------|
| **Ingestor** | Validates and normalizes raw alerts |
| **Triager** | AI-powered severity triage and alert classification |
| **Enricher** | MITRE ATT&CK mapping and IOC extraction |
| **Analyst** | Chronological timeline reconstruction and blast radius assessment |
| **Writer** | Executive summary generation and final brief compilation |

## Troubleshooting

### Backend won't start (port in use)
```bash
kill -9 $(lsof -ti:8000)
uvicorn backend.main:app --reload --port 8000
```

### "externally-managed-environment" error
```bash
pip install --break-system-packages -r requirements.txt
```

### NIM API is slow
Each agent makes an LLM call (~20-30s). Full pipeline for 11 alerts takes ~30-60s. For 117 alerts (ransomware), expect 2-3 minutes.

### Frontend can't reach backend
Ensure `VITE_API_URL` is set correctly in `frontend/src/config.js` or as an environment variable. Default: `http://localhost:8000`

### Splunk connection fails
- Verify Splunk is running: `/Applications/Splunk/bin/splunk status`
- Verify credentials in `.env`
- If password was changed, update `.env`
- Splunk must be reachable from the machine running the backend

## Deployment

### Vercel (Frontend) — Mock Scenarios Only

The frontend is deployed at **https://threat-brief-six.vercel.app**.

**Note:** The deployed version supports the 3 built-in mock scenarios (Brute Force, Lateral Movement, Ransomware) which work fully. **Live Splunk mode will not work** on Vercel because the Render backend cannot reach your local Splunk instance (`localhost:8089`).

To configure on Vercel:
- **Root Directory:** `frontend`
- **Framework:** Vite (auto-detected)
- **Build Command:** `npm run build` (default)
- **Env Variable:** `VITE_API_URL` = your backend URL (or `http://localhost:8000` for local dev)

### Render (Backend)

The backend API is deployed at **https://threatbrief-kmsz.onrender.com**.

**Note:** The backend can fetch Splunk alerts only when running locally alongside Splunk. On Render, it uses mock data via the scenario endpoints.

To configure on Render:
- **Root Directory:** *(leave empty — repo root)*
- **Runtime:** Python
- **Build Command:** `pip install --break-system-packages -r requirements.txt`
- **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Env Variables:** `NVIDIA_NIM_API_KEY`, `SPLUNK_HOST`, `SPLUNK_PORT`, `SPLUNK_USERNAME`, `SPLUNK_PASSWORD`, `SPLUNK_HEC_TOKEN`

### Splunk — Local Only

Splunk integration only works when running the backend locally on the same machine as Splunk:

```bash
# Terminal 1: Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

Then open `http://localhost:5173`, toggle **Use Live Splunk** on, and click **Fetch & Analyze**.

## License

MIT
