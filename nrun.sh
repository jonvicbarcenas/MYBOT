#!/bin/bash
nohup node --max-old-space-size=2048 index.js > output.log 2>&1 &

