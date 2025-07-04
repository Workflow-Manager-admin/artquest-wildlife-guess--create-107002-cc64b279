#!/bin/bash
cd /home/kavia/workspace/code-generation/artquest-wildlife-guess--create-107002-cc64b279/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

