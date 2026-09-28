from .applications import open_application
from .browser import open_url
from .system_info import get_system_information, run_powershell_command
from .desktop_control import press_hotkey, type_text, press_key, move_mouse, click_mouse
from .system_info import get_system_information, run_powershell_command

# Map function names to actual Python functions
AVAILABLE_TOOLS = {
    "open_application": open_application,
    "open_url": open_url,
    "get_system_information": get_system_information,
    "run_powershell_command": run_powershell_command,
    "press_hotkey": press_hotkey,
    "type_text": type_text,
    "press_key": press_key,
    "move_mouse": move_mouse,
    "click_mouse": click_mouse
}

# Define schemas for Ollama
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "open_application",
            "description": "Open a desktop application by name (e.g. chrome, notepad).",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_name": {
                        "type": "string",
                        "description": "The name of the application to open."
                    }
                },
                "required": ["app_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_url",
            "description": "Open a URL in the user's default browser.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to open."
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_information",
            "description": "Get basic system information (OS, CPU, Memory).",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_powershell_command",
            "description": "Run a powershell command on the user's Windows machine. Use this to find processes (Get-Process), kill tabs/processes (Stop-Process), manage files, or get deep system context.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The exact PowerShell command to run."
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "press_hotkey",
            "description": "Press a combination of keys on the keyboard (e.g., 'ctrl+w' to close tab, 'win+d' to show desktop, 'alt+f4' to close app).",
            "parameters": {
                "type": "object",
                "properties": {
                    "keys": {
                        "type": "string",
                        "description": "The hotkey combination separated by '+' (e.g., 'ctrl+w')."
                    }
                },
                "required": ["keys"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "type_text",
            "description": "Type a string of text using the keyboard.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to type."
                    }
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "press_key",
            "description": "Press a single key on the keyboard (e.g., 'enter', 'esc', 'win').",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "The key to press."
                    }
                },
                "required": ["key"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "move_mouse",
            "description": "Move the mouse cursor to absolute screen coordinates (x, y).",
            "parameters": {
                "type": "object",
                "properties": {
                    "x": {
                        "type": "integer",
                        "description": "The x coordinate."
                    },
                    "y": {
                        "type": "integer",
                        "description": "The y coordinate."
                    }
                },
                "required": ["x", "y"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "click_mouse",
            "description": "Click a mouse button.",
            "parameters": {
                "type": "object",
                "properties": {
                    "button": {
                        "type": "string",
                        "description": "The mouse button to click ('left', 'right', 'middle'). Default is 'left'."
                    },
                    "clicks": {
                        "type": "integer",
                        "description": "Number of clicks. Default is 1."
                    }
                }
            }
        }
    }
]

def execute_tool(name: str, arguments) -> str:
    if name not in AVAILABLE_TOOLS:
        return f"Error: Tool {name} not found."
    
    try:
        if isinstance(arguments, str):
            import json
            arguments = json.loads(arguments)
            
        func = AVAILABLE_TOOLS[name]
        return func(**arguments)
    except Exception as e:
        return f"Error executing {name}: {str(e)}"
