import { AIRequest, AIResponse } from '../../shared/types';

const API_KEY = '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';
const MODEL = 'moonshotai/kimi-k2:free';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async attributeSecteur(article: string, structure: string): Promise<AIResponse> {
    const prompt = this.buildPrompt(article, structure);
    
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Secteur Attribution AI'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Réponse vide de l\'API');
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API:', error);
      throw new Error('Erreur lors de la communication avec l\'IA');
    }
  }

  private getSystemPrompt(): string {
    return `Tu es un expert en classification de produits commerciaux pour hypermarchés. 
Ta tâche est d'attribuer automatiquement des articles à leur secteur approprié selon la structure CYRUS fournie.

Règles importantes:
1. Analyse le libellé de l'article pour déterminer le secteur le plus approprié
2. Utilise UNIQUEMENT les codes secteurs fournis dans la structure
3. Choisis le niveau le plus précis possible (niveau 4 si possible, sinon niveau 3, etc.)
4. Fournis un score de confiance entre 0 et 1
5. Explique brièvement ton raisonnement

Format de réponse OBLIGATOIRE (JSON):
{
  "secteurCode": "XXX",
  "secteurLibelle": "LIBELLE EXACT",
  "confidence": 0.95,
  "reasoning": "Explication courte"
}`;
  }

  private buildPrompt(article: string, structure: string): string {
    return `Article à classer: "${article}"

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

  async attributeBatch(articles: string[], structure: string): Promise<AIResponse[]> {
    const results: AIResponse[] = [];
    
    // Traitement séquentiel pour éviter de surcharger l'API
    for (const article of articles) {
      try {
        const result = await this.attributeSecteur(article, structure);
        results.push(result);
        
        // Petite pause entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Erreur pour l'article "${article}":`, error);
        // Article avec erreur
        results.push({
          secteurCode: 'ERROR',
          secteurLibelle: 'ERREUR DE TRAITEMENT',
          confidence: 0,
          reasoning: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        });
      }
    }
    
    return results;
  }
}