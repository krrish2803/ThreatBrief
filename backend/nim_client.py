import os
from openai import OpenAI

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
NIM_MODEL = "meta/llama-3.1-70b-instruct"


def get_client():
    api_key = os.getenv("NVIDIA_NIM_API_KEY")
    if not api_key:
        raise ValueError("NVIDIA_NIM_API_KEY not set in environment")
    return OpenAI(base_url=NIM_BASE_URL, api_key=api_key)


def call_nim(system_prompt, user_prompt, stream=False):
    client = get_client()
    response = client.chat.completions.create(
        model=NIM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=2048,
        stream=stream,
    )
    return response
