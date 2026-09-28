import subprocess
import os
import platform

def open_application(app_name: str) -> str:
    """Open an application by name."""
    system = platform.system()
    try:
        app_name_lower = app_name.lower().strip()
        if system == "Windows":
            # Map common names to executables
            app_map = {
                "edge": "msedge",
                "chrome": "chrome",
                "firefox": "firefox",
                "word": "winword",
                "excel": "excel",
                "powerpoint": "powerpnt",
                "notepad": "notepad",
                "calculator": "calc"
            }
            exe_name = app_map.get(app_name_lower, app_name)
            res = subprocess.run(["cmd", "/c", "start", "", exe_name], capture_output=True, text=True)
            if "The system cannot find the file" in res.stderr or res.returncode != 0:
                raise Exception(f"App '{exe_name}' not found by start command.")
        elif system == "Darwin":
            subprocess.run(["open", "-a", app_name], check=True)
        else:
            subprocess.run([app_name_lower], check=True)
        return f"Opened application {app_name}."
    except Exception as e:
        if system == "Windows":
            try:
                import pyautogui
                import time
                pyautogui.press('win')
                time.sleep(0.5)
                pyautogui.write(app_name, interval=0.01)
                time.sleep(1)
                pyautogui.press('enter')
                return f"Attempted to open '{app_name}' via Windows Start menu fallback."
            except Exception as auto_e:
                pass
        return f"Failed to open {app_name}. Error: {str(e)}"
