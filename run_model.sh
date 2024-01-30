#!/bin/bash

# Check if an argument is provided
if [ $# -eq 0 ]; then
    echo "No word provided. Usage: ./run_model.sh [word]"
    exit 1
fi

python3 model/dummy_model.py "$1"
