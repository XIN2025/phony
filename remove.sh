#!/bin/bash

# Confirm with the user before proceeding
echo "This script will remove // comments from all .go files in the current directory and subdirectories."
echo "Files will be modified in place. Are you sure? (y/N)"
read -r confirm
if [ "$confirm" != "y" ]; then
    echo "Aborted."
    exit 1
fi

# Find all .go files and process them
find . -type f -name '*.go' | while read -r file; do
    echo "Processing $file"
    # Use sed to remove // comments, but avoid // inside strings or URLs
    sed -i 's|^\s*//.*$||g; s|\([^"]\)//.*$|\1|g' "$file"
    if [ $? -ne 0 ]; then
        echo "Failed to process $file"
    fi
done

echo "Done."
