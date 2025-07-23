#!/usr/bin/env python3
import re

def fix_map_syntax(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern pour détecter les new Map avec une seule entrée
    pattern_single = r"new Map\(\[\s*\[\s*'([^']+)'\s*,\s*([^}]+})\s*\]\s*\]\)"
    
    def replace_single(match):
        key = match.group(1)
        value = match.group(2)
        return f"{{ '{key}': {value} }}"
    
    content = re.sub(pattern_single, replace_single, content, flags=re.DOTALL)
    
    # Pattern pour détecter les new Map avec plusieurs entrées
    pattern_multi = r"new Map\(\[\s*((?:\[\s*'[^']+'\s*,\s*[^}]+}\s*\]\s*,?\s*)+)\s*\]\)"
    
    def replace_multi(match):
        entries_text = match.group(1)
        # Extraire chaque entrée [key, value]
        entry_pattern = r"\[\s*'([^']+)'\s*,\s*([^}]+})\s*\]"
        entries = re.findall(entry_pattern, entries_text, re.DOTALL)
        
        object_pairs = []
        for key, value in entries:
            object_pairs.append(f"'{key}': {value}")
        
        return "{ " + ", ".join(object_pairs) + " }"
    
    content = re.sub(pattern_multi, replace_multi, content, flags=re.DOTALL)
    
    # Remplacer les new Map() vides
    content = re.sub(r'new Map\(\)', '{}', content)
    
    with open(file_path, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    fix_map_syntax("/root/red-tetris/client/src/components/GameRoom.test.tsx")
    print("Fixed all Map instances correctly")
