# Système de Reconnexion Red Tetris

## Vue d'ensemble

Le système de reconnexion permet aux joueurs de se reconnecter automatiquement ou manuellement à une partie après une déconnexion (par exemple, lors d'un refresh de la page).

## Fonctionnalités

### 1. Reconnexion Automatique
- Se déclenche automatiquement lors d'une nouvelle connexion si des données de reconnexion existent
- Utilise un token de reconnexion stocké dans le localStorage
- Restaure l'état complet du jeu (score, niveau, position des adversaires, messages du chat)

### 2. Reconnexion Manuelle
- Bouton "🔄 Reconnect" disponible quand le joueur n'est pas connecté
- Permet de tenter une reconnexion avec les dernières données sauvegardées

## Implémentation Technique

### Events Socket.IO

#### Client vers Serveur
```javascript
socket.emit('request-reconnection', {
  roomName: 'room1',
  playerName: 'player1',
  reconnectionToken: 'your-token'
});
```

#### Serveur vers Client
```javascript
// Succès de la reconnexion
socket.on('reconnection-success', (data) => {
  // data contient:
  // - reconnectionToken: nouveau token
  // - gameState: état actuel du jeu
  // - playerReady: statut du joueur
  // - opponents: liste des adversaires
  // - score, level: scores actuels
  // - messages: historique du chat
});

// Échec de la reconnexion
socket.on('reconnection-error', (data) => {
  // data contient le message d'erreur
});
```

### Redux State

Nouvelles propriétés ajoutées à `SocketState` :
```typescript
interface SocketState {
  // ... propriétés existantes
  reconnectionToken: string;
}
```

### Nouvelles Actions Redux

1. **requestReconnection** - Action async pour demander une reconnexion
2. **setReconnectionToken** - Définir le token de reconnexion
3. **onReconnectionSuccess** - Gérer le succès de la reconnexion
4. **onReconnectionError** - Gérer l'échec de la reconnexion

### Stockage Local

Les données suivantes sont sauvegardées dans le localStorage :
- `redtetris_reconnection_token` - Token de reconnexion
- `redtetris_room` - Nom de la room
- `redtetris_player` - Nom du joueur

### Fonctions Utilitaires

```typescript
// Sauvegarder les données de reconnexion
saveReconnectionToken(room: string, playerName: string, token: string)

// Récupérer les données de reconnexion
getReconnectionData(): { token: string | null, room: string | null, player: string | null }

// Nettoyer les données de reconnexion
clearReconnectionData()
```

## Flux de Reconnexion

### Reconnexion Automatique
1. L'utilisateur actualise la page
2. `connectSocket` vérifie s'il existe des données de reconnexion dans localStorage
3. Si oui, `requestReconnection` est appelé automatiquement
4. Le serveur valide le token et retourne l'état du jeu
5. L'état Redux est restauré avec toutes les données

### Reconnexion Manuelle
1. L'utilisateur clique sur le bouton "🔄 Reconnect"
2. `handleReconnect` récupère le token depuis localStorage
3. `requestReconnection` est appelé avec le token
4. Même processus de validation et restauration

## Gestion des Erreurs

- **Token invalide** : Les données localStorage sont nettoyées
- **Room inexistante** : Erreur affichée à l'utilisateur
- **Joueur déjà connecté** : Gestion spécifique côté serveur
- **Timeout de connexion** : Reconnexion automatique après délai

## Sécurité

- Les tokens de reconnexion doivent avoir une durée de vie limitée
- Validation côté serveur obligatoire
- Nettoyage automatique des tokens expirés
- Limitation du nombre de tentatives de reconnexion

## Interface Utilisateur

### Indicateurs Visuels
- Bouton "🔄 Reconnect" avec couleur verte distinctive
- Messages d'erreur spécifiques pour les échecs de reconnexion
- Indicateur de statut de connexion mis à jour en temps réel

### Expérience Utilisateur
- Reconnexion transparente sans perte de données
- Messages du chat préservés
- État du jeu complètement restauré
- Positions des adversaires maintenues

## Tests

Pour tester la reconnexion :
1. Rejoindre une room et commencer à jouer
2. Actualiser la page (F5)
3. Vérifier que la reconnexion automatique fonctionne
4. Simuler une déconnexion réseau
5. Utiliser le bouton de reconnexion manuelle

## Configuration Serveur Requise

Le serveur doit implémenter :
- Gestionnaire pour `request-reconnection`
- Validation des tokens de reconnexion
- Sauvegarde de l'état des joueurs
- Events `reconnection-success` et `reconnection-error`
