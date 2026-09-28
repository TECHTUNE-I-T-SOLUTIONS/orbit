import webbrowser

def open_url(url: str) -> str:
    """Open a URL in the default browser."""
    try:
        # prepend https if missing
        if not url.startswith("http"):
            url = "https://" + url
        webbrowser.open(url)
        return f"Opened {url} in browser."
    except Exception as e:
        return f"Failed to open URL {url}. Error: {str(e)}"
