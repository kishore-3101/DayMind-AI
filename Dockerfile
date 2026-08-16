# Multi-stage Dockerfile for DayMind AI (Frontend + Python FastAPI ML Backend)

# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Python Backend & Production Application ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy codebase
COPY . .

# Copy built production frontend assets from Stage 1 into dist/
COPY --from=frontend-builder /app/dist ./dist

# Expose server port
EXPOSE 8000

# Environment port default
ENV PORT=8000

# Start server script (serves ML models, FastAPI API, SQLite DB, and React SPA)
CMD ["python3", "run_server.py"]
