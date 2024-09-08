#!/bin/bash

# Function to read user input with a prompt
read_input() {
  local prompt="$1"
  local result
  read -rp "$prompt" result
  echo "$result"
}

# Read user inputs
MAJOR=$(read_input "Enter major version: ")
MINOR=$(read_input "Enter minor version: ")
PATCH=$(read_input "Enter patch version: ")

# Validate inputs (ensure they are integers)
if ! [[ "$MAJOR" =~ ^[0-9]+$ ]] || ! [[ "$MINOR" =~ ^[0-9]+$ ]] || ! [[ "$PATCH" =~ ^[0-9]+$ ]]; then
  echo "Error: Version numbers must be integers."
  exit 1
fi

# Get current date in DDMMYYYY format
DATE=$(date +"%d%m%Y")

# Generate version code
VERSION="${MAJOR}.${MINOR}.${PATCH}-rc.${DATE}"

# Output the version code
echo "Generated Version Code: $VERSION"

