// backend/controllers/jobController.js
import axios from "axios";
import JobPosting from "../models/jobPostingModel.js";
import skillsExtractor from "../services/skillExtractor.js";
import mlService from "../services/mlService.js"; // ✅ ADDED

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
 * UPDATED: Now includes embedding generation
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
        // ✅ NEW: Initialize embedding fields
        embedding: null,
        embeddingGenerated: null,
        embeddingError: null
      };

      // ✅ NEW: Generate embedding for the job
      try {
        if (mlService.isModelReady()) {
          const jobText = `${jobData.title} ${jobData.description}`;
          const embedding = await mlService.generateEmbedding(jobText);
          
          jobData.embedding = embedding;
          jobData.embeddingGenerated = new Date();
          jobData.embeddingVersion = 'v1';
          
          console.log(`✅ Generated embedding for job: ${jobData.title.substring(0, 50)}...`);
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
      company
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

    const jobs = await JobPosting.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

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
    const job = await JobPosting.findById(req.params.id);
    
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

    res.status(200).json({
      success: true,
      data: {
        totalJobs,
        byCountry: countryStats,
        byCategory: categoryStats,
        topSkills
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
// ... existing controller functions (getAllJobs, getJobById, etc.) ...

/**
 * ✅ NEW: Generate embeddings for existing jobs without them
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

    // Build query for jobs needing embeddings
    const query = forceRegenerate 
      ? {} 
      : { 
          $or: [
            { embedding: { $exists: false } },
            { embedding: null },
            { embedding: { $size: 0 } }
          ]
        };

    const jobs = await JobPosting.find(query)
      .limit(limit)
      .select('title description embedding embeddingGenerated');

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
          const jobText = `${jobData.title} ${jobData.description}`;
          
          if (!jobText || jobText.trim().length < 10) {
            console.log(`⚠️ Skipping job ${job._id}: insufficient text for embedding`);
            continue;
          }

          const embedding = await mlService.generateEmbedding(jobText);
          
          // Update job with embedding
          await JobPosting.findByIdAndUpdate(job._id, {
            embedding,
            embeddingGenerated: new Date(),
            embeddingVersion: 'v1',
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
 * ✅ NEW: Get embedding generation status
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

    const mlStatus = mlService.getStatus();

    res.status(200).json({
      success: true,
      data: {
        mlService: mlStatus,
        embeddings: {
          totalJobs,
          jobsWithEmbeddings,
          jobsWithErrors,
          coveragePercentage: totalJobs > 0 ? (jobsWithEmbeddings / totalJobs) * 100 : 0,
          errorPercentage: totalJobs > 0 ? (jobsWithErrors / totalJobs) * 100 : 0
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
// Add this to your jobController.js temporarily for testing

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
        testEmbeddingSample: testEmbedding ? testEmbedding.slice(0, 5) : null
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