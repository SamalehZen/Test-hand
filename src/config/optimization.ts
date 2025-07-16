// Configuration des optimisations de performance et précision

export const OPTIMIZATION_CONFIG = {
  // Configuration de l'IA
  AI: {
    MAX_CONCURRENT_REQUESTS: 5,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 1000, // ms
    TEMPERATURE: 0.2, // Plus bas = plus cohérent
    MAX_TOKENS: 600,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0.1,
    PRESENCE_PENALTY: 0.1
  },

  // Configuration du cache
  CACHE: {
    DURATION: 24 * 60 * 60 * 1000, // 24h en ms
    MAX_ENTRIES: 1000,
    CLEANUP_INTERVAL: 60 * 60 * 1000 // 1h en ms
  },

  // Configuration du traitement par lot
  BATCH: {
    MAX_ARTICLES_PER_BATCH: 100,
    CHUNK_SIZE: 5, // Articles traités en parallèle
    PROGRESS_UPDATE_INTERVAL: 100 // ms
  },

  // Seuils de confiance
  CONFIDENCE: {
    HIGH_THRESHOLD: 0.8,
    MEDIUM_THRESHOLD: 0.6,
    LOW_THRESHOLD: 0.4,
    VALIDATION_REQUIRED_THRESHOLD: 0.7
  },

  // Configuration du pré-processing
  PREPROCESSING: {
    STOP_WORDS: [
      'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 
      'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous', 'entre'
    ],
    MIN_KEYWORD_LENGTH: 3,
    MAX_KEYWORDS_FOR_CACHE: 3
  },

  // Configuration de la validation
  VALIDATION: {
    AUTO_VALIDATE_THRESHOLD: 0.9,
    AUTO_REJECT_THRESHOLD: 0.3,
    BATCH_VALIDATION_SIZE: 10
  },

  // Configuration du monitoring
  MONITORING: {
    PERFORMANCE_TRACKING: true,
    ERROR_LOGGING: true,
    METRICS_RETENTION_DAYS: 30
  }
};

// Types pour la configuration
export type OptimizationConfig = typeof OPTIMIZATION_CONFIG;

// Utilitaires pour accéder à la configuration
export const getAIConfig = () => OPTIMIZATION_CONFIG.AI;
export const getCacheConfig = () => OPTIMIZATION_CONFIG.CACHE;
export const getBatchConfig = () => OPTIMIZATION_CONFIG.BATCH;
export const getConfidenceConfig = () => OPTIMIZATION_CONFIG.CONFIDENCE;
export const getPreprocessingConfig = () => OPTIMIZATION_CONFIG.PREPROCESSING;
export const getValidationConfig = () => OPTIMIZATION_CONFIG.VALIDATION;
export const getMonitoringConfig = () => OPTIMIZATION_CONFIG.MONITORING;