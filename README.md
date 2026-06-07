# ThreatBrief

AI-powered security incident briefing system. Connects to Splunk Enterprise, pulls SIEM alerts, runs them through a 5-agent LangGraph pipeline powered by NVIDIA NIM, and generates structured incident briefs with MITRE ATT&CK mapping, IOC extraction, attack timelines, confidence scoring, and AI-written executive summaries.

## Quick Start

1. **Install Splunk Enterprise** from [splunk.com/download](https://www.splunk.com/download) (macOS .dmg)

2. **Start Splunk:**
   ```bash
   cd /Applications/Splunk/bin && ./splunk start
   ```

3. **Configure HEC:**
   - Open Splunk web at `localhost:8000`, login as admin
   - Settings → Data Inputs → HTTP Event Collector → Global Settings → Enable HEC
   - Create new HEC token: Settings → Data Inputs → HTTP Event Collector → New Token
   - Name: `threatbrief`, allowed index: `main`
   - Copy token into `.env` as `SPLUNK_HEC_TOKEN`

4. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your NVIDIA NIM API key and Splunk credentials
   ```

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Start the backend:**
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

7. **Start the frontend:**
   ```bash
   cd frontend && npm install && npm run dev
   ```

8. Open `http://localhost:5173` in your browser.

## Demo Flow

1. App loads with three scenario buttons visible immediately
2. Click "Ransomware Indicators" to start a pipeline
3. Pipeline stepper animates across: Ingestor → Triager → Enricher → Analyst → Writer
4. Incident brief populates with severity badge, executive summary, technical details, and actions
5. MITRE ATT&CK badges and IOC table fill the right panel
6. Confidence score ring animates to its value
7. Type questions in "Ask The Brief" to get AI answers about the incident
8. Toggle "Use Live Splunk" to pull real events from your local Splunk instance

## Architecture

- **Backend**: Python, FastAPI (port 8000), LangGraph, NVIDIA NIM API
- **LLM**: NVIDIA NIM — `meta/llama-3.1-70b-instruct` via OpenAI-compatible SDK
- **SIEM**: Splunk Enterprise REST API (localhost:8089), HEC (localhost:8088)
- **Frontend**: React + Tailwind CSS, Vite dev server (port 5173)
- **Streaming**: Server-Sent Events (SSE)

### Pipeline Agents

| Agent | Responsibility |
|-------|---------------|
| **Ingestor** | Validates and normalizes raw alerts |
| **Triager** | AI-powered severity triage and alert classification |
| **Enricher** | MITRE ATT&CK mapping and IOC extraction |
| **Analyst** | Chronological timeline reconstruction and blast radius assessment |
| **Writer** | Executive summary generation and final brief compilation |

## Project Structure

```
threatbrief/
├── backend/
│   ├── main.py              # FastAPI server + SSE routes
│   ├── nim_client.py        # NVIDIA NIM client
│   ├── splunk_client.py     # Splunk REST API client
│   ├── pipeline.py          # LangGraph StateGraph pipeline
│   ├── mock_data.py         # 3 attack scenarios
│   ├── models.py            # Pydantic models
│   └── agents/
│       ├── ingestor.py
│       ├── triager.py
│       ├── enricher.py
│       ├── analyst.py
│       └── writer.py
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── components/
│           ├── AlertInput.jsx
│           ├── PipelineStatus.jsx
│           ├── IncidentBrief.jsx
│           ├── MitreBadges.jsx
│           ├── Timeline.jsx
│           ├── IOCTable.jsx
│           ├── ConfidenceScore.jsx
│           └── AskTheBrief.jsx
├── .env
├── requirements.txt
└── README.md
```
