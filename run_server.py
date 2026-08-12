#!/usr/bin/env python3
"""
run_server.py
One-command production host script for DayMind AI.
Serves FastAPI backend + ML Models + Glassmorphism React Frontend
"""

import os
import sys
import socket
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def get_available_port(start_port=8000, max_attempts=10):
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    return start_port


if __name__ == "__main__":
    # Allow port via command line argument or environment variable
    requested_port = None
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        requested_port = int(sys.argv[1])
    elif "PORT" in os.environ and os.environ["PORT"].isdigit():
        requested_port = int(os.environ["PORT"])

    target_port = requested_port or get_available_port(8000)

    print("=" * 60)
    print(" ⚡ DayMind AI - ML-Powered Productivity Scheduler ⚡")
    print("=" * 60)
    print(" ML Models Loaded from: ./models/")
    print(" Database: ./daymind.db (SQLite persistent storage)")
    print(f" Serving App at: http://localhost:{target_port}")
    print(" Press Ctrl+C to stop the server.")
    print("=" * 60 + "\n")

    uvicorn.run("app:app", host="0.0.0.0", port=target_port, reload=False)
