// backend/controllers/curriculumController.js
import Curriculum from '../models/curriculumModel.js';
import Course from '../models/coursesModel.js';

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
      .populate({
        path: 'courses',
        populate: {
          path: 'skills'
        }
      });

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
    const { curriculumId } = req.params;
    const courseData = { ...req.body, curriculumId };

    const course = await Course.create(courseData);

    // Add course to curriculum
    await Curriculum.findByIdAndUpdate(
      curriculumId,
      { $push: { courses: course._id } }
    );

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