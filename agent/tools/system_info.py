import platform
import psutil

def get_system_information() -> str:
    """Get basic system information (OS, CPU, Memory)."""
    uname = platform.uname()
    mem = psutil.virtual_memory()
    info = (
        f"System: {uname.system} {uname.release} ({uname.version})\n"
        f"Machine: {uname.machine}\n"
        f"Processor: {uname.processor}\n"
        f"Total Memory: {mem.total / (1024**3):.2f} GB\n"
        f"Available Memory: {mem.available / (1024**3):.2f} GB"
    )
    return info

import subprocess

def run_powershell_command(command: str) -> str:
    """Run a PowerShell command on the host machine. Useful for getting processes, killing processes, reading files, etc."""
    try:
        result = subprocess.run(["powershell", "-Command", command], capture_output=True, text=True, timeout=30)
        output = result.stdout + "\n" + result.stderr
        return output.strip() if output.strip() else "Command executed successfully (no output)."
    except subprocess.TimeoutExpired:
        return "Error: Command timed out."
    except Exception as e:
        return f"Error executing command: {str(e)}"
