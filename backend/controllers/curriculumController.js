// backend/controllers/curriculumController.js
import Curriculum from '../models/curriculumModel.js';
import Course from '../models/coursesModel.js';
import Institution from '../models/institutionModel.js';
import mlService from '../services/mlService.js'; // ✅ ADD THIS IMPORT

/**
 * @desc    Get all curricula
 * @route   GET /api/curricula
 * @access  Public
 */
export const getCurricula = async (req, res) => {
  try {
    const { institutionId, department, degree } = req.query;
    
    // Build filter object
    const filter = {};
    if (institutionId) filter.institutionId = institutionId;
    if (department) filter.department = new RegExp(department, 'i');
    if (degree) filter.degree = degree;

    const curricula = await Curriculum.find(filter)
      .populate('institutionId', 'name type')
      .populate('courses', 'courseCode courseName credits')
      .sort({ programName: 1 });

    res.status(200).json({
      success: true,
      count: curricula.length,
      data: curricula
    });
  } catch (error) {
    console.error('Get curricula error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching curricula'
    });
  }
};

/**
 * @desc    Get single curriculum
 * @route   GET /api/curricula/:id
 * @access  Public
 */
export const getCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id)
      .populate('institutionId')
      .populate('courses');

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    res.status(200).json({
      success: true,
      data: curriculum
    });
  } catch (error) {
    console.error('Get curriculum error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching curriculum'
    });
  }
};

/**
 * ✅ UPDATED: Create new curriculum WITH embedding generation
 * @desc    Create new curriculum
 * @route   POST /api/curricula
 * @access  Private (Admin/Institution)
 */
export const createCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.create(req.body);

    // Update institution's active programs
    await Institution.findByIdAndUpdate(
      req.body.institutionId,
      { $push: { activePrograms: curriculum._id } }
    );

    // ✅ NEW: Generate embedding for the curriculum
    try {
      if (mlService.isModelReady()) {
        console.log(`🔄 Generating embedding for curriculum: ${curriculum.programName}`);
        
        // Populate courses to build comprehensive text
        await curriculum.populate('courses');
        
        const curriculumText = await curriculum.getTextForEmbedding();
        const embedding = await mlService.generateEmbedding(curriculumText);
        
        curriculum.embedding = embedding;
        curriculum.embeddingGenerated = new Date();
        curriculum.embeddingVersion = 'v1';
        curriculum.embeddingError = null;
        
        await curriculum.save();
        
        console.log(`✅ Embedding generated for curriculum: ${curriculum.programName}`);
      } else {
        console.log(`⚠️  ML model not ready, curriculum saved without embedding`);
      }
    } catch (embeddingError) {
      console.error(`❌ Failed to generate embedding for curriculum:`, embeddingError.message);
      curriculum.embeddingError = embeddingError.message;
      await curriculum.save();
      // Continue - don't fail the creation if embedding fails
    }

    res.status(201).json({
      success: true,
      data: curriculum,
      message: 'Curriculum created successfully'
    });
  } catch (error) {
    console.error('Create curriculum error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating curriculum'
    });
  }
};

/**
 * ✅ UPDATED: Update curriculum WITH embedding regeneration
 * @desc    Update curriculum
 * @route   PUT /api/curricula/:id
 * @access  Private (Admin/Institution)
 */
export const updateCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // ✅ NEW: Regenerate embedding after update
    try {
      if (mlService.isModelReady()) {
        console.log(`🔄 Regenerating embedding for updated curriculum: ${curriculum.programName}`);
        
        // Populate courses to build comprehensive text
        await curriculum.populate('courses');
        
        const curriculumText = await curriculum.getTextForEmbedding();
        const embedding = await mlService.generateEmbedding(curriculumText);
        
        curriculum.embedding = embedding;
        curriculum.embeddingGenerated = new Date();
        curriculum.embeddingVersion = 'v1';
        curriculum.embeddingError = null;
        
        await curriculum.save();
        
        console.log(`✅ Embedding regenerated for curriculum: ${curriculum.programName}`);
      }
    } catch (embeddingError) {
      console.error(`❌ Failed to regenerate embedding:`, embeddingError.message);
      curriculum.embeddingError = embeddingError.message;
      await curriculum.save();
      // Continue - don't fail the update if embedding fails
    }

    res.status(200).json({
      success: true,
      data: curriculum,
      message: 'Curriculum updated successfully'
    });
  } catch (error) {
    console.error('Update curriculum error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating curriculum'
    });
  }
};

/**
 * @desc    Delete curriculum
 * @route   DELETE /api/curricula/:id
 * @access  Private (Admin/Institution)
 */
export const deleteCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id);

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Delete associated courses
    await Course.deleteMany({ curriculumId: req.params.id });

    // Remove from institution's active programs
    await Institution.findByIdAndUpdate(
      curriculum.institutionId,
      { $pull: { activePrograms: req.params.id } }
    );

    await Curriculum.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Curriculum and associated courses deleted successfully'
    });
  } catch (error) {
    console.error('Delete curriculum error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting curriculum'
    });
  }
};

/**
 * @desc    Add course to curriculum
 * @route   POST /api/curricula/:id/courses
 * @access  Private (Admin/Institution)
 */
export const addCourse = async (req, res) => {
  try {
    const { id: curriculumId } = req.params;
    const courseData = { ...req.body, curriculumId };

    const course = await Course.create(courseData);

    // Add course to curriculum
    const curriculum = await Curriculum.findByIdAndUpdate(
      curriculumId,
      { $push: { courses: course._id } },
      { new: true }
    );

    // ✅ NEW: Regenerate curriculum embedding since courses changed
    try {
      if (mlService.isModelReady() && curriculum) {
        console.log(`🔄 Regenerating embedding after adding course to: ${curriculum.programName}`);
        
        await curriculum.populate('courses');
        
        const curriculumText = await curriculum.getTextForEmbedding();
        const embedding = await mlService.generateEmbedding(curriculumText);
        
        curriculum.embedding = embedding;
        curriculum.embeddingGenerated = new Date();
        curriculum.embeddingError = null;
        
        await curriculum.save();
        
        console.log(`✅ Embedding regenerated after course addition`);
      }
    } catch (embeddingError) {
      console.error(`❌ Failed to regenerate embedding:`, embeddingError.message);
      // Continue - don't fail the course addition if embedding fails
    }

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course added to curriculum successfully'
    });
  } catch (error) {
    console.error('Add course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding course'
    });
  }
};

/**
 * @desc    Get curriculum skills summary
 * @route   GET /api/curricula/:id/skills
 * @access  Public
 */
export const getCurriculumSkills = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id)
      .populate('courses');

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Extract and aggregate skills from all courses
    const skillsMap = new Map();
    
    curriculum.courses.forEach(course => {
      if (course.skills && Array.isArray(course.skills)) {
        course.skills.forEach(skill => {
          const key = skill.name.toLowerCase();
          if (skillsMap.has(key)) {
            const existing = skillsMap.get(key);
            existing.frequency += 1;
          } else {
            skillsMap.set(key, {
              name: skill.name,
              category: skill.category,
              frequency: 1,
              proficiencyLevel: skill.proficiencyLevel
            });
          }
        });
      }
    });

    const skills = Array.from(skillsMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    res.status(200).json({
      success: true,
      data: {
        totalSkills: skills.length,
        skills
      }
    });
  } catch (error) {
    console.error('Get curriculum skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching curriculum skills'
    });
  }
};

// ✅ NEW ENDPOINTS FOR EMBEDDING MANAGEMENT

/**
 * @desc    Generate embeddings for existing curricula without them
 * @route   POST /api/curricula/generate-embeddings
 * @access  Private
 */
export const generateCurriculumEmbeddings = async (req, res) => {
  try {
    const { forceRegenerate = false } = req.body;

    console.log(`🔄 Starting embedding generation for curricula...`);

    // Build query for curricula needing embeddings
    const query = forceRegenerate 
      ? {} 
      : { 
          $or: [
            { embedding: { $exists: false } },
            { embedding: null },
            { embedding: { $size: 0 } }
          ]
        };

    const curricula = await Curriculum.find(query)
      .populate('courses')
      .select('programName description embedding embeddingGenerated courses');

    if (curricula.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No curricula need embedding generation',
        stats: { processed: 0, succeeded: 0, failed: 0 }
      });
    }

    console.log(`📊 Found ${curricula.length} curricula needing embeddings`);

    let succeeded = 0;
    let failed = 0;
    const errors = [];

    for (const curriculum of curricula) {
      try {
        const curriculumText = await curriculum.getTextForEmbedding();
        
        if (!curriculumText || curriculumText.trim().length < 20) {
          console.log(`⚠️  Skipping curriculum ${curriculum._id}: insufficient text for embedding`);
          continue;
        }

        const embedding = await mlService.generateEmbedding(curriculumText);
        
        // Update curriculum with embedding
        await Curriculum.findByIdAndUpdate(curriculum._id, {
          embedding,
          embeddingGenerated: new Date(),
          embeddingVersion: 'v1',
          embeddingError: null
        });

        succeeded++;
        console.log(`✅ Embedded curriculum ${succeeded}/${curricula.length}: ${curriculum.programName}`);

      } catch (error) {
        failed++;
        errors.push(`Curriculum ${curriculum._id}: ${error.message}`);
        
        // Mark curriculum as having embedding error
        await Curriculum.findByIdAndUpdate(curriculum._id, {
          embeddingError: error.message
        });

        console.error(`❌ Failed to embed curriculum ${curriculum._id}:`, error.message);
      }

      // Small delay between curricula
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    res.status(200).json({
      success: true,
      message: `Embedding generation completed: ${succeeded} succeeded, ${failed} failed`,
      stats: {
        total: curricula.length,
        processed: succeeded + failed,
        succeeded,
        failed
      },
      errors: errors.slice(0, 10)
    });

  } catch (error) {
    console.error('Generate curriculum embeddings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate curriculum embeddings',
      error: error.message
    });
  }
};

/**
 * @desc    Get embedding generation status for curricula
 * @route   GET /api/curricula/embedding-status
 * @access  Private
 */
export const getCurriculumEmbeddingStatus = async (req, res) => {
  try {
    const totalCurricula = await Curriculum.countDocuments();
    const curriculaWithEmbeddings = await Curriculum.countDocuments({ 
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    });
    const curriculaWithErrors = await Curriculum.countDocuments({ 
      embeddingError: { $exists: true, $ne: null }
    });

    const mlStatus = mlService.getStatus();

    res.status(200).json({
      success: true,
      data: {
        mlService: mlStatus,
        embeddings: {
          totalCurricula,
          curriculaWithEmbeddings,
          curriculaWithErrors,
          coveragePercentage: totalCurricula > 0 ? (curriculaWithEmbeddings / totalCurricula) * 100 : 0,
          errorPercentage: totalCurricula > 0 ? (curriculaWithErrors / totalCurricula) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get curriculum embedding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch curriculum embedding status'
    });
  }
};

/**
 * @desc    Manually regenerate embedding for specific curriculum
 * @route   POST /api/curricula/:id/regenerate-embedding
 * @access  Private
 */
export const regenerateCurriculumEmbedding = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id).populate('courses');

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    const curriculumText = await curriculum.getTextForEmbedding();
    const embedding = await mlService.generateEmbedding(curriculumText);
    
    curriculum.embedding = embedding;
    curriculum.embeddingGenerated = new Date();
    curriculum.embeddingVersion = 'v1';
    curriculum.embeddingError = null;
    
    await curriculum.save();

    res.status(200).json({
      success: true,
      message: 'Embedding regenerated successfully',
      data: {
        curriculumId: curriculum._id,
        programName: curriculum.programName,
        embeddingGenerated: curriculum.embeddingGenerated,
        embeddingDimensions: embedding.length
      }
    });

  } catch (error) {
    console.error('Regenerate curriculum embedding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate embedding',
      error: error.message
    });
  }
};