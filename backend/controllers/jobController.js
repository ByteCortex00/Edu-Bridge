import axios from "axios";
import JobPosting from "../models/jobPostingModel.js";
import skillsExtractor from "../services/skillsExtractor.js";

/**
 * Fetch jobs from Adzuna API and store them in MongoDB
 */
export const fetchJobsFromAdzuna = async (req, res) => {
  try {
    const { 
      country = "gb", 
      what = "developer", 
      where = "",
      page = 1,
      results_per_page = 20 
    } = req.query;

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    // Validate API credentials
    if (!appId || !appKey) {
      return res.status(400).json({
        success: false,
        message: "Adzuna API credentials missing"
      });
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
    
    const params = {
      app_id: appId,
      app_key: appKey,
      results_per_page: parseInt(results_per_page),
      what: what
    };

    // Add location if provided
    if (where) {
      params.where = where;
    }

    const { data } = await axios.get(url, { params });

    if (!data.results) {
      return res.status(404).json({
        success: false,
        message: "No jobs found"
      });
    }

    const jobs = data.results;
    let savedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const job of jobs) {
      try {
        // More robust duplicate check
        const exists = await JobPosting.findOne({ 
          $or: [
            { adzunaId: job.id },
            { title: job.title, company: job.company?.display_name }
          ]
        });
        
        if (exists) {
          skippedCount++;
          continue;
        }

        // Extract skills from job description
        const extractedSkills = skillsExtractor.extractSkills(job.description || "");

        const jobData = {
          adzunaId: job.id,
          title: job.title,
          company: job.company?.display_name || "Unknown Company",
          location: {
            country: job.location?.area?.[0] || country.toUpperCase(),
            region: job.location?.area?.[1] || "",
            city: job.location?.area?.[2] || "",
          },
          description: job.description || "No description available",
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          category: job.category?.label || "Uncategorized",
          contractType: job.contract_type || "full_time",
          requiredSkills: extractedSkills, // Add extracted skills
          postedDate: job.created ? new Date(job.created) : new Date(),
          expiryDate: job.expiration_date ? new Date(job.expiration_date) : null,
          sourceUrl: job.redirect_url || "",
          rawData: job,
        };

        await JobPosting.create(jobData);
        savedCount++;

      } catch (jobError) {
        errors.push(`Job ${job.id}: ${jobError.message}`);
        console.error(`Error processing job ${job.id}:`, jobError);
      }
    }

    res.status(200).json({
      success: true,
      message: `${savedCount} new jobs saved successfully`,
      stats: {
        totalFetched: jobs.length,
        saved: savedCount,
        skipped: skippedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Show first 5 errors
    });

  } catch (error) {
    console.error("Adzuna Fetch Error:", error.message);
    
    if (error.response) {
      // Adzuna API error
      return res.status(error.response.status).json({
        success: false,
        message: `Adzuna API error: ${error.response.data.message || error.response.statusText}`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch jobs from Adzuna API" 
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
      sortBy = "createdAt",
      sortOrder = "desc",
      category,
      location,
      skills,
      company
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = new RegExp(category, 'i');
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
 * Get job statistics
 */
export const getJobStats = async (req, res) => {
  try {
    const stats = await JobPosting.aggregate([
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

    const totalJobs = await JobPosting.countDocuments();
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
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalJobs,
        categories: stats,
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