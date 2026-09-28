import time

def press_hotkey(keys: str) -> str:
    """Press a combination of keys (e.g. 'ctrl+w' to close tab, 'win' to open start menu)."""
    try:
        import pyautogui
        keys_list = [k.strip().lower() for k in keys.split('+')]
        pyautogui.hotkey(*keys_list)
        return f"Pressed hotkey: {keys}"
    except Exception as e:
        return f"Failed to press hotkey. Error: {str(e)}"

def type_text(text: str) -> str:
    """Type out text using the keyboard."""
    try:
        import pyautogui
        pyautogui.write(text, interval=0.01)
        return f"Typed text."
    except Exception as e:
        return f"Failed to type text. Error: {str(e)}"

def press_key(key: str) -> str:
    """Press a single key (e.g. 'enter', 'esc', 'win')."""
    try:
        import pyautogui
        pyautogui.press(key.lower().strip())
        return f"Pressed key: {key}"
    except Exception as e:
        return f"Failed to press key. Error: {str(e)}"

def move_mouse(x: int, y: int) -> str:
    """Move the mouse cursor to absolute screen coordinates (x, y)."""
    try:
        import pyautogui
        pyautogui.moveTo(x, y, duration=0.5)
        return f"Mouse moved to {x}, {y}"
    except Exception as e:
        return f"Failed to move mouse: {str(e)}"

def click_mouse(button: str = 'left', clicks: int = 1) -> str:
    """Click the mouse. Button can be 'left', 'right', or 'middle'."""
    try:
        import pyautogui
        pyautogui.click(button=button, clicks=clicks)
        return f"Clicked {button} mouse button {clicks} times."
    except Exception as e:
        return f"Failed to click mouse: {str(e)}"
