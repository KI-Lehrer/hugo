FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
RUN npm install --global @anthropic-ai/claude-code
USER node
RUN python3 -m venv /home/node/.local/hugo-python && /home/node/.local/hugo-python/bin/pip install --no-cache-dir pypdf
USER root
