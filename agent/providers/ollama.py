import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/chat"

async def chat_with_ollama(messages: list[dict], model: str, tools: list[dict] = None) -> dict:
    """Send a chat request to Ollama, optionally with tools."""
    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    if tools:
        payload["tools"] = tools

    async with httpx.AsyncClient(timeout=120) as client:
        try:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.ConnectError:
            return {"error": "Could not connect to Ollama. Is it running?"}
        except Exception as e:
            return {"error": str(e)}
