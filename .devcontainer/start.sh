#!/usr/bin/env bash
set -euo pipefail
if ! curl -fsS http://127.0.0.1:4317/ >/dev/null 2>&1; then
  nohup npm start >/tmp/hugo.log 2>&1 &
fi
