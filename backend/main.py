import os
import sys
import json
import asyncio
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.pipeline import run_pipeline
from backend.mock_data import get_scenarios, get_scenario
from backend.splunk_client import SplunkClient
from backend.nim_client import call_nim

load_dotenv()

app = FastAPI(title="ThreatBrief")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs = {}


class AnalyzeRequest(BaseModel):
    alerts: List[dict]
    splunk_mode: bool = False


class AskRequest(BaseModel):
    question: str


def get_agent_order():
    return ["ingestor", "triager", "enricher", "analyst", "writer"]


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ThreatBrief"}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "running",
        "current_agent": "ingestor",
        "brief": None,
        "alerts": req.alerts,
        "splunk_mode": req.splunk_mode,
    }

    asyncio.create_task(_run_job(job_id, req.alerts, req.splunk_mode))
    return {"job_id": job_id}


def _run_pipeline_sync(job_id, alerts, splunk_mode):
    try:
        state = {
            "alerts": alerts,
            "triage": None, "enrichment": None,
            "analysis": None, "brief": None,
            "current_agent": "ingestor", "status": "running",
            "job_id": job_id, "splunk_mode": splunk_mode,
        }
        from backend.agents.ingestor import ingest_alerts
        from backend.agents.triager import triage_alerts
        from backend.agents.enricher import enrich_alerts
        from backend.agents.analyst import analyze_alerts
        from backend.agents.writer import write_brief

        state = ingest_alerts(state)
        if job_id in jobs:
            jobs[job_id].update({"current_agent": "triager", "status": "running"})

        state = triage_alerts(state)
        if job_id in jobs:
            jobs[job_id].update({"current_agent": "enricher", "status": "running"})

        state = enrich_alerts(state)
        if job_id in jobs:
            jobs[job_id].update({"current_agent": "analyst", "status": "running"})

        state = analyze_alerts(state)
        if job_id in jobs:
            jobs[job_id].update({"current_agent": "writer", "status": "running"})

        state = write_brief(state)
        if job_id in jobs:
            jobs[job_id].update({
                "current_agent": "writer", "status": "complete",
                "brief": state.get("brief"),
            })
    except Exception as e:
        if job_id in jobs:
            jobs[job_id]["status"] = "error"
            jobs[job_id]["error"] = str(e)


async def _run_job(job_id, alerts, splunk_mode):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _run_pipeline_sync, job_id, alerts, splunk_mode)


@app.get("/api/stream/{job_id}")
async def stream_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_stream():
        last_agent = None
        last_status = None
        while True:
            job = jobs.get(job_id)
            if not job:
                break

            agent = job.get("current_agent")
            status = job.get("status")

            if agent != last_agent or status != last_status:
                last_agent = agent
                last_status = status

                if status == "complete" and job.get("brief"):
                    data = json.dumps({
                        "event": "agent_update",
                        "agent": agent,
                        "status": status,
                    })
                    yield f"data: {data}\n\n"

                    brief_data = json.dumps({"event": "complete", "data": job["brief"]})
                    yield f"data: {brief_data}\n\n"
                    break
                elif status == "error":
                    data = json.dumps({"event": "error", "message": job.get("error", "")})
                    yield f"data: {data}\n\n"
                    break
                else:
                    data = json.dumps({
                        "event": "agent_update",
                        "agent": agent,
                        "status": status,
                    })
                    yield f"data: {data}\n\n"

            await asyncio.sleep(0.5)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/scenarios")
async def scenarios():
    return get_scenarios()


@app.post("/api/scenarios/{scenario_id}/run")
async def run_scenario(scenario_id: str):
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    job_id = str(uuid.uuid4())
    alerts = scenario["alerts"]
    jobs[job_id] = {
        "status": "running",
        "current_agent": "ingestor",
        "brief": None,
        "alerts": alerts,
        "splunk_mode": False,
    }

    asyncio.create_task(_run_job(job_id, alerts, False))
    return {"job_id": job_id, "scenario_name": scenario["name"]}


@app.post("/api/brief/{job_id}/ask")
async def ask_brief(job_id: str, req: AskRequest):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    brief = job.get("brief")
    if not brief:
        raise HTTPException(status_code=400, detail="Brief not ready yet")

    loop = asyncio.get_event_loop()
    try:
        system_prompt = "You are a SOC analyst. Answer this question about the incident."
        user_prompt = f"Incident Brief:\n{json.dumps(brief, indent=2)}\n\nQuestion: {req.question}"
        response = await loop.run_in_executor(None, call_nim, system_prompt, user_prompt)
        answer = response.choices[0].message.content
    except Exception:
        answer = f"Based on the incident brief: severity is {brief.get('severity', 'unknown')}, the affected systems include {', '.join(brief.get('affected_systems', [])[:3])}. Review the brief details and recommended actions for more specific guidance."

    return {"answer": answer}


@app.get("/api/splunk/alerts")
async def splunk_alerts():
    try:
        client = SplunkClient()
        alerts = client.search_alerts()
        return {"alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Splunk connection failed: {str(e)}")


@app.post("/api/splunk/inject")
async def inject_splunk(scenario_id: str = "lateral-movement"):
    from backend.mock_data import get_scenario
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    try:
        client = SplunkClient()
        result = client.inject_mock_events(scenario["alerts"])
        return {"status": "ok", "injected": result["injected"], "scenario": scenario_id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Splunk injection failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
