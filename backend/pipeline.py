import asyncio
from langgraph.graph import StateGraph, START, END
from backend.models import PipelineState
from backend.agents.ingestor import ingest_alerts
from backend.agents.triager import triage_alerts
from backend.agents.enricher import enrich_alerts
from backend.agents.analyst import analyze_alerts
from backend.agents.writer import write_brief


def build_pipeline():
    workflow = StateGraph(PipelineState)

    workflow.add_node("ingestor", ingest_alerts)
    workflow.add_node("triager", triage_alerts)
    workflow.add_node("enricher", enrich_alerts)
    workflow.add_node("analyst", analyze_alerts)
    workflow.add_node("writer", write_brief)

    workflow.add_edge(START, "ingestor")
    workflow.add_edge("ingestor", "triager")
    workflow.add_edge("triager", "enricher")
    workflow.add_edge("enricher", "analyst")
    workflow.add_edge("analyst", "writer")
    workflow.add_edge("writer", END)

    return workflow.compile()


pipeline = build_pipeline()


async def run_pipeline(alerts, splunk_mode=False, job_id=None, jobs_store=None):
    initial_state = {
        "alerts": alerts,
        "triage": None,
        "enrichment": None,
        "analysis": None,
        "brief": None,
        "current_agent": "ingestor",
        "status": "running",
        "job_id": job_id,
        "splunk_mode": splunk_mode,
        "jobs_store": jobs_store,
    }

    result = await pipeline.ainvoke(initial_state)
    return result
