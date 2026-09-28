import httpx

async def chat_with_openai_compatible(messages: list[dict], model: str, api_key: str, base_url: str, tools: list[dict] = None) -> dict:
    """Generic provider for OpenAI, Groq, and Gemini's OpenAI-compatible endpoint."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    
    if tools:
        payload["tools"] = tools

    async with httpx.AsyncClient(timeout=120) as client:
        try:
            resp = await client.post(base_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return {"message": data["choices"][0]["message"]}
        except Exception as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                error_msg += f" - {e.response.text}"
            return {"error": f"API Error: {error_msg}"}
