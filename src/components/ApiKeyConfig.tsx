import React, { useState, useEffect } from 'react';
import { OptimizedAIService } from '../services/optimizedAI';
import { ApiTester } from '../utils/apiTest';

interface ApiKeyConfigProps {
  onConfigured?: () => void;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const aiService = OptimizedAIService.getInstance();

  useEffect(() => {
    setIsConfigured(aiService.isApiKeyConfigured());
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      alert('Veuillez saisir une clé API valide');
      return;
    }

    setIsValidating(true);
    try {
      // Test de validation avec l'utilitaire dédié
      const testResult = await ApiTester.testApiKey(apiKey.trim());
      
      if (testResult.success) {
        aiService.setApiKey(apiKey.trim());
        setIsConfigured(true);
        setShowConfig(false);
        setApiKey('');
        onConfigured?.();
        
        alert('✅ Clé API configurée avec succès !');
      } else {
        alert(`❌ ${testResult.message}\n\nDétails: ${JSON.stringify(testResult.details, null, 2)}`);
      }
    } catch (error) {
      alert(`❌ Erreur de validation de la clé API:\n${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleReconfigure = () => {
    setShowConfig(true);
    setIsConfigured(false);
  };

  const handleCancel = () => {
    setShowConfig(false);
    setApiKey('');
  };

  if (isConfigured && !showConfig) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">API OpenRouter configurée</span>
          </div>
          <button
            onClick={handleReconfigure}
            className="text-green-600 hover:text-green-800 text-sm underline"
          >
            Reconfigurer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            🔑 Configuration API OpenRouter requise
          </h3>
          <div className="text-yellow-700 mb-4 space-y-2">
            <p>Pour utiliser les fonctionnalités IA optimisées, vous devez configurer votre clé API OpenRouter :</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Créez un compte sur <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">openrouter.ai</a></li>
              <li>Obtenez votre clé API dans les paramètres</li>
              <li>Saisissez-la ci-dessous</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-yellow-800 mb-1">
                Clé API OpenRouter
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={isValidating}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSaveApiKey}
                disabled={isValidating || !apiKey.trim()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isValidating && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isValidating ? 'Validation...' : 'Configurer'}</span>
              </button>
              
              {showConfig && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-blue-700 text-sm">
                <p className="font-medium mb-1">Sécurité :</p>
                <p>Votre clé API est stockée localement dans votre navigateur et n'est jamais transmise à nos serveurs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};