#!/bin/bash
set -e

# Loading Rust/Cargo environment
source "$HOME/.cargo/env"

SCRIPT_DIR="$(dirname "$0")"

# Reading .env file
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo ".env file not found in $SCRIPT_DIR!"
    exit 1
fi

# Setting Docker socket path for cross
export DOCKER_HOST=unix:///var/run/docker.sock

cross build --target aarch64-unknown-linux-musl --features vendored-openssl --release

rsync --progress "$SCRIPT_DIR/target/aarch64-unknown-linux-musl/release/pimond" "${DEPLOY_HOST}:${DEPLOY_PATH}/"