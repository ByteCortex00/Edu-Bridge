// backend/config/mlConfig.js

/**
 * Machine Learning Configuration
 * Centralized settings for ML-based job filtering
 */

export const mlConfig = {
  // Model settings
  model: {
    name: 'Xenova/all-MiniLM-L6-v2',
    embeddingDimensions: 384,
    version: 'v1'
  },

  // Similarity thresholds
  // Based on empirical testing: average similarity ~0.26, median ~0.22
  similarity: {
    // Default threshold for gap analysis
    default: 0.35,
    
    // Minimum threshold (catches top 60-70% of jobs)
    minimum: 0.20,
    
    // Strict threshold (only very relevant jobs)
    strict: 0.50,
    
    // Thresholds by use case
    byUseCase: {
      gapAnalysis: 0.35,      // Balanced: quality vs quantity
      jobRecommendation: 0.40, // Higher: more precise matches
      trendAnalysis: 0.30      // Lower: broader market view
    }
  },

  // Job filtering settings
  filtering: {
    // Multiplier for initial job fetch (fetch N times more for ML filtering)
    fetchMultiplier: 3,
    
    // Minimum jobs to return (supplement with category-based if needed)
    minJobsRequired: 50,
    
    // Maximum jobs to process per batch
    maxBatchSize: 300,
    
    // Enable automatic threshold adjustment
    autoAdjustThreshold: true,
    
    // If auto-adjust, use this percentile of scores
    autoAdjustPercentile: 50 // Use median
  },

  // Embedding generation settings
  embedding: {
    // Batch size for bulk embedding generation
    batchSize: 10,
    
    // Delay between batch processing (ms)
    batchDelay: 100,
    
    // Retry failed embeddings
    retryFailed: true,
    maxRetries: 3,
    
    // Minimum text length for embedding
    minTextLength: 20
  },

  // Performance settings
  performance: {
    // Enable caching of embeddings
    cacheEmbeddings: true,
    
    // Log detailed statistics
    verboseLogging: true,
    
    // Timeout for embedding generation (ms)
    embeddingTimeout: 30000
  },

  // Quality thresholds
  quality: {
    // Minimum average similarity score to consider ML filtering successful
    minAvgSimilarity: 0.25,
    
    // Minimum jobs with embeddings percentage
    minEmbeddingCoverage: 30, // 30% of jobs should have embeddings
    
    // Alert if embedding dimensions don't match
    checkDimensions: true
  }
};

/**
 * Get threshold for specific use case
 */
export function getThreshold(useCase = 'gapAnalysis') {
  return mlConfig.similarity.byUseCase[useCase] || mlConfig.similarity.default;
}

/**
 * Get similarity tier label
 */
export function getSimilarityTier(score) {
  if (score >= mlConfig.similarity.strict) return 'excellent';
  if (score >= mlConfig.similarity.default) return 'good';
  if (score >= mlConfig.similarity.minimum) return 'fair';
  return 'poor';
}

/**
 * Check if ML filtering should be used
 */
export function shouldUseMLFiltering(jobsWithEmbeddings, totalJobs) {
  const coverage = (jobsWithEmbeddings / totalJobs) * 100;
  return coverage >= mlConfig.quality.minEmbeddingCoverage;
}

/**
 * Calculate dynamic threshold based on score distribution
 */
export function calculateDynamicThreshold(scores) {
  if (!scores || scores.length === 0) {
    return mlConfig.similarity.default;
  }

  // Sort scores
  const sorted = [...scores].sort((a, b) => b - a);
  
  // Calculate percentile
  const percentileIndex = Math.floor(
    (mlConfig.filtering.autoAdjustPercentile / 100) * sorted.length
  );
  
  const dynamicThreshold = sorted[percentileIndex];
  
  // Ensure it's within reasonable bounds
  return Math.max(
    mlConfig.similarity.minimum,
    Math.min(mlConfig.similarity.strict, dynamicThreshold)
  );
}

export default mlConfig;