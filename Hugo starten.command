#!/bin/zsh
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
fi
echo "Hugo startet. Dieses Fenster bitte geöffnet lassen."
if [ ! -d node_modules/ical.js ]; then
  npm ci || exit 1
fi
node server.mjs &
jarvis_pid=$!
trap 'kill "$jarvis_pid" 2>/dev/null' EXIT INT TERM
sleep 1
open -a "Google Chrome" "http://127.0.0.1:4317"
wait "$jarvis_pid"
