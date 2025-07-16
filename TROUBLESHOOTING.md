# 🔧 Guide de Résolution des Problèmes

## Erreur HTTP 401 - Authentification

### Symptômes
```
HTTP error! status: 401
🔑 Erreur d'authentification (401): Clé API OpenRouter invalide ou expirée
```

### Solutions

#### 1. Vérifier votre clé API
1. Connectez-vous sur [OpenRouter.ai](https://openrouter.ai)
2. Allez dans **Settings** → **API Keys**
3. Vérifiez que votre clé est active et non expirée
4. Copiez la clé complète (commence par `sk-or-v1-`)

#### 2. Configurer la clé API dans l'application
**Option A : Interface utilisateur**
1. Rechargez la page de l'application
2. Un popup apparaîtra pour saisir votre clé API
3. Collez votre clé et cliquez sur "Configurer"

**Option B : Variable d'environnement**
1. Créez un fichier `.env` à la racine du projet
2. Ajoutez : `VITE_OPENROUTER_API_KEY=votre-clé-ici`
3. Redémarrez l'application avec `npm run dev`

**Option C : Console développeur**
```javascript
// Dans la console du navigateur (F12)
const aiService = window.OptimizedAIService?.getInstance();
aiService?.setApiKey('votre-clé-ici');
```

#### 3. Vérifier les crédits
1. Sur OpenRouter.ai, vérifiez votre solde de crédits
2. Le modèle `kimi-k2:free` est gratuit mais limité
3. Ajoutez des crédits si nécessaire

### Prévention
- Sauvegardez votre clé API dans un gestionnaire de mots de passe
- Surveillez votre usage sur le dashboard OpenRouter
- Configurez des alertes de crédit faible

---

## Erreur HTTP 429 - Limite de Taux

### Symptômes
```
⏱️ Limite de taux atteinte (429): Trop de requêtes
```

### Solutions
1. **Attendez** : Patientez 1-2 minutes avant de réessayer
2. **Réduisez la concurrence** : Dans `src/config/optimization.ts`, réduisez `MAX_CONCURRENT_REQUESTS` à 2-3
3. **Utilisez le cache** : Évitez de retraiter les mêmes articles
4. **Modèle payant** : Passez à un modèle payant pour des limites plus élevées

---

## Erreur HTTP 403 - Accès Refusé

### Symptômes
```
🚫 Accès refusé (403): Votre clé API n'a pas les permissions nécessaires
```

### Solutions
1. Vérifiez que votre clé API a accès au modèle `kimi-k2:free`
2. Contactez le support OpenRouter si le problème persiste
3. Essayez un autre modèle compatible

---

## Erreur HTTP 500 - Erreur Serveur

### Symptômes
```
🔧 Erreur serveur (500): Problème temporaire du service OpenRouter
```

### Solutions
1. **Réessayez** : L'application fait automatiquement 3 tentatives
2. **Vérifiez le statut** : Consultez [status.openrouter.ai](https://status.openrouter.ai)
3. **Changez de modèle** : Temporairement, utilisez un autre modèle

---

## Problèmes de Performance

### Traitement Lent
**Causes possibles :**
- Trop de requêtes simultanées
- Modèle surchargé
- Cache désactivé

**Solutions :**
1. Réduisez `MAX_CONCURRENT_REQUESTS` dans la configuration
2. Activez le cache (par défaut activé)
3. Utilisez un modèle plus rapide

### Cache Inefficace
**Symptômes :** Hit rate < 20%

**Solutions :**
1. Groupez les articles similaires
2. Nettoyez les libellés avant traitement
3. Augmentez la durée de cache

---

## Problèmes d'Interface

### Composant ApiKeyConfig ne s'affiche pas
**Solutions :**
1. Vérifiez que le composant est importé dans `AttributionApp.tsx`
2. Rechargez la page complètement (Ctrl+F5)
3. Vérifiez la console pour les erreurs JavaScript

### Dashboard vide
**Causes :** Aucun traitement effectué

**Solutions :**
1. Traitez au moins un article
2. Vérifiez que les métriques sont sauvegardées
3. Actualisez les statistiques

---

## Problèmes de Développement

### Erreurs de Build
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build de test
npm run build
```

### Erreurs TypeScript
```bash
# Vérifier les types
npm run type-check

# Corriger automatiquement
npm run lint --fix
```

### Problèmes de Dépendances
```bash
# Installation avec résolution de conflits
npm install --legacy-peer-deps --force

# Audit de sécurité
npm audit fix
```

---

## Configuration Avancée

### Variables d'Environnement
Créez un fichier `.env` avec :
```env
# API Configuration
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key

# Performance Tuning
VITE_AI_MAX_CONCURRENT=3
VITE_CACHE_DURATION=7200000
VITE_RETRY_ATTEMPTS=5

# Quality Settings
VITE_CONFIDENCE_THRESHOLD=0.7
VITE_VALIDATION_THRESHOLD=0.8
```

### Configuration Personnalisée
Modifiez `src/config/optimization.ts` pour :
- Ajuster les seuils de confiance
- Modifier les paramètres IA
- Personnaliser le cache

---

## Support et Débogage

### Logs de Débogage
```javascript
// Dans la console (F12)
localStorage.setItem('debug', 'true');
// Rechargez la page pour voir les logs détaillés
```

### Informations Système
```javascript
// Informations de diagnostic
console.log({
  userAgent: navigator.userAgent,
  localStorage: !!localStorage,
  apiKey: !!localStorage.getItem('openrouter_api_key'),
  cacheSize: Object.keys(localStorage).filter(k => k.startsWith('ai_cache_')).length
});
```

### Réinitialisation Complète
```javascript
// Vider tout le cache et la configuration
localStorage.clear();
location.reload();
```

---

## Contacts et Ressources

- **Documentation OpenRouter** : [openrouter.ai/docs](https://openrouter.ai/docs)
- **Status Service** : [status.openrouter.ai](https://status.openrouter.ai)
- **Support OpenRouter** : [openrouter.ai/support](https://openrouter.ai/support)
- **GitHub Issues** : Pour les problèmes spécifiques à cette application

---

## FAQ

**Q: Puis-je utiliser une autre API que OpenRouter ?**
R: Oui, modifiez `OptimizedAIService` pour pointer vers votre API préférée.

**Q: Les données sont-elles sécurisées ?**
R: Oui, tout est traité localement. Seuls les libellés d'articles sont envoyés à l'API pour classification.

**Q: Puis-je utiliser l'application hors ligne ?**
R: Partiellement. Le cache fonctionne hors ligne, mais les nouvelles classifications nécessitent une connexion.

**Q: Comment améliorer la précision ?**
R: Utilisez des libellés clairs, validez les résultats peu fiables, et ajustez les seuils de confiance.