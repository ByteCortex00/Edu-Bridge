// backend/controllers/institutionController.js
import Institution from '../models/institutionModel.js';
import Curriculum from '../models/curriculumModel.js';

/**
 * @desc    Get all institutions
 * @route   GET /api/institutions
 * @access  Public
 */
export const getInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find()
      .populate('activePrograms', 'programName degree')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: institutions.length,
      data: institutions
    });
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching institutions'
    });
  }
};

/**
 * @desc    Get single institution
 * @route   GET /api/institutions/:id
 * @access  Public
 */
export const getInstitution = async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id)
      .populate({
        path: 'activePrograms',
        populate: {
          path: 'courses',
          select: 'courseCode courseName credits'
        }
      });

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching institution'
    });
  }
};

/**
 * @desc    Create new institution
 * @route   POST /api/institutions
 * @access  Private (Admin/Institution)
 */
export const createInstitution = async (req, res) => {
  try {
    const institution = await Institution.create(req.body);

    res.status(201).json({
      success: true,
      data: institution,
      message: 'Institution created successfully'
    });
  } catch (error) {
    console.error('Create institution error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Institution with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating institution'
    });
  }
};

/**
 * @desc    Update institution
 * @route   PUT /api/institutions/:id
 * @access  Private (Admin/Institution)
 */
export const updateInstitution = async (req, res) => {
  try {
    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution,
      message: 'Institution updated successfully'
    });
  } catch (error) {
    console.error('Update institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating institution'
    });
  }
};

/**
 * @desc    Delete institution
 * @route   DELETE /api/institutions/:id
 * @access  Private (Admin)
 */
export const deleteInstitution = async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Check if institution has active programs
    const activePrograms = await Curriculum.countDocuments({ 
      institutionId: req.params.id 
    });

    if (activePrograms > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete institution with active programs'
      });
    }

    await Institution.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Institution deleted successfully'
    });
  } catch (error) {
    console.error('Delete institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting institution'
    });
  }
};

/**
 * @desc    Get institution statistics
 * @route   GET /api/institutions/:id/stats
 * @access  Public
 */
export const getInstitutionStats = async (req, res) => {
  try {
    const institutionId = req.params.id;

    // Get program count
    const programCount = await Curriculum.countDocuments({ institutionId });

    // Get course count
    const courseCount = await Curriculum.aggregate([
      { $match: { institutionId: new mongoose.Types.ObjectId(institutionId) } },
      { $unwind: '$courses' },
      { $count: 'totalCourses' }
    ]);

    // Get recent analysis count
    const analysisCount = await Curriculum.aggregate([
      { $match: { institutionId: new mongoose.Types.ObjectId(institutionId) } },
      {
        $lookup: {
          from: 'skillsgaps',
          localField: '_id',
          foreignField: 'curriculumId',
          as: 'analyses'
        }
      },
      { $unwind: '$analyses' },
      { $count: 'totalAnalyses' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        programCount,
        courseCount: courseCount[0]?.totalCourses || 0,
        analysisCount: analysisCount[0]?.totalAnalyses || 0
      }
    });
  } catch (error) {
    console.error('Get institution stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching institution statistics'
    });
  }
};