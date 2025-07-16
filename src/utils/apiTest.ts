// Utilitaire pour tester la configuration API

export class ApiTester {
  static async testApiKey(apiKey: string): Promise<{ success: boolean; message: string; details?: any }> {
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        message: 'Clé API vide ou invalide'
      };
    }

    if (!apiKey.startsWith('sk-or-v1-')) {
      return {
        success: false,
        message: 'Format de clé API incorrect. Doit commencer par "sk-or-v1-"'
      };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'API Test - Structure Cyrus'
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2:free',
          messages: [
            {
              role: 'user',
              content: 'Test de connexion. Répondez simplement "OK".'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Clé API valide et fonctionnelle',
          details: {
            model: 'moonshotai/kimi-k2:free',
            response: data.choices?.[0]?.message?.content || 'Test réussi'
          }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        let message = `Erreur HTTP ${response.status}`;
        
        switch (response.status) {
          case 401:
            message = 'Clé API invalide ou expirée';
            break;
          case 403:
            message = 'Accès refusé - vérifiez les permissions de votre clé';
            break;
          case 429:
            message = 'Limite de taux atteinte - patientez quelques minutes';
            break;
          case 500:
            message = 'Erreur serveur temporaire - réessayez plus tard';
            break;
        }

        return {
          success: false,
          message,
          details: errorData
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion réseau',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  static async testModelAvailability(apiKey: string, model: string = 'moonshotai/kimi-k2:free'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin
        }
      });

      if (response.ok) {
        const data = await response.json();
        const modelExists = data.data?.some((m: any) => m.id === model);
        
        return {
          success: modelExists,
          message: modelExists 
            ? `Modèle ${model} disponible`
            : `Modèle ${model} non disponible`
        };
      } else {
        return {
          success: false,
          message: 'Impossible de vérifier la disponibilité du modèle'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la vérification du modèle'
      };
    }
  }

  static async getAccountInfo(apiKey: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data,
          message: 'Informations compte récupérées'
        };
      } else {
        return {
          success: false,
          message: 'Impossible de récupérer les informations du compte'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des informations'
      };
    }
  }

  static generateDiagnosticReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {
        available: !!localStorage,
        apiKeyStored: !!localStorage.getItem('openrouter_api_key'),
        cacheEntries: Object.keys(localStorage).filter(k => k.startsWith('ai_cache_')).length
      },
      environment: {
        isDevelopment: import.meta.env.DEV,
        mode: import.meta.env.MODE,
        hasEnvApiKey: !!import.meta.env.VITE_OPENROUTER_API_KEY
      }
    };

    return JSON.stringify(report, null, 2);
  }
}