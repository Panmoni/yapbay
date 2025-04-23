#!/bin/bash

# Script to count lines in all files under src/ directory
# Outputs files with more than 300 lines, ordered from most to least

# Set the directory to scan
SRC_DIR="src"

# Create a temporary file to store results
TEMP_FILE=$(mktemp)

# Find all files in the src directory, count lines, and store in temp file
find "$SRC_DIR" -type f | while read -r file; do
  # Count lines in the file
  line_count=$(wc -l < "$file")
  
  # If line count is over 300, add to our results
  if [ "$line_count" -gt 300 ]; then
    echo "$line_count $file" >> "$TEMP_FILE"
  fi
done

# Sort results numerically in descending order and display
echo "Files with more than 300 lines (sorted by line count):"
echo "-----------------------------------------------------"
sort -nr "$TEMP_FILE" | while read -r line; do
  echo "$line"
done

# Clean up
rm "$TEMP_FILE"