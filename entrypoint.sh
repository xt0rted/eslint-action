#!/bin/sh

set -e

node --version

if [ -n "$RUN_DIR" ]; then
    NODE_PATH="$RUN_DIR/node_modules" node /run.js $*
else
    NODE_PATH=node_modules node /run.js $*
fi
