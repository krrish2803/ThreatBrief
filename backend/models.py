from pydantic import BaseModel
from typing import List, Optional, TypedDict


class RawAlert(BaseModel):
    _time: str
    src_ip: str
    dest_ip: str
    user: str
    action: str
    severity: str
    event_type: str
    host: str
    message: str


class MitreTechnique(BaseModel):
    id: str
    name: str
    tactic: str


class IOC(BaseModel):
    type: str
    value: str


class TimelineEvent(BaseModel):
    timestamp: str
    event: str
    significance: str


class TriageResult(BaseModel):
    severity_level: str
    alert_count: int
    primary_event_type: str
    affected_hosts: List[str]
    affected_users: List[str]


class EnrichmentResult(BaseModel):
    mitre_techniques: List[MitreTechnique]
    iocs: List[IOC]
    threat_category: str


class AnalystResult(BaseModel):
    timeline: List[TimelineEvent]
    attack_chain: str
    blast_radius: str


class IncidentBrief(BaseModel):
    executive_summary: str
    what_happened: str
    affected_systems: List[str]
    mitre_mapping: List[MitreTechnique]
    ioc_list: List[IOC]
    timeline: List[TimelineEvent]
    severity: str
    confidence_score: int
    confidence_reasoning: str
    recommended_actions: List[str]


class PipelineState(TypedDict):
    alerts: List[dict]
    triage: Optional[dict]
    enrichment: Optional[dict]
    analysis: Optional[dict]
    brief: Optional[dict]
    current_agent: str
    status: str
    job_id: str
    splunk_mode: bool
