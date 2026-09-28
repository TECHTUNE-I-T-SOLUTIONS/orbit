import json
from agent.providers.ollama import chat_with_ollama
from agent.providers.cloud import chat_with_openai_compatible
from agent.tools.registry import TOOL_SCHEMAS, execute_tool

SYSTEM_PROMPT = """You are Orbit, a local AI desktop assistant running on the user's machine.
You have access to tools that can control the computer. 
If a user asks you to perform an action, use the appropriate tool.
Do not make up information.
Keep your responses natural, concise, and helpful."""

# Simple memory for the current session
conversation_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

async def dispatch_chat(messages, model, provider, api_key, tools):
    if provider == "local":
        return await chat_with_ollama(messages, model, tools=tools)
    elif provider == "openai":
        return await chat_with_openai_compatible(messages, model, api_key, "https://api.openai.com/v1/chat/completions", tools)
    elif provider == "groq":
        return await chat_with_openai_compatible(messages, model, api_key, "https://api.groq.com/openai/v1/chat/completions", tools)
    elif provider == "xai":
        return await chat_with_openai_compatible(messages, model, api_key, "https://api.x.ai/v1/chat/completions", tools)
    elif provider == "gemini":
        return await chat_with_openai_compatible(messages, model, api_key, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", tools)
    return {"error": "Unknown provider"}

async def process_message(user_message: str, model: str, provider: str, api_key: str) -> str:
    conversation_history.append({"role": "user", "content": user_message})
    
    response = await dispatch_chat(conversation_history, model, provider, api_key, tools=TOOL_SCHEMAS)
    
    if "error" in response:
        return f"System Error: {response['error']}"
    
    message = response.get("message", {})
    
    # If the model decided to call a tool
    if "tool_calls" in message and message["tool_calls"]:
        tool_results = []
        for tool_call in message["tool_calls"]:
            function = tool_call.get("function", {})
            name = function.get("name")
            arguments = function.get("arguments", {})
            
            # Execute tool
            result = execute_tool(name, arguments)
            
            # The model needs to know the result
            tool_results.append({
                "role": "tool",
                "tool_call_id": tool_call.get("id"),
                "name": name,
                "content": str(result)
            })
            
        # Append the tool call and results to history
        conversation_history.append(message)
        for tr in tool_results:
            conversation_history.append(tr)
            
        # Get final response from the model
        final_response = await dispatch_chat(conversation_history, model, provider, api_key, tools=TOOL_SCHEMAS)
        final_message = final_response.get("message", {})
        
        if final_message.get("content"):
            conversation_history.append(final_message)
            return final_message["content"]
        else:
            return "Task completed."
            
    # If no tool was called, just return the text response
    if message.get("content"):
        conversation_history.append(message)
        return message["content"]
        
    return "I didn't know how to respond to that."
