#!/bin/sh -l

set -e

node --version

if [ -n "$INPUT_WORKING_DIRECTORY" ]; then
    NODE_PATH="$INPUT_WORKING_DIRECTORY/node_modules" node /run.js $*
else
    NODE_PATH=node_modules node /run.js $*
fi
