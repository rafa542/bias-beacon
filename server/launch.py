# server/launch.py
import uvicorn

def launch():
    """Launches the Uvicorn server."""
    uvicorn.run("server.server:app", host="127.0.0.1", port=8000, reload=True)
