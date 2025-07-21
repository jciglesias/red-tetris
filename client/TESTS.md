# Tests Unitaires - Client Red Tetris

## Structure des tests

Ce projet utilise Jest et React Testing Library pour les tests unitaires. Voici l'organisation complète des tests :

### Fichiers de test

#### Tests principaux
- `src/App.test.tsx` - Tests pour le composant principal App
- `src/components/Home.test.tsx` - Tests pour le composant Home
- `src/components/GameRoom.test.tsx` - Tests pour le composant GameRoom

#### Tests avancés
- `src/tests/coverage.test.tsx` - Tests optimisés pour la couverture de code
- `src/tests/integration.test.tsx` - Tests d'intégration entre composants
- `src/tests/real-components.test.tsx` - Tests des composants réels avec mocks
- `src/tests/app-real.test.tsx` - Tests du composant App réel
- `src/tests/utils.test.tsx` - Tests des utilitaires et helpers

### Configuration

Les tests sont configurés avec :
- **Jest** : Framework de test
- **React Testing Library** : Utilitaires pour tester les composants React
- **@testing-library/jest-dom** : Matchers supplémentaires pour Jest
- **Mocks personnalisés** : Pour socket.io et react-router-dom

### Commandes de test

```bash
# Lancer tous les tests
npm test

# Lancer les tests avec couverture de code
npm run test:cov

# Lancer les tests en mode watch
npm run test:watch

# Lancer un test spécifique
npm test -- --testNamePattern="nom du test"

# Lancer les tests d'un fichier spécifique
npm test Home.test.tsx

# Script utilitaire pour tous les tests
./run-all-tests.sh
```

### Scripts utilitaires

#### `test-runner.sh`
Script simple pour lancer différents types de tests :
```bash
./test-runner.sh -a    # Tous les tests
./test-runner.sh -c    # Tests avec couverture
./test-runner.sh -w    # Mode watch
./test-runner.sh -f Home.test.tsx  # Fichier spécifique
```

#### `run-all-tests.sh`
Script complet qui exécute toute la suite de tests :
- Tests unitaires de base
- Tests de couverture
- Tests d'intégration
- Tests des composants réels
- Tests d'utilitaires
- Génération du rapport de couverture

### Types de tests implémentés

#### Tests de rendu
- Vérification que les composants se rendent sans erreur
- Validation de la présence d'éléments dans le DOM
- Tests de structure CSS et classes

#### Tests d'interaction
- Simulation de clics sur les boutons
- Vérification du changement de valeur des inputs
- Validation des callbacks et événements
- Tests de navigation avec react-router

#### Tests de logique métier
- Validation des conditions d'affichage
- Vérification des validations de formulaire
- Tests des interactions utilisateur
- Gestion des états avec useState et useEffect

#### Tests d'intégration
- Interaction entre composants
- Tests de navigation complète
- Validation des flux utilisateur

#### Tests de couverture
- Tests optimisés pour maximiser la couverture
- Couverture des branches conditionnelles
- Tests des cas limites et d'erreur

### Mocking et isolation

#### Mocks utilisés
- `react-router-dom` : Navigation et paramètres d'URL
- `socket.io-client` : Connexions WebSocket
- Composants React : Isolation des dépendances

#### Stratégies de test
- **Tests isolés** : Chaque composant testé indépendamment
- **Tests d'intégration** : Composants testés ensemble
- **Tests de couverture** : Composants simplifiés pour maximiser la couverture

### Couverture de code

#### Métriques ciblées
- **Statements** : 80%+ couverture des instructions
- **Branches** : 80%+ couverture des branches conditionnelles
- **Functions** : 90%+ couverture des fonctions
- **Lines** : 85%+ couverture des lignes

#### Rapports générés
- Rapport HTML dans `coverage/lcov-report/`
- Rapport JSON dans `coverage/`
- Rapport de couverture dans la console

### Bonnes pratiques

1. **Tests isolés** : Chaque test doit être indépendant
2. **Noms descriptifs** : Les noms de tests doivent expliquer ce qui est testé
3. **AAA Pattern** : Arrange, Act, Assert
4. **Cleanup** : Nettoyer les mocks entre les tests
5. **Couverture significative** : Viser une couverture élevée mais pertinente
6. **Tests rapides** : Éviter les tests longs et complexes
7. **Mocks appropriés** : Utiliser des mocks pour les dépendances externes

### Résultats actuels

#### Statistiques
- ✅ **60+ tests** qui passent
- ✅ **8 suites de tests** complètes
- ✅ **Couverture élevée** sur les composants principaux
- ✅ **Structure modulaire** et maintenable

#### Composants testés
- **App.tsx** : Structure, routing, rendu
- **Home.tsx** : Formulaires, validation, navigation
- **GameRoom.tsx** : Socket.io, paramètres URL, événements
- **Utilitaires** : Helpers, configuration, intégration

### Maintenance

#### Ajout de nouveaux tests
1. Créer le fichier de test à côté du composant
2. Suivre les conventions de nommage (`*.test.tsx`)
3. Utiliser les utilitaires existants
4. Mettre à jour la documentation

#### Debugging des tests
- Utiliser `screen.debug()` pour voir le DOM
- Utiliser `console.log` dans les tests
- Vérifier les mocks avec `mockFn.mock.calls`
- Utiliser `--verbose` pour plus de détails

### Intégration CI/CD

Les tests sont prêts pour l'intégration continue :
- Commandes standardisées
- Rapport de couverture automatique
- Scripts d'automatisation
- Configuration Jest complète

### Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
