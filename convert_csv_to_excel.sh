#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 /full/path/to/file.csv \"Web Page Title\""
    exit 1
fi

CSV_PATH="$1"
TITLE="$2"
CSV_BASENAME=$(basename "$CSV_PATH")
CSV_DIR=$(dirname "$CSV_PATH")

# Update config.js
cat > js/config.js <<EOF
window.CsvViewerConfig = {
    csvFilePath: "file://$CSV_PATH",
    pageTitle: "$TITLE"
};
EOF

# Start local server (if not already running)
python3 -m http.server 8000 &> /dev/null &
SERVER_PID=$!
sleep 2

# Run Puppeteer script to automate download
node export_with_puppeteer.js "http://localhost:8000" "$CSV_DIR/export.xls"

# Kill server after export
kill "$SERVER_PID"

