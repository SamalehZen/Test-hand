import React, { useState } from 'react';
import { AlertCircle, Key, ExternalLink, CheckCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
  error?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onApiKeySet,
  error
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    try {
      // Test de validation de la clé API
      const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        }
      });

      if (testResponse.ok) {
        onApiKeySet(apiKey.trim());
        onClose();
      } else {
        throw new Error('Clé API invalide');
      }
    } catch (err) {
      alert('❌ Clé API invalide. Veuillez vérifier votre clé sur OpenRouter.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Key className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold">Configuration API OpenRouter</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={16} />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">Comment obtenir votre clé API :</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Visitez <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              OpenRouter.ai <ExternalLink size={12} />
            </a></li>
            <li>2. Créez un compte ou connectez-vous</li>
            <li>3. Générez une nouvelle clé API</li>
            <li>4. Copiez la clé et collez-la ci-dessous</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Clé API OpenRouter
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isValidating}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim() || isValidating}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Configurer
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          <p>🔒 Votre clé API est stockée localement dans votre navigateur et n'est jamais partagée.</p>
        </div>
      </div>
    </div>
  );
};