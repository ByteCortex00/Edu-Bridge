// backend/controllers/jobController.js
import axios from "axios";
import JobPosting from "../models/jobPostingModel.js";
import SkillsGap from '../models/skillGapModels.js';
import Curriculum from '../models/curriculumModel.js';
import skillsExtractor from "../services/skillExtractor.js";
import mlService from "../services/mlService.js";
import gapAnalysisService from '../services/gapAnalysis.js';
import { mlConfig } from '../config/mlConfig.js';

/**
 * Supported countries with their Adzuna country codes
 */
const SUPPORTED_COUNTRIES = {
  gb: { name: "United Kingdom", code: "gb" },
  us: { name: "United States", code: "us" },
  au: { name: "Australia", code: "au" },
  pl: { name: "Poland", code: "pl" },
  ke: { name: "Kenya", code: "ke" }
};

/**
 * Fetch Adzuna job categories for a specific country
 */
export const getAdzunaCategories = async (req, res) => {
  try {
    const { country = "gb" } = req.query;
    
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return res.status(400).json({
        success: false,
        message: "Adzuna API credentials missing"
      });
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/categories`;
    const { data } = await axios.get(url, {
      params: { app_id: appId, app_key: appKey }
    });

    res.status(200).json({
      success: true,
      country: SUPPORTED_COUNTRIES[country]?.name || country,
      data: data.results
    });

  } catch (error) {
    console.error("Fetch categories error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job categories"
    });
  }
};

/**
 * Fetch jobs from Adzuna API for multiple countries and categories
 * Enhanced version with multi-country support
 */
export const fetchJobsFromAdzuna = async (req, res) => {
  try {
    const { 
      countries = "gb,us,au,pl", // Default to multiple countries
      category = "", // Adzuna category tag (e.g., "it-jobs")
      what = "", // Additional keyword search
      where = "",
      page = 1,
      results_per_page = 50 // Increased for bulk operations
    } = req.query;

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return res.status(400).json({
        success: false,
        message: "Adzuna API credentials missing"
      });
    }

    // Parse countries list
    const countryList = countries.split(',').map(c => c.trim().toLowerCase());
    
    // Validate countries
    const validCountries = countryList.filter(c => SUPPORTED_COUNTRIES[c]);
    if (validCountries.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No valid countries provided. Supported: ${Object.keys(SUPPORTED_COUNTRIES).join(', ')}`
      });
    }

    const results = {
      totalFetched: 0,
      totalSaved: 0,
      totalSkipped: 0,
      totalErrors: 0,
      byCountry: {},
      errors: []
    };

    // Fetch jobs for each country
    for (const countryCode of validCountries) {
      try {
        console.log(`Fetching jobs for ${SUPPORTED_COUNTRIES[countryCode].name}...`);
        
        const countryResult = await fetchJobsForCountry({
          country: countryCode,
          category,
          what,
          where,
          page: parseInt(page),
          results_per_page: parseInt(results_per_page),
          appId,
          appKey
        });

        results.byCountry[countryCode] = {
          country: SUPPORTED_COUNTRIES[countryCode].name,
          ...countryResult
        };

        results.totalFetched += countryResult.fetched;
        results.totalSaved += countryResult.saved;
        results.totalSkipped += countryResult.skipped;
        results.totalErrors += countryResult.errors.length;
        
        if (countryResult.errors.length > 0) {
          results.errors.push(...countryResult.errors);
        }

      } catch (countryError) {
        console.error(`Error fetching jobs for ${countryCode}:`, countryError.message);
        results.errors.push(`${countryCode}: ${countryError.message}`);
        results.totalErrors++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Fetched jobs from ${validCountries.length} countries`,
      summary: {
        countries: validCountries.length,
        totalFetched: results.totalFetched,
        totalSaved: results.totalSaved,
        totalSkipped: results.totalSkipped,
        totalErrors: results.totalErrors
      },
      details: results.byCountry,
      errors: results.errors.slice(0, 10) // Show first 10 errors
    });

  } catch (error) {
    console.error("Multi-country fetch error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch jobs from Adzuna API" 
    });
  }
};

/**
 * Helper function to fetch jobs for a single country
 * UPDATED: Now includes weighted embedding generation
 */
async function fetchJobsForCountry({ 
  country, 
  category, 
  what, 
  where, 
  page, 
  results_per_page,
  appId,
  appKey 
}) {
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
  
  const params = {
    app_id: appId,
    app_key: appKey,
    results_per_page
  };

  if (category) {
    params.category = category;
  }

  if (what) {
    params.what = what;
  }

  if (where) {
    params.where = where;
  }

  const { data } = await axios.get(url, { params });

  if (!data.results || data.results.length === 0) {
    return {
      fetched: 0,
      saved: 0,
      skipped: 0,
      errors: []
    };
  }

  const jobs = data.results;
  let saved = 0;
  let skipped = 0;
  const errors = [];

  for (const job of jobs) {
    try {
      // Check for duplicates using multiple criteria
      const exists = await JobPosting.findOne({ 
        $or: [
          { adzunaId: job.id },
          { 
            title: job.title, 
            company: job.company?.display_name,
            'location.country': country.toUpperCase()
          }
        ]
      });
      
      if (exists) {
        skipped++;
        continue;
      }

      // Extract skills from job description
      const extractedSkills = skillsExtractor.extractSkills(
        job.description || ""
      );

      const jobData = {
        adzunaId: job.id,
        title: job.title,
        company: job.company?.display_name || "Unknown Company",
        location: {
          country: country.toUpperCase(),
          region: job.location?.area?.[1] || "",
          city: job.location?.area?.[2] || job.location?.display_name || "",
        },
        description: job.content || job.description || "No description available",
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        category: job.category?.label || category || "Uncategorized",
        contractType: job.contract_type || "full_time",
        requiredSkills: extractedSkills,
        postedDate: job.created ? new Date(job.created) : new Date(),
        expiryDate: job.expiration_date ? new Date(job.expiration_date) : null,
        sourceUrl: job.redirect_url || "",
        rawData: job,
        // Initialize embedding fields
        embedding: null,
        embeddingGenerated: null,
        embeddingError: null
      };

      // Generate weighted embedding for the job
      try {
        if (mlService.isModelReady()) {
          // Create a temporary job instance to use getTextForEmbedding
          const tempJob = new JobPosting(jobData);
          const weightedTexts = tempJob.getTextForEmbedding();
          
          // Validate text data
          if (weightedTexts && weightedTexts.length > 0 && weightedTexts.some(wt => wt.text && wt.text.trim().length > 0)) {
            const embedding = await mlService.generateWeightedEmbedding(weightedTexts);

            // Validate embedding dimensions
            if (embedding && embedding.length === mlConfig.model.embeddingDimensions) {
              jobData.embedding = embedding;
              jobData.embeddingGenerated = new Date();
              jobData.embeddingVersion = mlConfig.model.version;
              
              console.log(`✅ Generated weighted embedding for job: ${jobData.title.substring(0, 50)}...`);
            } else {
              throw new Error(`Invalid embedding dimensions: expected ${mlConfig.model.embeddingDimensions}, got ${embedding?.length || 0}`);
            }
          } else {
            console.log(`⚠️ Insufficient text for embedding: ${jobData.title}`);
          }
        } else {
          console.log(`⚠️ ML model not ready, saving job without embedding: ${jobData.title}`);
        }
      } catch (embeddingError) {
        console.error(`❌ Failed to generate embedding for job ${job.id}:`, embeddingError.message);
        jobData.embeddingError = embeddingError.message;
        // Continue saving job even if embedding fails
      }

      await JobPosting.create(jobData);
      saved++;

    } catch (jobError) {
      errors.push(`Job ${job.id}: ${jobError.message}`);
      console.error(`Error processing job ${job.id}:`, jobError.message);
    }
  }

  return {
    fetched: jobs.length,
    saved,
    skipped,
    errors
  };
}

/**
 * Bulk populate database with jobs from multiple countries and categories
 * This is perfect for initial setup or regular updates
 */
export const bulkPopulateJobs = async (req, res) => {
  try {
    const { 
      countries = ["gb", "us", "au", "pl"],
      categories = [], // Array of category tags
      resultsPerCategory = 100,
      maxPages = 5 // Maximum pages to fetch per category
    } = req.body;

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return res.status(400).json({
        success: false,
        message: "Adzuna API credentials missing"
      });
    }

    // If no categories provided, fetch popular ones first
    let categoriesToFetch = categories;
    if (categoriesToFetch.length === 0) {
      // Default popular categories
      categoriesToFetch = [
        "it-jobs",
        "engineering-jobs", 
        "healthcare-nursing-jobs",
        "teaching-jobs",
        "scientific-qa-jobs",
        "accounting-finance-jobs",
        "sales-jobs"
      ];
    }

    const startTime = Date.now();
    const results = {
      totalFetched: 0,
      totalSaved: 0,
      totalSkipped: 0,
      totalErrors: 0,
      byCountry: {},
      duration: 0
    };

    // Iterate through each country
    for (const countryCode of countries) {
      if (!SUPPORTED_COUNTRIES[countryCode]) {
        console.warn(`Skipping unsupported country: ${countryCode}`);
        continue;
      }

      results.byCountry[countryCode] = {
        country: SUPPORTED_COUNTRIES[countryCode].name,
        byCategory: {}
      };

      console.log(`\n📍 Fetching jobs for ${SUPPORTED_COUNTRIES[countryCode].name}...`);

      // Iterate through each category
      for (const category of categoriesToFetch) {
        console.log(`  📂 Category: ${category}`);
        
        let categoryStats = {
          fetched: 0,
          saved: 0,
          skipped: 0,
          errors: []
        };

        // Fetch multiple pages for each category
        for (let page = 1; page <= maxPages; page++) {
          try {
            const pageResult = await fetchJobsForCountry({
              country: countryCode,
              category,
              what: "",
              where: "",
              page,
              results_per_page: Math.min(resultsPerCategory, 50),
              appId,
              appKey
            });

            categoryStats.fetched += pageResult.fetched;
            categoryStats.saved += pageResult.saved;
            categoryStats.skipped += pageResult.skipped;
            categoryStats.errors.push(...pageResult.errors);

            // Stop if no more results
            if (pageResult.fetched === 0) {
              break;
            }

            // Add delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (pageError) {
            console.error(`Error on page ${page}:`, pageError.message);
            categoryStats.errors.push(`Page ${page}: ${pageError.message}`);
          }
        }

        results.byCountry[countryCode].byCategory[category] = categoryStats;
        results.totalFetched += categoryStats.fetched;
        results.totalSaved += categoryStats.saved;
        results.totalSkipped += categoryStats.skipped;
        results.totalErrors += categoryStats.errors.length;

        console.log(`    ✅ Saved: ${categoryStats.saved}, Skipped: ${categoryStats.skipped}`);
      }
    }

    results.duration = Math.round((Date.now() - startTime) / 1000);

    res.status(200).json({
      success: true,
      message: `Bulk populate completed in ${results.duration}s`,
      summary: {
        countries: countries.length,
        categories: categoriesToFetch.length,
        totalFetched: results.totalFetched,
        totalSaved: results.totalSaved,
        totalSkipped: results.totalSkipped,
        totalErrors: results.totalErrors,
        durationSeconds: results.duration
      },
      details: results.byCountry
    });

  } catch (error) {
    console.error("Bulk populate error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to bulk populate jobs"
    });
  }
};

/**
 * Get all stored jobs with filtering, pagination, and sorting
 */
export const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "postedDate",
      sortOrder = "desc",
      category,
      country,
      location,
      skills,
      company,
      includeEmbeddings = false
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = new RegExp(category, 'i');
    }
    
    if (country) {
      filter['location.country'] = country.toUpperCase();
    }
    
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }
    
    if (skills) {
      filter['requiredSkills.name'] = { 
        $in: skills.split(',').map(skill => new RegExp(skill.trim(), 'i'))
      };
    }
    
    if (company) {
      filter.company = new RegExp(company, 'i');
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let query = JobPosting.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Only include embeddings if explicitly requested
    if (includeEmbeddings === 'true') {
      query = query.select('+embedding');
    }

    const jobs = await query;
    const total = await JobPosting.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: jobs
    });

  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch jobs" 
    });
  }
};

/**
 * Get a single job by ID
 */
export const getJobById = async (req, res) => {
  try {
    const { includeEmbedding = false } = req.query;
    
    let query = JobPosting.findById(req.params.id);

    if (includeEmbedding === 'true') {
      query = query.select('+embedding');
    }

    const job = await query;
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: "Job not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: job 
    });
    
  } catch (error) {
    console.error("Get job by ID error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format"
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch job" 
    });
  }
};

/**
 * Get job statistics with country breakdown
 */
export const getJobStats = async (req, res) => {
  try {
    // Category stats
    const categoryStats = await JobPosting.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgSalaryMin: { $avg: '$salaryMin' },
          avgSalaryMax: { $avg: '$salaryMax' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Country stats
    const countryStats = await JobPosting.aggregate([
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalJobs = await JobPosting.countDocuments();
    
    // Top skills
    const topSkills = await JobPosting.aggregate([
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          count: { $sum: 1 },
          category: { $first: '$requiredSkills.category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Embedding stats
    const embeddingStats = await JobPosting.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $and: [
                { $ne: ['$embedding', null] },
                { $gt: [{ $size: { $ifNull: ['$embedding', []] } }, 0] }
              ]},
              'with_embeddings',
              'without_embeddings'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalJobs,
        byCountry: countryStats,
        byCategory: categoryStats,
        topSkills,
        embeddings: embeddingStats
      }
    });

  } catch (error) {
    console.error("Get job stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job statistics"
    });
  }
};

/**
 * Delete a job by ID
 */
export const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Job deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job"
    });
  }
};

/**
 * Get all unique job categories from database
 * @route   GET /api/jobs/categories
 * @access  Public
 */
export const getJobCategories = async (req, res) => {
  try {
    // Get all unique categories
    const categories = await JobPosting.distinct('category');
    
    // Get count for each category
    const categoriesWithCount = await JobPosting.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgSalaryMin: { $avg: '$salaryMin' },
          avgSalaryMax: { $avg: '$salaryMax' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get jobs posted in last 30 days per category
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    const recentJobsByCategory = await JobPosting.aggregate([
      {
        $match: {
          postedDate: { $gte: recentDate }
        }
      },
      {
        $group: {
          _id: '$category',
          recentCount: { $sum: 1 }
        }
      }
    ]);

    // Merge data
    const categoryStats = categoriesWithCount.map(cat => {
      const recentData = recentJobsByCategory.find(r => r._id === cat._id);
      
      return {
        category: cat._id,
        totalJobs: cat.count,
        recentJobs: recentData?.recentCount || 0,
        avgSalary: cat.avgSalaryMin && cat.avgSalaryMax 
          ? Math.round((cat.avgSalaryMin + cat.avgSalaryMax) / 2)
          : null
      };
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: {
        categories: categories.sort(),
        statistics: categoryStats
      }
    });

  } catch (error) {
    console.error("Get job categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job categories"
    });
  }
};

/**
 * Generate embeddings for existing jobs without them
 * @route   POST /api/jobs/generate-embeddings
 * @access  Private
 */
export const generateJobEmbeddings = async (req, res) => {
  try {
    const { 
      limit = 100, 
      batchSize = 10,
      forceRegenerate = false 
    } = req.body;

    console.log(`🔄 Starting embedding generation for up to ${limit} jobs...`);

    const query = forceRegenerate 
      ? {} 
      : { 
          $or: [
            { embedding: { $exists: false } },
            { embedding: null },
            { embedding: { $size: 0 } },
            { embeddingVersion: { $ne: mlConfig.model.version } }
          ]
        };

    // Select all required fields for embedding generation
    const jobs = await JobPosting.find(query)
      .limit(limit)
      .select('title description embedding embeddingGenerated embeddingVersion embeddingError requiredSkills company location category contractType');

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs need embedding generation',
        stats: { processed: 0, succeeded: 0, failed: 0 }
      });
    }

    console.log(`📊 Found ${jobs.length} jobs needing embeddings`);
    let succeeded = 0;
    let failed = 0;
    const errors = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)}...`);

      for (const job of batch) {
        try {
          const weightedTexts = job.getTextForEmbedding();

          // Check if we have sufficient text for embedding
          if (!weightedTexts || weightedTexts.length === 0 || !weightedTexts.some(wt => wt.text && wt.text.trim().length > 0)) {
            console.log(`⚠️ Skipping job ${job._id}: insufficient text for embedding`);
            continue;
          }

          const embedding = await mlService.generateWeightedEmbedding(weightedTexts);

          // Validate embedding dimensions
          if (!embedding || embedding.length !== mlConfig.model.embeddingDimensions) {
            throw new Error(`Invalid embedding dimensions: expected ${mlConfig.model.embeddingDimensions}, got ${embedding?.length || 0}`);
          }

          // Update job with embedding
          await JobPosting.findByIdAndUpdate(job._id, {
            embedding,
            embeddingGenerated: new Date(),
            embeddingVersion: mlConfig.model.version,
            embeddingError: null
          });

          succeeded++;
          console.log(`✅ Embedded job ${succeeded}/${jobs.length}: ${job.title.substring(0, 50)}...`);

        } catch (error) {
          failed++;
          errors.push(`Job ${job._id}: ${error.message}`);
          
          // Mark job as having embedding error
          await JobPosting.findByIdAndUpdate(job._id, {
            embeddingError: error.message
          });

          console.error(`❌ Failed to embed job ${job._id}:`, error.message);
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    res.status(200).json({
      success: true,
      message: `Embedding generation completed: ${succeeded} succeeded, ${failed} failed`,
      stats: {
        total: jobs.length,
        processed: succeeded + failed,
        succeeded,
        failed
      },
      errors: errors.slice(0, 10) // Return first 10 errors
    });

  } catch (error) {
    console.error('Generate job embeddings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate job embeddings',
      error: error.message
    });
  }
};

/**
 * Get embedding generation status
 * @route   GET /api/jobs/embedding-status
 * @access  Private
 */
export const getEmbeddingStatus = async (req, res) => {
  try {
    const totalJobs = await JobPosting.countDocuments();
    const jobsWithEmbeddings = await JobPosting.countDocuments({ 
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    });
    const jobsWithErrors = await JobPosting.countDocuments({ 
      embeddingError: { $exists: true, $ne: null }
    });
    const jobsWithCorrectVersion = await JobPosting.countDocuments({
      embeddingVersion: mlConfig.model.version
    });

    const mlStatus = mlService.getStatus();

    res.status(200).json({
      success: true,
      data: {
        mlService: mlStatus,
        embeddings: {
          totalJobs,
          jobsWithEmbeddings,
          jobsWithErrors,
          jobsWithCorrectVersion,
          coveragePercentage: totalJobs > 0 ? Math.round((jobsWithEmbeddings / totalJobs) * 100) : 0,
          errorPercentage: totalJobs > 0 ? Math.round((jobsWithErrors / totalJobs) * 100) : 0,
          versionMatchPercentage: totalJobs > 0 ? Math.round((jobsWithCorrectVersion / totalJobs) * 100) : 0,
        },
        config: {
          model: mlConfig.model.name,
          embeddingDimensions: mlConfig.model.embeddingDimensions,
          version: mlConfig.model.version
        }
      }
    });
  } catch (error) {
    console.error('Get embedding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch embedding status'
    });
  }
};

/**
 * Test ML service functionality
 * @route GET /api/jobs/test-ml
 * @access Private
 */
export const testMLService = async (req, res) => {
  try {
    console.log('🧪 Testing ML Service...');
    
    // Test 1: Check if model is ready
    const isReady = mlService.isModelReady();
    console.log('🤖 Model ready:', isReady);
    
    // Test 2: Get model status
    const status = mlService.getStatus();
    console.log('📊 Model status:', status);
    
    // Test 3: Try generating a simple embedding
    let testEmbedding = null;
    if (isReady) {
      try {
        console.log('🔄 Generating test embedding...');
        testEmbedding = await mlService.generateEmbedding('Test sentence for embedding generation');
        console.log('✅ Test embedding generated, dimensions:', testEmbedding.length);
      } catch (embedError) {
        console.error('❌ Test embedding failed:', embedError.message);
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        modelReady: isReady,
        modelStatus: status,
        testEmbedding: testEmbedding ? `Generated (${testEmbedding.length} dimensions)` : 'Failed',
        testEmbeddingSample: testEmbedding ? testEmbedding.slice(0, 5) : null,
        config: {
          model: mlConfig.model.name,
          dimensions: mlConfig.model.embeddingDimensions,
          version: mlConfig.model.version
        }
      }
    });
    
  } catch (error) {
    console.error('ML test error:', error);
    res.status(500).json({
      success: false,
      message: 'ML service test failed',
      error: error.message
    });
  }
};

// ============================================================================
// ANALYTICS CONTROLLER FUNCTIONS
// ============================================================================

/**
 * @desc    Run skills gap analysis for a curriculum
 * @route   POST /api/analytics/analyze/:curriculumId
 * @access  Private
 */
export const analyzeSkillsGap = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 100, daysBack = 90, targetIndustry } = req.body;

    console.log('🔍 === STARTING SKILLS GAP ANALYSIS DEBUG ===');
    console.log('📝 Parameters:', { curriculumId, jobLimit, daysBack, targetIndustry });

    // Validate curriculum exists
    const curriculum = await Curriculum.findById(curriculumId).populate('courses');
    if (!curriculum) {
      console.log('❌ Curriculum not found:', curriculumId);
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    console.log('✅ Curriculum found:', curriculum.programName);
    console.log('📚 Courses in curriculum:', curriculum.courses?.length || 0);
    
    // Debug: Show course names
    if (curriculum.courses && curriculum.courses.length > 0) {
      console.log('📖 Course Names:', curriculum.courses.map(course => course.courseName));
    } else {
      console.log('⚠️ No courses found in curriculum');
    }

    // Debug: Extract and show skills from curriculum
    let curriculumSkills = [];
    try {
      curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);
      console.log('🎯 Extracted Curriculum Skills:', curriculumSkills);
      console.log('📊 Total skills extracted:', curriculumSkills.length);
      
      // Show skill categories
      const skillCategories = [...new Set(curriculumSkills.map(skill => skill.category))];
      console.log('📋 Skill Categories found:', skillCategories);
    } catch (extractError) {
      console.log('❌ Error extracting curriculum skills:', extractError);
    }

    // Debug: Check job sampling - FIX THE FIELD NAME HERE
    const dateFilter = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };

    // FIXED: Use 'category' instead of 'industry'
    if (targetIndustry) {
      dateFilter.category = targetIndustry;
    }

    console.log('🔍 Date filter being used:', dateFilter);
    console.log('📅 Looking for jobs posted after:', dateFilter.postedDate.$gte);

    // First check total jobs without any filter
    const totalJobsInDB = await JobPosting.countDocuments({});
    console.log('📊 Total jobs in database:', totalJobsInDB);

    // Check what categories exist in DB
    const availableCategories = await JobPosting.distinct('category');
    console.log('🏷️ Available categories:', availableCategories);

    // Then check with date filter only
    const jobsInTimeframe = await JobPosting.countDocuments({
      postedDate: dateFilter.postedDate
    });
    console.log('📅 Jobs in timeframe (no category filter):', jobsInTimeframe);

    // Get a sample job to check date format
    const sampleJob = await JobPosting.findOne({}).select('postedDate category title');
    if (sampleJob) {
      console.log('📋 Sample job:', {
        title: sampleJob.title,
        category: sampleJob.category,
        postedDate: sampleJob.postedDate,
        postedDateType: typeof sampleJob.postedDate
      });
    }

    // Finally check with full filter
    const jobsWithFilter = await JobPosting.countDocuments(dateFilter);
    console.log('🎯 Jobs matching full filter:', jobsWithFilter);

    const jobSamples = await JobPosting.find(dateFilter)
      .limit(Math.min(5, jobLimit))
      .select('title company category description requiredSkills postedDate');  // Added description

    console.log('💼 Job sampling debug:');
    console.log('📈 Total jobs in timeframe:', jobsWithFilter);
    console.log('🔍 Sample job titles:', jobSamples.map(job => job.title));
    console.log('🏢 Sample companies:', [...new Set(jobSamples.map(job => job.company))]);
    console.log('🏭 Categories found:', [...new Set(jobSamples.map(job => job.category))]);

    // Debug: Analyze job skills
    console.log('\n🔍 === ANALYZING JOB SAMPLES ===');
    const jobSkills = [];
    jobSamples.forEach((job, index) => {
      console.log(`\n📄 Job ${index + 1}: ${job.title}`);
      console.log(`   Category: ${job.category}`);
      console.log(`   Has description: ${job.description ? 'Yes' : 'No'}`);
      console.log(`   Description length: ${job.description?.length || 0} chars`);
      console.log(`   Description preview: ${job.description?.substring(0, 100)}...`);
      console.log(`   Has requiredSkills field: ${job.requiredSkills ? 'Yes' : 'No'}`);
      console.log(`   Skills count in field: ${job.requiredSkills?.length || 0}`);
      
      if (job.requiredSkills && job.requiredSkills.length > 0) {
        console.log(`   Skills from field: ${job.requiredSkills.slice(0, 3).map(s => s.name).join(', ')}`);
        job.requiredSkills.forEach(skill => {
          jobSkills.push(skill.name);
        });
      }
    });

    const skillFrequency = jobSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Top skills in job market sample:',
      Object.entries(skillFrequency).length > 0
        ? Object.entries(skillFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => `${skill} (${count} jobs)`)
        : '⚠️ No skills found in requiredSkills field - skills will be extracted from descriptions'
    );

    console.log('🔍 === END DEBUGGING - STARTING ANALYSIS ===');

    // Run the actual analysis
    const analysis = await gapAnalysisService.analyzeCurriculum(curriculumId, {
      limit: jobLimit,
      daysBack: daysBack,
      targetIndustry: targetIndustry
    });

    if (!analysis.success) {
      console.log('❌ Analysis failed:', analysis.message);
      return res.status(400).json(analysis);
    }

    console.log('✅ Analysis completed successfully');
    console.log('📈 Final match rate:', analysis.data?.metrics?.overallMatchRate || 0);
    console.log('🎯 Critical gaps found:', analysis.data?.metrics?.criticalGaps?.length || 0);
    console.log('💡 Well-covered skills:', analysis.data?.metrics?.wellCoveredSkills?.length || 0);

    res.status(200).json(analysis);

  } catch (error) {
    console.error('💥 Analyze skills gap error:', error);
    console.error('🔧 Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error during skills gap analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Debug skills extraction and job sampling
 * @route   GET /api/analytics/debug-analysis/:curriculumId
 * @access  Private
 */
export const debugAnalysisSetup = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 5, daysBack = 30, targetIndustry = "IT Jobs" } = req.query;

    console.log('🔍 [DEBUG] Starting analysis debug for:', curriculumId);

    // Get curriculum with courses
    const curriculum = await Curriculum.findById(curriculumId).populate('courses');
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Extract skills using the same method as the analysis
    const curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);

    // Get job samples - FIXED: Use 'category' instead of 'industry'
    const dateFilter = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };
    
    if (targetIndustry && targetIndustry !== 'all') {
      dateFilter.category = targetIndustry;  // FIXED
    }

    const jobSamples = await JobPosting.find(dateFilter)
      .limit(parseInt(jobLimit))
      .select('title company category requiredSkills postedDate salaryMin salaryMax');

    // Analyze job skills
    const allJobSkills = [];
    jobSamples.forEach(job => {
      if (job.requiredSkills) {
        job.requiredSkills.forEach(skill => {
          allJobSkills.push({
            name: skill.name,
            category: skill.category,
            importance: skill.importance,
            jobTitle: job.title
          });
        });
      }
    });

    const skillFrequency = allJobSkills.reduce((acc, skill) => {
      const key = skill.name.toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          categories: new Set(),
          jobs: new Set(),
          importance: {}
        };
      }
      acc[key].count++;
      acc[key].categories.add(skill.category);
      acc[key].jobs.add(skill.jobTitle);
      acc[key].importance[skill.importance] = (acc[key].importance[skill.importance] || 0) + 1;
      return acc;
    }, {});

    // Calculate matches
    const curriculumSkillNames = curriculumSkills.map(s => s.name.toLowerCase());
    const matchingSkills = Object.keys(skillFrequency).filter(skillName => 
      curriculumSkillNames.includes(skillName.toLowerCase())
    );

    res.status(200).json({
      success: true,
      debug: {
        curriculum: {
          id: curriculum._id,
          programName: curriculum.programName,
          department: curriculum.department,
          courseCount: curriculum.courses?.length || 0,
          courses: curriculum.courses?.map(c => ({
            name: c.courseName,
            code: c.courseCode,
            description: c.description?.substring(0, 100) + '...'
          })),
          extractedSkills: curriculumSkills,
          extractedSkillCount: curriculumSkills.length
        },
        jobMarket: {
          parameters: {
            jobLimit: parseInt(jobLimit),
            daysBack: parseInt(daysBack),
            targetIndustry
          },
          totalJobsInTimeframe: await JobPosting.countDocuments(dateFilter),
          samples: jobSamples.map(job => ({
            title: job.title,
            company: job.company,
            category: job.category,  // Changed from 'industry' to 'category'
            skillCount: job.requiredSkills?.length || 0,
            salary: job.salaryMin ? `${job.salaryMin} - ${job.salaryMax}` : 'Not specified'
          })),
          skills: Object.entries(skillFrequency)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, data]) => ({
              name,
              frequency: data.count,
              percentage: ((data.count / jobSamples.length) * 100).toFixed(1),
              categories: Array.from(data.categories),
              sampleJobs: Array.from(data.jobs).slice(0, 3),
              importance: data.importance
            }))
        },
        analysis: {
          curriculumSkillsCount: curriculumSkills.length,
          marketSkillsCount: Object.keys(skillFrequency).length,
          matchingSkillsCount: matchingSkills.length,
          potentialMatchRate: ((matchingSkills.length / Object.keys(skillFrequency).length) * 100).toFixed(1),
          matchingSkills: matchingSkills,
          missingSkills: Object.keys(skillFrequency)
            .filter(skill => !matchingSkills.includes(skill))
            .slice(0, 10)
        }
      }
    });

  } catch (error) {
    console.error('💥 Debug analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug analysis failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get latest analysis for a curriculum
 * @route   GET /api/analytics/latest/:curriculumId
 * @access  Private
 */
export const getLatestAnalysis = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const analysis = await SkillsGap.findOne({ curriculumId })
      .sort({ analysisDate: -1 })
      .populate('curriculumId', 'programName department institutionId')
      .populate({
        path: 'curriculumId',
        populate: {
          path: 'institutionId',
          select: 'name'
        }
      });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this curriculum'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get latest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis'
    });
  }
};

/**
 * @desc    Get skills gap trends over time
 * @route   GET /api/analytics/trends/:curriculumId
 * @access  Private
 */
export const getGapTrends = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const analyses = await SkillsGap.find({ curriculumId })
      .sort({ analysisDate: 1 })
      .select('analysisDate metrics.overallMatchRate jobSampleSize');

    if (analyses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No historical analysis data found'
      });
    }

    const trends = analyses.map(analysis => ({
      date: analysis.analysisDate,
      matchRate: analysis.metrics.overallMatchRate,
      jobSampleSize: analysis.jobSampleSize
    }));

    res.status(200).json({
      success: true,
      data: trends,
      summary: {
        totalAnalyses: analyses.length,
        currentMatchRate: analyses[analyses.length - 1].metrics.overallMatchRate,
        firstAnalysisDate: analyses[0].analysisDate
      }
    });
  } catch (error) {
    console.error('Get gap trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching gap trends'
    });
  }
};

/**
 * @desc    Get top in-demand skills from job market
 * @route   GET /api/analytics/top-skills
 * @access  Public
 */
export const getTopSkills = async (req, res) => {
  try {
    const { 
      category, 
      limit = 20, 
      daysBack = 90,
      minDemand = 0 
    } = req.query;

    // Build date filter
    const dateFilter = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };

    const matchStage = category 
      ? { ...dateFilter, 'requiredSkills.category': category }
      : dateFilter;

    const topSkills = await JobPosting.aggregate([
      { $match: matchStage },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          count: { $sum: 1 },
          category: { $first: '$requiredSkills.category' },
          importance: {
            $push: '$requiredSkills.importance'
          },
          avgSalary: {
            $avg: {
              $cond: [
                { $and: ['$salaryMin', '$salaryMax'] },
                { $divide: [{ $add: ['$salaryMin', '$salaryMax'] }, 2] },
                null
              ]
            }
          }
        }
      },
      { 
        $match: { 
          count: { $gte: parseInt(minDemand) } 
        } 
      },
      { 
        $addFields: {
          requiredCount: {
            $size: {
              $filter: {
                input: '$importance',
                as: 'imp',
                cond: { $eq: ['$$imp', 'required'] }
              }
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate total jobs for demand percentage
    const totalJobs = await JobPosting.countDocuments(dateFilter);

    const skillsWithDemand = topSkills.map(skill => ({
      name: skill._id,
      category: skill.category,
      jobCount: skill.count,
      demandPercentage: totalJobs > 0 ? (skill.count / totalJobs) * 100 : 0,
      requiredCount: skill.requiredCount,
      avgSalary: skill.avgSalary
    }));

    res.status(200).json({
      success: true,
      data: skillsWithDemand,
      metadata: {
        totalJobs,
        timePeriod: `${daysBack} days`,
        minDemand: parseInt(minDemand)
      }
    });
  } catch (error) {
    console.error('Get top skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top skills'
    });
  }
};

/**
 * @desc    Compare multiple curricula
 * @route   POST /api/analytics/compare
 * @access  Private
 */
export const comparePrograms = async (req, res) => {
  try {
    const { curriculumIds } = req.body;

    if (!Array.isArray(curriculumIds) || curriculumIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 curriculum IDs for comparison'
      });
    }

    // Get latest analysis for each curriculum
    const comparisons = await Promise.all(
      curriculumIds.map(async (id) => {
        const analysis = await SkillsGap.findOne({ curriculumId: id })
          .sort({ analysisDate: -1 })
          .populate('curriculumId', 'programName department institutionId')
          .populate({
            path: 'curriculumId',
            populate: {
              path: 'institutionId',
              select: 'name'
            }
          });

        if (!analysis) {
          // If no analysis exists, run one
          const newAnalysis = await gapAnalysisService.analyzeCurriculum(id);
          return newAnalysis.success ? newAnalysis.data : null;
        }

        return analysis;
      })
    );

    const validComparisons = comparisons.filter(c => c !== null);

    if (validComparisons.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Could not get sufficient data for comparison'
      });
    }

    // Generate comparison summary
    const comparisonSummary = {
      totalPrograms: validComparisons.length,
      avgMatchRate: validComparisons.reduce((sum, comp) => 
        sum + comp.metrics.overallMatchRate, 0) / validComparisons.length,
      highestMatchRate: Math.max(...validComparisons.map(c => c.metrics.overallMatchRate)),
      lowestMatchRate: Math.min(...validComparisons.map(c => c.metrics.overallMatchRate)),
      commonCriticalGaps: findCommonGaps(validComparisons)
    };

    res.status(200).json({
      success: true,
      data: {
        comparisons: validComparisons,
        summary: comparisonSummary
      }
    });
  } catch (error) {
    console.error('Compare programs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error comparing programs'
    });
  }
};

/**
 * @desc    Find common critical gaps across multiple analyses
 */
const findCommonGaps = (analyses) => {
  const gapCounts = new Map();
  
  analyses.forEach(analysis => {
    analysis.metrics.criticalGaps.forEach(gap => {
      const key = gap.skillName.toLowerCase();
      if (gapCounts.has(key)) {
        gapCounts.set(key, gapCounts.get(key) + 1);
      } else {
        gapCounts.set(key, 1);
      }
    });
  });

  return Array.from(gapCounts.entries())
    .map(([skill, count]) => ({
      skillName: skill,
      frequency: count,
      percentage: (count / analyses.length) * 100
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
};

/**
 * @desc    Get dashboard overview for institution
 * @route   GET /api/analytics/dashboard/:institutionId
 * @access  Private
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Get all curricula for institution
    const curricula = await Curriculum.find({ institutionId });
    
    if (curricula.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No curricula found for this institution'
      });
    }

    const curriculumIds = curricula.map(c => c._id);

    // Get latest analyses
    const analyses = await SkillsGap.find({
      curriculumId: { $in: curriculumIds }
    })
      .sort({ analysisDate: -1 })
      .limit(curricula.length)
      .populate('curriculumId', 'programName');

    // Calculate aggregate metrics
    const avgMatchRate = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.metrics.overallMatchRate, 0) / analyses.length 
      : 0;

    const totalCriticalGaps = analyses.reduce((sum, a) => 
      sum + a.metrics.criticalGaps.length, 0);

    // Get recent job market data
    const recentJobs = await JobPosting.countDocuments({
      postedDate: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });

    // Get top skills in demand
    const topSkills = await JobPosting.aggregate([
      { 
        $match: { 
          postedDate: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        } 
      },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          count: { $sum: 1 },
          category: { $first: '$requiredSkills.category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        institutionMetrics: {
          totalPrograms: curricula.length,
          analyzedPrograms: analyses.length,
          avgMatchRate: Math.round(avgMatchRate * 100) / 100,
          totalCriticalGaps,
          recentJobPostings: recentJobs
        },
        topSkills: topSkills.map(skill => ({
          name: skill._id,
          category: skill.category,
          demand: skill.count
        })),
        programAnalyses: analyses.map(analysis => ({
          programName: analysis.curriculumId.programName,
          matchRate: analysis.metrics.overallMatchRate,
          criticalGaps: analysis.metrics.criticalGaps.length,
          lastAnalyzed: analysis.analysisDate
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
};

/**
 * @desc    Get skills coverage report
 * @route   GET /api/analytics/coverage/:curriculumId
 * @access  Private
 */
export const getSkillsCoverage = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const curriculum = await Curriculum.findById(curriculumId).populate('courses');
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Extract curriculum skills
    const curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);

    // Get market skills from recent jobs
    const recentJobs = await JobPosting.find({
      postedDate: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    }).limit(100);

    const marketSkills = skillsExtractor.extractFromMultipleJobs(recentJobs);

    // Calculate coverage
    const curriculumSkillSet = new Set(curriculumSkills.map(s => s.name.toLowerCase()));
    
    const coverageReport = {
      totalMarketSkills: marketSkills.length,
      coveredSkills: marketSkills.filter(skill => 
        curriculumSkillSet.has(skill.name.toLowerCase())
      ).length,
      missingSkills: marketSkills.filter(skill => 
        !curriculumSkillSet.has(skill.name.toLowerCase())
      ),
      coveragePercentage: marketSkills.length > 0 
        ? (marketSkills.filter(skill => 
            curriculumSkillSet.has(skill.name.toLowerCase())
          ).length / marketSkills.length) * 100 
        : 0
    };

    res.status(200).json({
      success: true,
      data: coverageReport
    });
  } catch (error) {
    console.error('Get skills coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating skills coverage report'
    });
  }
};

/**
 * @desc    Debug: Test similarity between curriculum and sample jobs
 * @route   GET /api/analytics/debug-similarity/:curriculumId
 * @access  Private
 */
export const debugSimilarity = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 10 } = req.query;

    console.log('\n🧪 === DEBUGGING SIMILARITY SCORES ===');

    // Get curriculum with courses
    const curriculum = await Curriculum.findById(curriculumId)
      .populate('courses')
      .select('+embedding'); // Also fetches department, degree, etc. by default

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    console.log(`📚 Curriculum: ${curriculum.programName}`);

    // Check if curriculum has embedding
    if (!curriculum.embedding || curriculum.embedding.length === 0 || curriculum.embeddingVersion !== mlConfig.model.version) {
      console.log('⚠️  Curriculum has no/old embedding, generating...');
      
      // Use the weighted embedding generation method
      const weightedTexts = await curriculum.getTextForEmbedding();
      const embedding = await mlService.generateWeightedEmbedding(weightedTexts);
      
      curriculum.embedding = embedding;
      curriculum.embeddingGenerated = new Date();
      curriculum.embeddingVersion = mlConfig.model.version;
      await curriculum.save();
      
      console.log('✅ Curriculum embedding generated');
    } else {
      console.log(`✅ Curriculum has embedding (${curriculum.embedding.length} dimensions)`);
    }

    // Get sample jobs with embeddings
    const jobs = await JobPosting.find({
      embedding: { $exists: true, $ne: null },
      embeddingVersion: mlConfig.model.version // Only compare matching versions
    })
      .limit(parseInt(jobLimit))
      .select('+embedding title description category company postedDate');

    console.log(`💼 Testing with ${jobs.length} sample jobs`);

    if (jobs.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No jobs with embeddings found in database'
      });
    }

    // Calculate similarities
    const results = jobs.map(job => {
      const similarity = mlService.calculateSimilarity(
        curriculum.embedding,
        job.embedding
      );

      return {
        jobId: job._id,
        title: job.title,
        category: job.category,
        company: job.company,
        similarity: parseFloat(similarity.toFixed(4)),
        descriptionPreview: job.description.substring(0, 150) + '...'
      };
    });

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    // Calculate statistics
    const similarities = results.map(r => r.similarity);
    const stats = {
      count: similarities.length,
      highest: Math.max(...similarities),
      lowest: Math.min(...similarities),
      average: similarities.reduce((a, b) => a + b, 0) / similarities.length,
      median: similarities[Math.floor(similarities.length / 2)],
      aboveThreshold: {
        '0.3': similarities.filter(s => s >= 0.3).length,
        '0.4': similarities.filter(s => s >= 0.4).length,
        '0.5': similarities.filter(s => s >= 0.5).length,
        '0.6': similarities.filter(s => s >= 0.6).length,
        '0.7': similarities.filter(s => s >= 0.7).length
      }
    };

    console.log('\n📊 Similarity Statistics:');
    console.log(`   Highest: ${stats.highest.toFixed(4)}`);
    console.log(`   Average: ${stats.average.toFixed(4)}`);
    console.log(`   Median: ${stats.median.toFixed(4)}`);
    console.log(`   Lowest: ${stats.lowest.toFixed(4)}`);
    console.log('\n📈 Threshold Distribution:');
    Object.entries(stats.aboveThreshold).forEach(([threshold, count]) => {
      console.log(`   >=${threshold}: ${count} jobs (${((count / similarities.length) * 100).toFixed(1)}%)`);
    });

    res.status(200).json({
      success: true,
      data: {
        curriculum: {
          id: curriculum._id,
          name: curriculum.programName,
          embeddingDimensions: curriculum.embedding.length,
          embeddingVersion: curriculum.embeddingVersion,
          coursesCount: curriculum.courses?.length || 0
        },
        statistics: stats,
        jobSamples: results,
        config: {
          model: mlConfig.model.name,
          dimensions: mlConfig.model.embeddingDimensions,
          version: mlConfig.model.version,
          similarityThresholds: mlConfig.similarity
        },
        recommendation: stats.highest < 0.6 
          ? 'Consider lowering similarity threshold or checking if embeddings are from the same model'
          : stats.average >= 0.6
          ? 'Good embedding alignment - default threshold of 0.6 should work well'
          : 'Moderate alignment - consider threshold around 0.5'
      }
    });

  } catch (error) {
    console.error('🔴 Debug similarity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to debug similarity',
      error: error.message
    });
  }
};