# 🔑 Guide de Résolution - Erreur HTTP 401

## 🚨 Problème : Erreur d'Authentification

L'erreur **HTTP 401** indique un problème d'authentification avec l'API OpenRouter. Voici comment la résoudre :

## 🔧 Solutions Étape par Étape

### 1. Vérifier votre Clé API OpenRouter

#### Option A : Via l'Interface Web
1. **Cliquez sur "Configurer API"** dans l'application
2. **Saisissez votre nouvelle clé API** dans le modal qui s'ouvre
3. **Testez** en relançant un traitement

#### Option B : Via Variables d'Environnement
1. **Créez un fichier `.env`** à la racine du projet :
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-votre-nouvelle-cle-ici
```

2. **Redémarrez l'application** :
```bash
npm run dev
```

### 2. Obtenir une Nouvelle Clé API

1. **Visitez** [OpenRouter.ai](https://openrouter.ai/keys)
2. **Connectez-vous** ou créez un compte
3. **Générez une nouvelle clé API**
4. **Copiez la clé** (format : `sk-or-v1-...`)
5. **Configurez-la** dans l'application

### 3. Vérifier les Crédits

1. **Consultez votre solde** sur [OpenRouter.ai](https://openrouter.ai/credits)
2. **Rechargez si nécessaire** (minimum 5$)
3. **Vérifiez les limites** de votre compte

### 4. Tester la Configuration

```bash
# Test rapide de la clé API
curl -H "Authorization: Bearer sk-or-v1-votre-cle" \
     https://openrouter.ai/api/v1/models
```

## 🛠️ Diagnostic Avancé

### Causes Communes de l'Erreur 401

| Cause | Solution |
|-------|----------|
| **Clé API expirée** | Générer une nouvelle clé |
| **Clé API invalide** | Vérifier le format `sk-or-v1-...` |
| **Crédits épuisés** | Recharger le compte OpenRouter |
| **Compte suspendu** | Contacter le support OpenRouter |
| **Mauvaise configuration** | Vérifier les variables d'environnement |

### Messages d'Erreur Spécifiques

#### "Invalid API key"
```
🔑 Erreur d'authentification (401): Clé API OpenRouter invalide ou expirée
```
**Solution** : Générer une nouvelle clé API

#### "Insufficient credits"
```
💰 Crédits insuffisants pour traiter la requête
```
**Solution** : Recharger votre compte OpenRouter

#### "Rate limit exceeded"
```
⏱️ Limite de taux atteinte (429): Trop de requêtes
```
**Solution** : Attendre quelques secondes et réessayer

## 🚀 Configuration Recommandée

### Fichier `.env` Complet
```bash
# API OpenRouter
VITE_OPENROUTER_API_KEY=sk-or-v1-votre-cle-ici

# Configuration IA (optionnel)
VITE_AI_MODEL=moonshotai/kimi-k2:free
VITE_AI_TEMPERATURE=0.2
VITE_AI_MAX_TOKENS=600

# Performance (optionnel)
VITE_MAX_CONCURRENT_REQUESTS=5
VITE_RETRY_ATTEMPTS=3
VITE_RETRY_DELAY=1000
```

### Modèles Recommandés

| Modèle | Coût | Performance | Usage |
|--------|------|-------------|-------|
| `moonshotai/kimi-k2:free` | Gratuit | Bon | Test/Développement |
| `openai/gpt-3.5-turbo` | $0.002/1K | Excellent | Production |
| `anthropic/claude-3-haiku` | $0.0015/1K | Très bon | Production |

## 🔄 Processus de Récupération Automatique

L'application gère automatiquement les erreurs 401 :

1. **Détection** de l'erreur d'authentification
2. **Affichage** du modal de configuration
3. **Validation** de la nouvelle clé API
4. **Reprise** automatique du traitement

## 📞 Support

### Si le Problème Persiste

1. **Vérifiez** les logs de la console navigateur (F12)
2. **Testez** avec une clé API différente
3. **Contactez** le support OpenRouter si nécessaire

### Logs Utiles

```javascript
// Dans la console navigateur
console.log('Clé API configurée:', localStorage.getItem('openrouter_api_key'));
```

## ✅ Vérification Finale

Après configuration, testez avec un article simple :

1. **Saisissez** : "Lait entier 1L"
2. **Cliquez** sur "Attribuer Secteur"
3. **Vérifiez** que le résultat s'affiche sans erreur

## 🎯 Bonnes Pratiques

- **Gardez** votre clé API secrète
- **Surveillez** votre consommation de crédits
- **Utilisez** des modèles gratuits pour les tests
- **Configurez** des limites de taux appropriées
- **Sauvegardez** votre configuration dans `.env`

---

💡 **Astuce** : L'application stocke automatiquement votre clé API dans le navigateur pour éviter de la ressaisir à chaque session.