// Types pour l'application d'attribution de secteurs

export interface SecteurHierarchy {
  code: string;
  libelle: string;
  niveau: number;
  parent?: string;
  children?: SecteurHierarchy[];
}

export interface HierarchieComplete {
  secteur: {
    code: string;
    nom: string;
  };
  rayon: {
    code: string;
    nom: string;
  };
  famille: {
    code: string;
    nom: string;
  };
  sousFamille: {
    code: string;
    nom: string;
  };
}

export interface Article {
  id?: number;
  libelle: string;
  hierarchie?: HierarchieComplete;
  confidence?: number;
  validated?: boolean;
}

export interface AttributionResult {
  article: string;
  secteurCode: string;
  secteurLibelle: string;
  confidence: number;
  reasoning?: string;
}

export interface BatchResult {
  articles: AttributionResult[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  processingTime: number;
}

export interface AIRequest {
  article: string;
  structure: string;
}

export interface AIResponse {
  secteurCode: string;
  secteurLibelle: string;
  confidence: number;
  reasoning: string;
}

export interface DashboardStats {
  totalArticles: number;
  averageConfidence: number;
  secteurDistribution: Record<string, number>;
  rayonDistribution: Record<string, number>;
  familleDistribution: Record<string, number>;
  confidenceDistribution: {
    high: number; // >= 0.8
    medium: number; // 0.6 - 0.8
    low: number; // < 0.6
  };
  processingTime: number;
  successRate: number;
}

export type ProcessingMode = 'single' | 'batch';
export type ExportFormat = 'xlsx' | 'csv';
export type ViewMode = 'app' | 'dashboard';

export interface FilterOptions {
  secteur?: string;
  rayon?: string;
  famille?: string;
  minConfidence?: number;
  maxConfidence?: number;
}