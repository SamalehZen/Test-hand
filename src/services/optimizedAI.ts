import { AIResponse } from '../../shared/types';

interface CacheEntry {
  result: AIResponse;
  timestamp: number;
  hitCount: number;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  correctedResult?: AIResponse;
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  get(key: string): AIResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.result;
  }

  set(key: string, result: AIResponse): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 1
    });
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      totalEntries: entries.length,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      averageHits: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hitCount, 0) / entries.length : 0
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

class ArticlePreprocessor {
  private static readonly STOP_WORDS = [
    'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 'avec', 'sans', 'pour', 'par'
  ];

  static normalize(article: string): string {
    return article
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static extractKeywords(article: string): string[] {
    const normalized = this.normalize(article);
    
    return normalized
      .split(' ')
      .filter(word => word.length > 2 && !this.STOP_WORDS.includes(word))
      .sort((a, b) => b.length - a.length); // Mots plus longs en premier
  }

  static generateCacheKey(article: string): string {
    const keywords = this.extractKeywords(article);
    return keywords.slice(0, 3).join('_'); // Top 3 mots-clés
  }

  static enhanceArticleDescription(article: string): string {
    const keywords = this.extractKeywords(article);
    const normalized = this.normalize(article);
    
    return `Article: "${article}"
Mots-clés principaux: ${keywords.slice(0, 5).join(', ')}
Description normalisée: ${normalized}`;
  }
}

class ResultValidator {
  static validateResult(result: AIResponse, structure: string): ValidationResult {
    const issues: string[] = [];

    // Vérifier que le code existe dans la structure
    if (!structure.includes(result.secteurCode)) {
      issues.push('Code secteur inexistant dans la structure');
    }

    // Vérifier la cohérence du libellé
    const lines = structure.split('\n');
    const codeLine = lines.find(line => line.trim().startsWith(result.secteurCode));
    if (codeLine) {
      const expectedLibelle = codeLine.split(result.secteurCode)[1]?.trim();
      if (expectedLibelle && expectedLibelle !== result.secteurLibelle) {
        issues.push('Libellé incohérent avec la structure');
      }
    }

    // Vérifier le score de confiance
    if (result.confidence < 0 || result.confidence > 1) {
      issues.push('Score de confiance invalide');
      result.confidence = Math.max(0, Math.min(1, result.confidence));
    }

    return {
      isValid: issues.length === 0,
      issues,
      correctedResult: issues.length > 0 ? this.correctResult(result, structure) : result
    };
  }

  private static correctResult(result: AIResponse, structure: string): AIResponse {
    // Essayer de trouver le bon libellé dans la structure
    const lines = structure.split('\n');
    const codeLine = lines.find(line => line.trim().startsWith(result.secteurCode));
    
    if (codeLine) {
      const correctLibelle = codeLine.split(result.secteurCode)[1]?.trim();
      if (correctLibelle) {
        return {
          ...result,
          secteurLibelle: correctLibelle,
          confidence: Math.max(0.5, result.confidence - 0.1), // Réduire légèrement la confiance
          reasoning: `${result.reasoning} (Libellé corrigé automatiquement)`
        };
      }
    }

    return result;
  }
}

export class OptimizedAIService {
  private static instance: OptimizedAIService;
  private cacheManager = new CacheManager();
  private readonly API_KEY: string;
  private readonly MODEL = 'moonshotai/kimi-k2:free';
  private readonly BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MAX_CONCURRENT = 5;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;

  constructor() {
    // Essayer plusieurs sources pour la clé API
    this.API_KEY = this.getApiKey();
    if (!this.API_KEY) {
      console.error('❌ Clé API OpenRouter manquante. Veuillez configurer VITE_OPENROUTER_API_KEY ou utiliser une clé par défaut.');
    }
  }

  private getApiKey(): string {
    // 1. Variable d'environnement Vite
    if (import.meta.env?.VITE_OPENROUTER_API_KEY) {
      return import.meta.env.VITE_OPENROUTER_API_KEY;
    }
    
    // 2. Variable d'environnement standard
    if (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) {
      return process.env.OPENROUTER_API_KEY;
    }
    
    // 3. Stockage local du navigateur
    if (typeof localStorage !== 'undefined') {
      const storedKey = localStorage.getItem('openrouter_api_key');
      if (storedKey) {
        return storedKey;
      }
    }
    
    // 4. Demander à l'utilisateur
    return this.promptForApiKey();
  }

  private promptForApiKey(): string {
    const key = prompt(`
🔑 Configuration requise - Clé API OpenRouter

Pour utiliser les fonctionnalités IA optimisées, veuillez :

1. Créer un compte sur https://openrouter.ai
2. Obtenir votre clé API
3. Saisir votre clé ci-dessous

Votre clé API OpenRouter :`);
    
    if (key && key.trim()) {
      // Sauvegarder dans le localStorage pour les prochaines utilisations
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('openrouter_api_key', key.trim());
      }
      return key.trim();
    }
    
    throw new Error('Clé API OpenRouter requise pour utiliser les fonctionnalités IA');
  }

  public static getInstance(): OptimizedAIService {
    if (!OptimizedAIService.instance) {
      OptimizedAIService.instance = new OptimizedAIService();
    }
    return OptimizedAIService.instance;
  }

  // Méthode pour reconfigurer la clé API
  public reconfigureApiKey(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('openrouter_api_key');
    }
    this.API_KEY = this.promptForApiKey();
  }

  // Méthode pour vérifier si la clé API est configurée
  public isApiKeyConfigured(): boolean {
    return !!this.API_KEY && this.API_KEY.length > 0;
  }

  // Méthode pour définir manuellement la clé API
  public setApiKey(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('openrouter_api_key', key);
    }
    (this as any).API_KEY = key;
  }

  async attributeSecteur(article: string, structure: string): Promise<AIResponse> {
    // Vérifier le cache d'abord
    const cacheKey = ArticlePreprocessor.generateCacheKey(article);
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const enhancedArticle = ArticlePreprocessor.enhanceArticleDescription(article);
    const result = await this.callAIWithRetry(enhancedArticle, structure);
    
    // Valider et corriger si nécessaire
    const validation = ResultValidator.validateResult(result, structure);
    const finalResult = validation.correctedResult || result;

    // Mettre en cache
    this.cacheManager.set(cacheKey, finalResult);

    return finalResult;
  }

  async attributeBatchOptimized(articles: string[], structure: string, onProgress?: (progress: number) => void): Promise<AIResponse[]> {
    const chunks = this.chunkArray(articles, this.MAX_CONCURRENT);
    const results: AIResponse[] = [];
    let processedCount = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async (article) => {
        try {
          const result = await this.attributeSecteur(article, structure);
          processedCount++;
          onProgress?.(processedCount / articles.length * 100);
          return result;
        } catch (error) {
          processedCount++;
          onProgress?.(processedCount / articles.length * 100);
          return {
            secteurCode: 'ERROR',
            secteurLibelle: 'ERREUR DE TRAITEMENT',
            confidence: 0,
            reasoning: error instanceof Error ? error.message : 'Erreur inconnue'
          };
        }
      });

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }

  private async callAIWithRetry(article: string, structure: string): Promise<AIResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.callAI(article, structure);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erreur inconnue');
        
        if (attempt < this.RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY * attempt); // Backoff exponentiel
        }
      }
    }

    throw lastError!;
  }

  private async callAI(article: string, structure: string): Promise<AIResponse> {
    const prompt = this.buildEnhancedPrompt(article, structure);
    
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Secteur Attribution AI Optimized'
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: this.getEnhancedSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Réduire pour plus de cohérence
        max_tokens: 600,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage += `: ${errorData.error.message}`;
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      // Messages d'erreur spécifiques
      switch (response.status) {
        case 401:
          errorMessage = `🔑 Erreur d'authentification (401): Clé API OpenRouter invalide ou expirée. 
          
Veuillez :
1. Vérifier votre clé API sur https://openrouter.ai
2. Vous assurer qu'elle est active et a des crédits
3. Recharger la page pour saisir une nouvelle clé`;
          break;
        case 403:
          errorMessage = `🚫 Accès refusé (403): Votre clé API n'a pas les permissions nécessaires`;
          break;
        case 429:
          errorMessage = `⏱️ Limite de taux atteinte (429): Trop de requêtes. Veuillez patienter quelques secondes`;
          break;
        case 500:
          errorMessage = `🔧 Erreur serveur (500): Problème temporaire du service OpenRouter`;
          break;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Réponse vide de l\'API');
    }

    return this.parseAIResponse(content);
  }

  private getEnhancedSystemPrompt(): string {
    return `Tu es un expert en classification de produits pour hypermarchés GÉANT CASINO.

CONTEXTE: Structure hiérarchique CYRUS (4 niveaux)
- Niveau 1: Secteur (ex: 01 MARCHE)
- Niveau 2: Rayon (ex: 010 BOUCHERIE) 
- Niveau 3: Famille (ex: 101 STAND TRADITIONNEL)
- Niveau 4: Sous-famille (ex: 101 BOEUF LOCAL)

EXEMPLES DE CLASSIFICATION:
- "Lait entier 1L" → 202 LAIT DE CONSOMMATION > 203 LAIT ENTIER
- "Pommes Golden" → 111 FRUITS > 101 FRUITS LOCAUX
- "Steak haché 5%" → 102 LIBRE SERVICE > 201 BOEUF LOCAL
- "Yaourt nature Bio" → 201 PRODUIT FR.LAITIER LS BIO > 109 YAOURTS BIOLOGIQUES
- "Saucisson sec" → 215 SAUCISSONS SECS > 501 SAUCISSONS SECS

RÈGLES DE CLASSIFICATION:
1. Analyse les mots-clés principaux du libellé
2. Privilégie le niveau le plus précis (niveau 4 si possible)
3. Pour les produits BIO, cherche d'abord les sections BIO spécialisées
4. Pour HALAL, utilise les sections HALAL dédiées
5. Score de confiance basé sur la précision du match:
   - 0.9-1.0: Match exact avec mots-clés spécifiques
   - 0.7-0.9: Match probable avec catégorie claire
   - 0.5-0.7: Match possible nécessitant validation
   - <0.5: Incertain, nécessite révision manuelle

FORMAT RÉPONSE (JSON strict):
{
  "secteurCode": "XXX",
  "secteurLibelle": "LIBELLE EXACT DE LA STRUCTURE",
  "confidence": 0.95,
  "reasoning": "Mots-clés identifiés: [X,Y,Z] → Classification niveau N"
}`;
  }

  private buildEnhancedPrompt(article: string, structure: string): string {
    return `${article}

Structure des secteurs disponibles:
${structure}

Classe cet article dans le secteur le plus approprié et réponds UNIQUEMENT en JSON selon le format demandé.`;
  }

  private parseAIResponse(content: string): AIResponse {
    try {
      // Nettoyer la réponse pour extraire le JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format de réponse invalide');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validation des champs requis
      if (!parsed.secteurCode || !parsed.secteurLibelle || typeof parsed.confidence !== 'number') {
        throw new Error('Réponse incomplète de l\'IA');
      }

      return {
        secteurCode: parsed.secteurCode,
        secteurLibelle: parsed.secteurLibelle,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        reasoning: parsed.reasoning || 'Aucune explication fournie'
      };
    } catch (error) {
      console.error('Erreur parsing réponse AI:', error);
      throw new Error('Impossible de traiter la réponse de l\'IA');
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Méthodes utilitaires pour le monitoring
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  clearCache(): void {
    this.cacheManager.clear();
  }
}