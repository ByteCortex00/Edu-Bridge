// backend/services/mlService.js
import { pipeline } from '@xenova/transformers';

class MLService {
  constructor() {
    this.embedder = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // You can change to TechWolf/JobBERT-v2 later
    this.isLoading = false;
    this.loadError = null;
  }

  /**
   * Initialize the embedding model
   * Called once at server startup
   */
  async initModel() {
    if (this.embedder) {
      console.log('✅ Model already loaded');
      return this.embedder;
    }

    if (this.isLoading) {
      console.log('⏳ Model is already loading, waiting...');
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.embedder;
    }

    try {
      this.isLoading = true;
      console.log(`🤖 Loading ML model: ${this.modelName}...`);
      
      const startTime = Date.now();
      this.embedder = await pipeline('feature-extraction', this.modelName);
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Model loaded successfully in ${loadTime}s`);
      this.loadError = null;
      
      return this.embedder;
    } catch (error) {
      this.loadError = error;
      console.error('❌ Failed to load ML model:', error.message);
      throw new Error(`ML model initialization failed: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<Float32Array>} - Embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text must be a non-empty string');
    }

    try {
      const model = await this.initModel();
      
      const startTime = Date.now();
      const result = await model(text, { pooling: 'mean', normalize: true });
      const embedTime = Date.now() - startTime;
      
      console.log(`📊 Generated embedding in ${embedTime}ms (text length: ${text.length} chars)`);
      
      // Convert to regular array for MongoDB storage
      return Array.from(result.data);
    } catch (error) {
      console.error('❌ Embedding generation failed:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than calling generateEmbedding multiple times
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<Array<Float32Array>>} - Array of embedding vectors
   */
  async generateEmbeddingsBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    // Filter out invalid texts
    const validTexts = texts.filter(t => t && typeof t === 'string' && t.trim().length > 0);
    
    if (validTexts.length === 0) {
      throw new Error('No valid texts provided');
    }

    console.log(`🔄 Generating ${validTexts.length} embeddings in batch...`);
    const startTime = Date.now();

    try {
      const model = await this.initModel();
      const embeddings = [];

      // Process in chunks to avoid memory issues
      const chunkSize = 10;
      for (let i = 0; i < validTexts.length; i += chunkSize) {
        const chunk = validTexts.slice(i, i + chunkSize);
        const chunkEmbeddings = await Promise.all(
          chunk.map(async (text) => {
            const result = await model(text, { pooling: 'mean', normalize: true });
            return Array.from(result.data);
          })
        );
        embeddings.push(...chunkEmbeddings);
        
        console.log(`  ✓ Processed ${Math.min(i + chunkSize, validTexts.length)}/${validTexts.length}`);
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Generated ${embeddings.length} embeddings in ${totalTime}s`);

      return embeddings;
    } catch (error) {
      console.error('❌ Batch embedding generation failed:', error.message);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array<number>|Float32Array} emb1 - First embedding
   * @param {Array<number>|Float32Array} emb2 - Second embedding
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateSimilarity(emb1, emb2) {
    if (!emb1 || !emb2) {
      throw new Error('Both embeddings must be provided');
    }

    if (emb1.length !== emb2.length) {
      throw new Error(`Embedding dimensions don't match: ${emb1.length} vs ${emb2.length}`);
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < emb1.length; i++) {
      dotProduct += emb1[i] * emb2[i];
      norm1 += emb1[i] * emb1[i];
      norm2 += emb2[i] * emb2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Calculate similarity between text and embedding
   * Useful when you already have one embedding stored
   * @param {string} text - Text to compare
   * @param {Array<number>} embedding - Pre-computed embedding
   * @returns {Promise<number>} - Similarity score
   */
  async calculateTextToEmbeddingSimilarity(text, embedding) {
    const textEmbedding = await this.generateEmbedding(text);
    return this.calculateSimilarity(textEmbedding, embedding);
  }

  /**
   * Calculate similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} - Similarity score
   */
  async calculateTextSimilarity(text1, text2) {
    const [emb1, emb2] = await Promise.all([
      this.generateEmbedding(text1),
      this.generateEmbedding(text2)
    ]);
    
    return this.calculateSimilarity(emb1, emb2);
  }

  /**
   * Filter jobs by semantic similarity to curriculum
   * @param {string} curriculumText - Text representation of curriculum
   * @param {Array} jobs - Array of job objects with descriptions
   * @param {number} threshold - Minimum similarity score (0-1)
   * @returns {Promise<Array>} - Filtered jobs with similarity scores
   */
  async filterJobsBySimilarity(curriculumText, jobs, threshold = 0.6) {
    if (!curriculumText || jobs.length === 0) {
      return [];
    }

    console.log(`\n🔍 Filtering ${jobs.length} jobs by semantic similarity...`);
    console.log(`📏 Threshold: ${threshold}`);

    try {
      const startTime = Date.now();

      // Generate curriculum embedding
      const curriculumEmbedding = await this.generateEmbedding(curriculumText);

      const filteredJobs = [];
      let processedCount = 0;

      for (const job of jobs) {
        processedCount++;
        
        try {
          // Use pre-computed embedding if available, otherwise generate
          let jobEmbedding;
          if (job.embedding && Array.isArray(job.embedding) && job.embedding.length > 0) {
            jobEmbedding = job.embedding;
          } else {
            const jobText = `${job.title} ${job.description}`;
            jobEmbedding = await this.generateEmbedding(jobText);
          }

          const similarity = this.calculateSimilarity(curriculumEmbedding, jobEmbedding);

          if (similarity >= threshold) {
            filteredJobs.push({
              ...job._doc || job, // Handle Mongoose documents
              similarityScore: parseFloat(similarity.toFixed(4))
            });
          }

          // Log progress every 20 jobs
          if (processedCount % 20 === 0) {
            console.log(`  ⏳ Processed ${processedCount}/${jobs.length} jobs...`);
          }
        } catch (jobError) {
          console.warn(`⚠️  Skipping job ${job._id}: ${jobError.message}`);
          continue;
        }
      }

      // Sort by similarity score (highest first)
      filteredJobs.sort((a, b) => b.similarityScore - a.similarityScore);

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const filterRate = ((filteredJobs.length / jobs.length) * 100).toFixed(1);

      console.log(`\n✅ Filtering complete in ${totalTime}s`);
      console.log(`📊 Results: ${filteredJobs.length}/${jobs.length} jobs passed (${filterRate}%)`);
      
      if (filteredJobs.length > 0) {
        console.log(`🎯 Top similarity score: ${filteredJobs[0].similarityScore}`);
        console.log(`📉 Lowest similarity score: ${filteredJobs[filteredJobs.length - 1].similarityScore}`);
      }

      return filteredJobs;
    } catch (error) {
      console.error('❌ Job filtering failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if model is ready
   * @returns {boolean}
   */
  isModelReady() {
    return this.embedder !== null && !this.isLoading;
  }

  /**
   * Get model status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      modelLoaded: this.embedder !== null,
      modelName: this.modelName,
      isLoading: this.isLoading,
      hasError: this.loadError !== null,
      error: this.loadError?.message || null
    };
  }
}

// Export singleton instance
const mlService = new MLService();
export default mlService;