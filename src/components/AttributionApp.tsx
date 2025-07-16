import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, Loader2, CheckCircle, AlertCircle, ArrowLeft, BarChart3, Key } from 'lucide-react';
import { OptimizedAIService } from '../services/optimizedAI';
import { FileUtils } from '../utils/fileUtils';
import { AttributionResult, ProcessingMode } from '../../shared/types';
import { PerformanceDashboard } from './PerformanceDashboard';
import { ApiKeyModal } from './ApiKeyModal';

interface AttributionAppProps {
  onBack: () => void;
  secteurStructure: string;
}

export const AttributionApp: React.FC<AttributionAppProps> = ({ onBack, secteurStructure }) => {
  const [mode, setMode] = useState<ProcessingMode>('single');
  const [showDashboard, setShowDashboard] = useState(false);
  const [singleArticle, setSingleArticle] = useState('');
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [results, setResults] = useState<AttributionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiService = OptimizedAIService.getInstance();

  const handleSingleAttribution = async () => {
    if (!singleArticle.trim()) {
      setError('Veuillez saisir un libellé d\'article');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(50);
      const result = await aiService.attributeSecteur(singleArticle.trim(), secteurStructure);
      
      const attributionResult: AttributionResult = {
        article: singleArticle.trim(),
        secteurCode: result.secteurCode,
        secteurLibelle: result.secteurLibelle,
        confidence: result.confidence,
        reasoning: result.reasoning
      };

      setResults([attributionResult]);
      setProgress(100);
      setSuccess('Attribution réalisée avec succès !');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'attribution';
      
      // Vérifier si c'est une erreur d'authentification
      if (errorMessage.includes('401') || errorMessage.includes('authentification')) {
        setApiKeyError(errorMessage);
        setShowApiKeyModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!FileUtils.validateFile(file)) {
      setError('Format de fichier non supporté ou fichier trop volumineux (max 10MB). Utilisez CSV ou Excel.');
      return;
    }

    setBatchFile(file);
    setError(null);
  };

  const handleBatchAttribution = async () => {
    if (!batchFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setResults([]);

    try {
      // Import des articles
      setProgress(10);
      const articles = await FileUtils.importArticles(batchFile);
      
      if (articles.length === 0) {
        throw new Error('Aucun article trouvé dans le fichier');
      }

      if (articles.length > 100) {
        throw new Error('Maximum 100 articles par lot. Veuillez diviser votre fichier.');
      }

      setProgress(20);

      // Traitement optimisé des articles
      const aiResults = await aiService.attributeBatchOptimized(
        articles, 
        secteurStructure,
        (progressPercent) => {
          const totalProgress = 20 + (progressPercent * 0.7);
          setProgress(totalProgress);
        }
      );

      const batchResults: AttributionResult[] = aiResults.map((result, index) => ({
        article: articles[index],
        secteurCode: result.secteurCode,
        secteurLibelle: result.secteurLibelle,
        confidence: result.confidence,
        reasoning: result.reasoning
      }));

      setResults(batchResults);

      setProgress(100);
      setSuccess(`Traitement terminé ! ${batchResults.filter(r => r.secteurCode !== 'ERROR').length}/${articles.length} articles traités avec succès.`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement du lot';
      
      // Vérifier si c'est une erreur d'authentification
      if (errorMessage.includes('401') || errorMessage.includes('authentification')) {
        setApiKeyError(errorMessage);
        setShowApiKeyModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    if (results.length === 0) {
      setError('Aucun résultat à exporter');
      return;
    }

    try {
      if (format === 'xlsx') {
        FileUtils.exportToExcel(results);
      } else {
        FileUtils.exportToCSV(results);
      }
      setSuccess(`Export ${format.toUpperCase()} réalisé avec succès !`);
    } catch (err) {
      setError('Erreur lors de l\'export');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const handleApiKeySet = (apiKey: string) => {
    aiService.setApiKey(apiKey);
    setApiKeyError(null);
    setShowApiKeyModal(false);
    setSuccess('Clé API configurée avec succès ! Vous pouvez maintenant relancer le traitement.');
  };

  const handleConfigureApiKey = () => {
    setShowApiKeyModal(true);
  };

  const handleClearCache = () => {
    setSuccess('Cache vidé avec succès !');
    setTimeout(() => setSuccess(null), 3000);
  };

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setShowDashboard(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'attribution
            </Button>
          </div>
          <PerformanceDashboard 
            results={results}
            isProcessing={isProcessing}
            onClearCache={handleClearCache}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Attribution Automatique des Secteurs
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Classifiez vos articles selon la structure CYRUS avec l'IA
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleConfigureApiKey}
                size="sm"
              >
                <Key className="mr-2 h-4 w-4" />
                Configurer API
              </Button>
              {results.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => setShowDashboard(true)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration API - Supprimé car remplacé par le modal */}

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as ProcessingMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Article Unique</TabsTrigger>
            <TabsTrigger value="batch">Traitement en Lot</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attribution d'un Article</CardTitle>
                <CardDescription>
                  Saisissez le libellé d'un article pour l'attribuer automatiquement à son secteur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="article" className="text-sm font-medium">
                    Libellé de l'article
                  </label>
                  <Textarea
                    id="article"
                    placeholder="Ex: Lait entier 1L Bio..."
                    value={singleArticle}
                    onChange={(e) => setSingleArticle(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                <Button 
                  onClick={handleSingleAttribution}
                  disabled={isProcessing || !singleArticle.trim()}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Attribution en cours...
                    </>
                  ) : (
                    'Attribuer le secteur'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Traitement en Lot</CardTitle>
                <CardDescription>
                  Importez un fichier CSV ou Excel contenant vos articles (max 100 articles)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Glissez votre fichier ici ou cliquez pour parcourir
                    </p>
                    <p className="text-xs text-gray-500">
                      Formats supportés: CSV, Excel (.xlsx, .xls) - Max 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    Sélectionner un fichier
                  </Button>
                </div>

                {batchFile && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      {batchFile.name} ({(batchFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setBatchFile(null)}
                    >
                      Supprimer
                    </Button>
                  </div>
                )}

                <Button 
                  onClick={handleBatchAttribution}
                  disabled={isProcessing || !batchFile}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    'Démarrer le traitement'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progress */}
        {isProcessing && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Résultats</CardTitle>
                  <CardDescription>
                    {results.length} article(s) traité(s)
                  </CardDescription>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={isProcessing}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('xlsx')}
                    disabled={isProcessing}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Code Secteur</TableHead>
                      <TableHead>Libellé Secteur</TableHead>
                      <TableHead>Confiance</TableHead>
                      <TableHead>Raisonnement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate" title={result.article}>
                            {result.article}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {result.secteurCode}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={result.secteurLibelle}>
                            {result.secteurLibelle}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getConfidenceBadge(result.confidence)}>
                            {Math.round(result.confidence * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={result.reasoning}>
                            {result.reasoning}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de configuration de clé API */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onApiKeySet={handleApiKeySet}
        error={apiKeyError}
      />
    </div>
  );
};