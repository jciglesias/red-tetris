#!/bin/bash

# Script pour corriger toutes les occurrences de new Map dans GameRoom.test.tsx

FILE="/root/red-tetris/client/src/components/GameRoom.test.tsx"

# Remplacer toutes les occurrences de new Map([...]) par des objets
python3 << 'EOF'
import re

with open('/root/red-tetris/client/src/components/GameRoom.test.tsx', 'r') as f:
    content = f.read()

# Pattern pour correspondre à new Map([ jusqu'à la fin des crochets fermants
content = re.sub(r'new Map\(\[\s*([^:]+):\s*', r'{ \'\1\': ', content)
content = re.sub(r'\]\s*\)', r' }', content)

# Corriger les syntaxes cassées
content = re.sub(r'room1_player1:', r"'room1_player1':", content)
content = re.sub(r'room1_player2:', r"'room1_player2':", content)
content = re.sub(r'room1_player3:', r"'room1_player3':", content)

with open('/root/red-tetris/client/src/components/GameRoom.test.tsx', 'w') as f:
    f.write(content)
EOF

echo "Script de correction terminé"
