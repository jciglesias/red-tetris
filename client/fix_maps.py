#!/usr/bin/env python3
import re

# Read the file
with open('/root/red-tetris/client/src/components/GameRoom.test.tsx', 'r') as f:
    content = f.read()

# Replace all new Map([['key', value]]) patterns with {'key': value} pattern
# This regex matches the pattern and captures the key and value
pattern = r"new Map\(\[\[(.*?)\]\]\)"
matches = re.findall(pattern, content, re.DOTALL)

for match in matches:
    # Split by '], [' to handle multiple entries
    entries = match.split('], [')
    
    # Convert each entry from ['key', value] to 'key': value
    object_entries = []
    for entry in entries:
        # Remove quotes and brackets, then split
        clean_entry = entry.strip("[]'\"")
        if "', " in clean_entry:
            key_value = clean_entry.split("', ", 1)
            if len(key_value) == 2:
                key = key_value[0].strip("'\"")
                value = key_value[1]
                object_entries.append(f"'{key}': {value}")
    
    if object_entries:
        replacement = "{ " + ", ".join(object_entries) + " }"
        old_pattern = f"new Map([[{match}]])"
        content = content.replace(old_pattern, replacement)

# Also handle simple new Map() cases
content = re.sub(r'new Map\(\)', '{}', content)

# Write back the file
with open('/root/red-tetris/client/src/components/GameRoom.test.tsx', 'w') as f:
    f.write(content)

print("Fixed all Map instances")
