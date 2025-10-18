#!/bin/bash
set -e

# Loading Rust/Cargo environment
source "$HOME/.cargo/env"

# Reading .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
    exit 1
fi

# Setting Docker socket path for cross
export DOCKER_HOST=unix:///var/run/docker.sock

cross build --target aarch64-unknown-linux-gnu --release

rsync --progress target/aarch64-unknown-linux-gnu/release/pimond "${DEPLOY_HOST}:${DEPLOY_PATH}/"