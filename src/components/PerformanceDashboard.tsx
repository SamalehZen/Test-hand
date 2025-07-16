import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Database, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { AttributionResult } from '../../shared/types';
import { OptimizedAIService } from '../services/optimizedAI';

interface PerformanceMetrics {
  totalProcessed: number;
  averageProcessingTime: number;
  accuracyRate: number;
  cacheHitRate: number;
  confidenceDistribution: {
    high: number; // >= 0.8
    medium: number; // 0.6-0.8  
    low: number; // < 0.6
  };
  topSecteurs: Array<{code: string, libelle: string, count: number}>;
  processingHistory: Array<{
    timestamp: string;
    articleCount: number;
    processingTime: number;
    successRate: number;
  }>;
}

interface PerformanceDashboardProps {
  results: AttributionResult[];
  isProcessing: boolean;
  onClearCache: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  results,
  isProcessing,
  onClearCache
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const aiService = OptimizedAIService.getInstance();

  useEffect(() => {
    if (results.length > 0) {
      calculateMetrics();
    }
  }, [results]);

  const calculateMetrics = () => {
    if (results.length === 0) return;

    const successfulResults = results.filter(r => r.secteurCode !== 'ERROR');
    const errorResults = results.filter(r => r.secteurCode === 'ERROR');

    // Distribution de confiance
    const confidenceDistribution = {
      high: successfulResults.filter(r => r.confidence >= 0.8).length,
      medium: successfulResults.filter(r => r.confidence >= 0.6 && r.confidence < 0.8).length,
      low: successfulResults.filter(r => r.confidence < 0.6).length
    };

    // Top secteurs
    const secteurCounts = new Map<string, {libelle: string, count: number}>();
    successfulResults.forEach(result => {
      const key = result.secteurCode;
      const existing = secteurCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        secteurCounts.set(key, {
          libelle: result.secteurLibelle,
          count: 1
        });
      }
    });

    const topSecteurs = Array.from(secteurCounts.entries())
      .map(([code, data]) => ({
        code,
        libelle: data.libelle,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Statistiques du cache
    const cacheStats = aiService.getCacheStats();

    const calculatedMetrics: PerformanceMetrics = {
      totalProcessed: results.length,
      averageProcessingTime: 0, // À implémenter avec un timer
      accuracyRate: (successfulResults.length / results.length) * 100,
      cacheHitRate: cacheStats.totalHits > 0 ? (cacheStats.totalHits / cacheStats.totalEntries) * 100 : 0,
      confidenceDistribution,
      topSecteurs,
      processingHistory: [] // À implémenter avec persistance
    };

    setMetrics(calculatedMetrics);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulation
    calculateMetrics();
    setRefreshing(false);
  };

  const handleClearCache = () => {
    aiService.clearCache();
    onClearCache();
    calculateMetrics();
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune donnée de performance disponible</p>
            <p className="text-sm text-gray-400 mt-2">Traitez des articles pour voir les statistiques</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confidenceChartData = [
    { name: 'Élevée (≥80%)', value: metrics.confidenceDistribution.high, color: '#10b981' },
    { name: 'Moyenne (60-80%)', value: metrics.confidenceDistribution.medium, color: '#f59e0b' },
    { name: 'Faible (<60%)', value: metrics.confidenceDistribution.low, color: '#ef4444' }
  ];

  const secteurChartData = metrics.topSecteurs.slice(0, 5).map(secteur => ({
    name: secteur.code,
    libelle: secteur.libelle.substring(0, 20) + '...',
    count: secteur.count
  }));

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Métriques et statistiques de traitement
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCache}
          >
            <Database className="mr-2 h-4 w-4" />
            Vider Cache
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Articles Traités</p>
                <p className="text-2xl font-bold">{metrics.totalProcessed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                <p className="text-2xl font-bold">{metrics.accuracyRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temps Moyen</p>
                <p className="text-2xl font-bold">
                  {isProcessing ? (
                    <span className="text-sm">En cours...</span>
                  ) : (
                    `${metrics.averageProcessingTime.toFixed(1)}s`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et détails */}
      <Tabs defaultValue="confidence" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="confidence">Distribution Confiance</TabsTrigger>
          <TabsTrigger value="secteurs">Top Secteurs</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="confidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution de la Confiance</CardTitle>
              <CardDescription>
                Répartition des résultats par niveau de confiance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={confidenceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {confidenceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {confidenceChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.value}</span>
                        <Badge variant="outline">
                          {((item.value / metrics.totalProcessed) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="secteurs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Secteurs</CardTitle>
              <CardDescription>
                Secteurs les plus fréquemment attribués
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={secteurChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        value, 
                        props.payload.libelle
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques Détaillées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Articles avec erreur:</span>
                  <Badge variant="destructive">
                    {results.filter(r => r.secteurCode === 'ERROR').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Confiance moyenne:</span>
                  <Badge variant="secondary">
                    {(results
                      .filter(r => r.secteurCode !== 'ERROR')
                      .reduce((sum, r) => sum + r.confidence, 0) / 
                      results.filter(r => r.secteurCode !== 'ERROR').length * 100
                    ).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Secteurs uniques:</span>
                  <Badge variant="outline">
                    {new Set(results.filter(r => r.secteurCode !== 'ERROR').map(r => r.secteurCode)).size}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.accuracyRate < 90 && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Taux de réussite faible</p>
                      <p className="text-gray-600">Vérifiez la qualité des libellés d'articles</p>
                    </div>
                  </div>
                )}
                
                {metrics.confidenceDistribution.low > metrics.totalProcessed * 0.2 && (
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Beaucoup de résultats peu fiables</p>
                      <p className="text-gray-600">Considérez une validation manuelle</p>
                    </div>
                  </div>
                )}
                
                {metrics.cacheHitRate > 50 && (
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Cache efficace</p>
                      <p className="text-gray-600">Bon taux de réutilisation des résultats</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};