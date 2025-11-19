// src/pages/Curricula.jsx
import { useEffect, useState } from 'react';
import { useCurriculaAPI } from '../api/curricula';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Search, TrendingUp, Plus, Edit, Trash2, X, Save, PlusCircle, MinusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';

export function Curricula() {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);

  const navigate = useNavigate();
  const curriculaAPI = useCurriculaAPI();
  const { user } = useAuthStore();

  const isEditable = user?.role === 'institution' || user?.role === 'admin';

  useEffect(() => {
    loadCurricula();
  }, [filterDegree, user]);

  const loadCurricula = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDegree !== 'all') params.degree = filterDegree;
      // If institution user, usually backend filters automatically, but we can pass ID just in case
      if (user?.role === 'institution' && user?.institutionId) {
        params.institutionId = user.institutionId._id || user.institutionId;
      }
      const response = await curriculaAPI.getAll(params);
      if (response.success) setCurricula(response.data);
    } catch (error) {
      console.error('Error loading curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this curriculum?')) return;
    try {
      await curriculaAPI.delete(id);
      loadCurricula();
    } catch (error) {
      alert('Failed to delete curriculum');
    }
  };

  const openModal = (curriculum = null) => {
    setEditingCurriculum(curriculum);
    setShowModal(true);
  };

  const filteredCurricula = curricula.filter((curr) =>
    curr.programName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ... (Loading check can stay here)

  return (
    <PageLayout
      title="Curricula Management"
      description="Manage educational programs and view gap analysis"
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search curricula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <select
            value={filterDegree}
            onChange={(e) => setFilterDegree(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Degrees</option>
            <option value="bachelor">Bachelor</option>
            <option value="master">Master</option>
            <option value="phd">PhD</option>
          </select>
          {isEditable && (
            <button
              onClick={() => openModal(null)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Curriculum
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCurricula.map((curr) => (
          <div key={curr._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              {isEditable && (
                <div className="flex space-x-2">
                  <button onClick={() => openModal(curr)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(curr._id)} className="p-1 hover:bg-red-50 rounded text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{curr.programName}</h3>
            <p className="text-sm text-gray-500 mb-4">{curr.department} • {curr.degree}</p>
            
            <div className="mt-auto pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate(`/app/analysis/${curr._id}`)}
                className="w-full flex items-center justify-center py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Gap Analysis
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <CurriculumModal
          curriculum={editingCurriculum}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadCurricula();
          }}
          institutionId={user?.institutionId}
          api={curriculaAPI}
        />
      )}
    </PageLayout>
  );
}

function CurriculumModal({ curriculum, onClose, onSuccess, institutionId, api }) {
  const safeInstId = typeof institutionId === 'object' ? institutionId?._id : institutionId;

  const [formData, setFormData] = useState({
    programName: curriculum?.programName || '',
    degree: curriculum?.degree || 'bachelor',
    department: curriculum?.department || '',
    duration: curriculum?.duration || 48,
    description: curriculum?.description || '',
    targetIndustries: curriculum?.targetIndustries ? curriculum.targetIndustries.join(', ') : ''
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize courses and their skills when editing
  useEffect(() => {
    if (curriculum && curriculum.courses && Array.isArray(curriculum.courses)) {
      const mappedCourses = curriculum.courses.map(c => ({
        _id: c._id,
        courseCode: c.courseCode || '',
        courseName: c.courseName || '',
        credits: c.credits || 3,
        description: c.description || '',
        // ✅ Map existing skills
        skills: Array.isArray(c.skills) ? c.skills.map(s => ({
          name: s.name || '',
          category: s.category || '',
          proficiencyLevel: s.proficiencyLevel || 'beginner'
        })) : []
      }));
      setCourses(mappedCourses);
    }
  }, [curriculum]);

  // --- Course Handlers ---

  const addCourseField = () => {
    setCourses([
      ...courses,
      {
        courseName: '',
        courseCode: '',
        credits: 3,
        description: '',
        skills: [] // ✅ Initialize with empty skills array
      }
    ]);
  };

  const removeCourseField = (index) => {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  };

  const handleCourseChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  // --- Skill Handlers ---

  const addSkill = (courseIndex) => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].skills.push({
      name: '',
      category: '',
      proficiencyLevel: 'beginner'
    });
    setCourses(updatedCourses);
  };

  const removeSkill = (courseIndex, skillIndex) => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].skills = updatedCourses[courseIndex].skills.filter((_, i) => i !== skillIndex);
    setCourses(updatedCourses);
  };

  const handleSkillChange = (courseIndex, skillIndex, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].skills[skillIndex][field] = value;
    setCourses(updatedCourses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        institutionId: safeInstId,
        targetIndustries: formData.targetIndustries.split(',').map(s => s.trim()).filter(Boolean),
        courses: courses // ✅ This now includes the nested skills data
      };

      const res = curriculum
        ? await api.update(curriculum._id, payload)
        : await api.create(payload);

      if (res.success) {
        onSuccess();
      } else {
        alert(res.message || 'Operation failed');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold">{curriculum ? 'Edit Curriculum' : 'New Curriculum'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Curriculum Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Program Name</label>
              <input required className="w-full border rounded-md px-3 py-2 mt-1"
                value={formData.programName} onChange={e => setFormData({...formData, programName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input required className="w-full border rounded-md px-3 py-2 mt-1"
                value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <select className="w-full border rounded-md px-3 py-2 mt-1"
                value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})}>
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
                <option value="phd">PhD</option>
                <option value="diploma">Diploma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (Months)</label>
              <input type="number" required className="w-full border rounded-md px-3 py-2 mt-1"
                value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Target Industries (comma separated)</label>
              <input className="w-full border rounded-md px-3 py-2 mt-1" placeholder="IT Jobs, Engineering"
                value={formData.targetIndustries} onChange={e => setFormData({...formData, targetIndustries: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea className="w-full border rounded-md px-3 py-2 mt-1" rows="3"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          {/* Courses Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Courses & Skills</h3>
              <button type="button" onClick={addCourseField} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <PlusCircle className="w-4 h-4 mr-1" /> Add Course
              </button>
            </div>

            <div className="space-y-6">
              {courses.map((course, cIndex) => (
                <div key={cIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                  <button type="button" onClick={() => removeCourseField(cIndex)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                    <MinusCircle className="w-5 h-5" />
                  </button>

                  {/* Course Inputs */}
                  <div className="grid grid-cols-12 gap-3 mb-4">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-500">Code</label>
                      <input required placeholder="CS101" className="w-full border rounded px-2 py-1 text-sm"
                        value={course.courseCode} onChange={e => handleCourseChange(cIndex, 'courseCode', e.target.value)} />
                    </div>
                    <div className="col-span-7">
                      <label className="block text-xs font-medium text-gray-500">Course Name</label>
                      <input required placeholder="Intro to Programming" className="w-full border rounded px-2 py-1 text-sm"
                        value={course.courseName} onChange={e => handleCourseChange(cIndex, 'courseName', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500">Credits</label>
                      <input type="number" required className="w-full border rounded px-2 py-1 text-sm"
                        value={course.credits} onChange={e => handleCourseChange(cIndex, 'credits', e.target.value)} />
                    </div>
                    <div className="col-span-12">
                      <input placeholder="Description..." className="w-full border rounded px-2 py-1 text-sm text-gray-600"
                        value={course.description} onChange={e => handleCourseChange(cIndex, 'description', e.target.value)} />
                    </div>
                  </div>

                  {/* ✅ Skills Sub-Section */}
                  <div className="bg-white p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Skills Covered</label>
                      <button type="button" onClick={() => addSkill(cIndex)} className="text-xs text-green-600 hover:text-green-800 flex items-center">
                        <Plus className="w-3 h-3 mr-1" /> Add Skill
                      </button>
                    </div>

                    {course.skills.length === 0 && <p className="text-xs text-gray-400 italic">No skills added yet.</p>}

                    {course.skills.map((skill, sIndex) => (
                      <div key={sIndex} className="flex gap-2 mb-2 items-center">
                        <input placeholder="Skill (e.g. Python)" className="flex-1 border rounded px-2 py-1 text-xs"
                          value={skill.name} onChange={e => handleSkillChange(cIndex, sIndex, 'name', e.target.value)} />

                        <input placeholder="Category (e.g. Programming)" className="flex-1 border rounded px-2 py-1 text-xs"
                          value={skill.category} onChange={e => handleSkillChange(cIndex, sIndex, 'category', e.target.value)} />

                        <select className="border rounded px-2 py-1 text-xs w-24"
                          value={skill.proficiencyLevel} onChange={e => handleSkillChange(cIndex, sIndex, 'proficiencyLevel', e.target.value)}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>

                        <button type="button" onClick={() => removeSkill(cIndex, sIndex)} className="text-red-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Curriculum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}