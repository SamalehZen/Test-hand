import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Search, Filter } from 'lucide-react';
import { AttributionResult } from '../../shared/types';

interface ValidationInterfaceProps {
  results: AttributionResult[];
  onValidate: (index: number, isValid: boolean, correctedResult?: Partial<AttributionResult>) => void;
  onClose: () => void;
}

interface ValidationFilter {
  confidenceThreshold: number;
  showOnlyUnvalidated: boolean;
  searchTerm: string;
}

export const ValidationInterface: React.FC<ValidationInterfaceProps> = ({
  results,
  onValidate,
  onClose
}) => {
  const [filter, setFilter] = useState<ValidationFilter>({
    confidenceThreshold: 0.7,
    showOnlyUnvalidated: true,
    searchTerm: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AttributionResult>>({});

  // Filtrer les résultats selon les critères
  const filteredResults = results
    .map((result, index) => ({ ...result, originalIndex: index }))
    .filter(result => {
      if (result.confidence > filter.confidenceThreshold && filter.showOnlyUnvalidated) {
        return false;
      }
      if (filter.searchTerm && !result.article.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
        return false;
      }
      return result.secteurCode !== 'ERROR';
    });

  const handleStartEdit = (index: number, result: AttributionResult) => {
    setEditingIndex(index);
    setEditForm({
      secteurCode: result.secteurCode,
      secteurLibelle: result.secteurLibelle,
      confidence: result.confidence
    });
  };

  const handleSaveEdit = (originalIndex: number) => {
    if (editForm.secteurCode && editForm.secteurLibelle) {
      onValidate(originalIndex, true, editForm);
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const stats = {
    total: results.length,
    needsValidation: results.filter(r => r.confidence < 0.7 && r.secteurCode !== 'ERROR').length,
    errors: results.filter(r => r.secteurCode === 'ERROR').length,
    validated: results.filter(r => r.confidence >= 0.8).length
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Interface de Validation</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Validez et corrigez les résultats peu fiables
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">À valider</p>
                <p className="text-lg font-bold">{stats.needsValidation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Erreurs</p>
                <p className="text-lg font-bold">{stats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Validés</p>
                <p className="text-lg font-bold">{stats.validated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Seuil de confiance maximum
              </label>
              <Select 
                value={filter.confidenceThreshold.toString()} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, confidenceThreshold: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">50%</SelectItem>
                  <SelectItem value="0.6">60%</SelectItem>
                  <SelectItem value="0.7">70%</SelectItem>
                  <SelectItem value="0.8">80%</SelectItem>
                  <SelectItem value="0.9">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Recherche dans les articles
              </label>
              <Input
                placeholder="Rechercher un article..."
                value={filter.searchTerm}
                onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilter({
                  confidenceThreshold: 0.7,
                  showOnlyUnvalidated: true,
                  searchTerm: ''
                })}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des résultats à valider */}
      <Card>
        <CardHeader>
          <CardTitle>
            Résultats à valider ({filteredResults.length})
          </CardTitle>
          <CardDescription>
            Cliquez sur "Modifier" pour corriger un résultat ou "Valider" pour l'accepter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">Aucun résultat à valider</p>
              <p className="text-gray-600">Tous les résultats respectent les critères de qualité</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{result.article}</h4>
                      <p className="text-sm text-gray-600 mt-1">{result.reasoning}</p>
                    </div>
                    <Badge variant={getConfidenceBadge(result.confidence)}>
                      {Math.round(result.confidence * 100)}%
                    </Badge>
                  </div>

                  {editingIndex === index ? (
                    // Mode édition
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Code Secteur</label>
                          <Input
                            value={editForm.secteurCode || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, secteurCode: e.target.value }))}
                            placeholder="Ex: 101"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Libellé Secteur</label>
                          <Input
                            value={editForm.secteurLibelle || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, secteurLibelle: e.target.value }))}
                            placeholder="Ex: FRUITS LOCAUX"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(result.originalIndex)}
                          disabled={!editForm.secteurCode || !editForm.secteurLibelle}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Sauvegarder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCancelEdit}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-600">Code: </span>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {result.secteurCode}
                          </code>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Secteur: </span>
                          <span className="font-medium">{result.secteurLibelle}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => onValidate(result.originalIndex, true)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Valider
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleStartEdit(index, result)}
                        >
                          Modifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => onValidate(result.originalIndex, false)}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions globales */}
      {filteredResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Actions sur tous les résultats filtrés
              </p>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    filteredResults.forEach(result => {
                      if (result.confidence >= 0.6) {
                        onValidate(result.originalIndex, true);
                      }
                    });
                  }}
                >
                  Valider tous (≥60%)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    filteredResults.forEach(result => {
                      if (result.confidence < 0.5) {
                        onValidate(result.originalIndex, false);
                      }
                    });
                  }}
                >
                  Rejeter tous (<50%)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};