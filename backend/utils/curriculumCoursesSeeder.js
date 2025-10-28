// seeders/curriculumCoursesSeeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Institution from '../models/institutionModel.js';
import Curriculum from '../models/curriculumModel.js';
import Course from '../models/coursesModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Program templates with their courses and skills
 */
const programTemplates = {
  computerScience: {
    programName: "Bachelor of Science in Computer Science",
    degree: "bachelor",
    department: "Computer Science",
    duration: 48, // 4 years
    targetIndustries: ["IT Jobs", "Engineering Jobs", "Scientific & QA Jobs"],
    description: "Comprehensive program covering software development, algorithms, and systems.",
    courses: [
      {
        courseCode: "CS101", courseName: "Introduction to Programming", credits: 4,
        description: "Fundamentals of programming using Python",
        skills: [
          { name: "python", category: "programming", proficiencyLevel: "beginner" },
          { name: "problem solving", category: "softSkills", proficiencyLevel: "intermediate" },
          { name: "algorithms", category: "programming", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "CS102", courseName: "Data Structures", credits: 4,
        description: "Advanced data structures and algorithms",
        skills: [
          { name: "java", category: "programming", proficiencyLevel: "intermediate" },
          { name: "algorithms", category: "programming", proficiencyLevel: "intermediate" },
          { name: "data structures", category: "programming", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "CS201", courseName: "Web Development", credits: 3,
        description: "Frontend and backend web development",
        skills: [
          { name: "html", category: "webDevelopment", proficiencyLevel: "advanced" },
          { name: "css", category: "webDevelopment", proficiencyLevel: "advanced" },
          { name: "javascript", category: "programming", proficiencyLevel: "intermediate" },
          { name: "react", category: "webDevelopment", proficiencyLevel: "intermediate" },
          { name: "node.js", category: "webDevelopment", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "CS202", courseName: "Database Systems", credits: 4,
        description: "Relational and NoSQL database management",
        skills: [
          { name: "sql", category: "database", proficiencyLevel: "advanced" },
          { name: "mysql", category: "database", proficiencyLevel: "intermediate" },
          { name: "postgresql", category: "database", proficiencyLevel: "intermediate" },
          { name: "mongodb", category: "database", proficiencyLevel: "beginner" },
          { name: "database design", category: "database", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "CS301", courseName: "Software Engineering", credits: 4,
        description: "Software development methodologies and practices",
        skills: [
          { name: "agile", category: "projectManagement", proficiencyLevel: "advanced" },
          { name: "scrum", category: "projectManagement", proficiencyLevel: "intermediate" },
          { name: "git", category: "programming", proficiencyLevel: "advanced" },
          { name: "testing", category: "testing", proficiencyLevel: "intermediate" },
          { name: "ci/cd", category: "cloud", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "CS302", courseName: "Operating Systems", credits: 4,
        description: "OS concepts, processes, and memory management",
        skills: [
          { name: "linux", category: "cloud", proficiencyLevel: "intermediate" },
          { name: "c", category: "programming", proficiencyLevel: "intermediate" },
          { name: "shell scripting", category: "programming", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "CS303", courseName: "Computer Networks", credits: 3,
        description: "Network protocols and architecture",
        skills: [
          { name: "networking", category: "cloud", proficiencyLevel: "intermediate" },
          { name: "tcp/ip", category: "cloud", proficiencyLevel: "intermediate" },
          { name: "network security", category: "security", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "CS401", courseName: "Machine Learning", credits: 4,
        description: "Introduction to ML algorithms and applications",
        skills: [
          { name: "python", category: "programming", proficiencyLevel: "advanced" },
          { name: "machine learning", category: "dataScience", proficiencyLevel: "intermediate" },
          { name: "tensorflow", category: "dataScience", proficiencyLevel: "beginner" },
          { name: "data analysis", category: "dataScience", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "CS402", courseName: "Mobile App Development", credits: 3,
        description: "iOS and Android application development",
        skills: [
          { name: "react native", category: "mobile", proficiencyLevel: "intermediate" },
          { name: "mobile app development", category: "mobile", proficiencyLevel: "intermediate" },
          { name: "javascript", category: "programming", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "CS403", courseName: "Cloud Computing", credits: 3,
        description: "Cloud platforms and services",
        skills: [
          { name: "aws", category: "cloud", proficiencyLevel: "intermediate" },
          { name: "docker", category: "cloud", proficiencyLevel: "intermediate" },
          { name: "kubernetes", category: "cloud", proficiencyLevel: "beginner" },
          { name: "cloud computing", category: "cloud", proficiencyLevel: "intermediate" }
        ]
      }
    ]
  },

  dataScience: {
    programName: "Master of Science in Data Science",
    degree: "master",
    department: "Data Science",
    duration: 24,
    targetIndustries: ["IT Jobs", "Scientific & QA Jobs", "Accounting & Finance Jobs"],
    description: "Advanced program in data analytics, machine learning, and big data.",
    courses: [
      {
        courseCode: "DS501", courseName: "Statistical Methods", credits: 3,
        skills: [
          { name: "statistics", category: "dataScience", proficiencyLevel: "advanced" },
          { name: "r", category: "programming", proficiencyLevel: "intermediate" },
          { name: "data analysis", category: "dataScience", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "DS502", courseName: "Machine Learning", credits: 4,
        skills: [
          { name: "python", category: "programming", proficiencyLevel: "advanced" },
          { name: "machine learning", category: "dataScience", proficiencyLevel: "advanced" },
          { name: "scikit-learn", category: "dataScience", proficiencyLevel: "advanced" },
          { name: "deep learning", category: "dataScience", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "DS503", courseName: "Big Data Analytics", credits: 4,
        skills: [
          { name: "hadoop", category: "dataScience", proficiencyLevel: "intermediate" },
          { name: "spark", category: "dataScience", proficiencyLevel: "intermediate" },
          { name: "big data", category: "dataScience", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "DS504", courseName: "Data Visualization", credits: 3,
        skills: [
          { name: "tableau", category: "dataScience", proficiencyLevel: "advanced" },
          { name: "power bi", category: "dataScience", proficiencyLevel: "intermediate" },
          { name: "data visualization", category: "dataScience", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "DS505", courseName: "Deep Learning", credits: 4,
        skills: [
          { name: "tensorflow", category: "dataScience", proficiencyLevel: "advanced" },
          { name: "pytorch", category: "dataScience", proficiencyLevel: "intermediate" },
          { name: "neural networks", category: "dataScience", proficiencyLevel: "advanced" }
        ]
      }
    ]
  },

  nursing: {
    programName: "Bachelor of Science in Nursing",
    degree: "bachelor",
    department: "Nursing",
    duration: 48,
    targetIndustries: ["Healthcare & Nursing Jobs"],
    description: "Comprehensive nursing program with clinical practice.",
    courses: [
      {
        courseCode: "NUR101", courseName: "Fundamentals of Nursing", credits: 4,
        skills: [
          { name: "patient care", category: "softSkills", proficiencyLevel: "intermediate" },
          { name: "communication", category: "softSkills", proficiencyLevel: "advanced" },
          { name: "medical terminology", category: "other", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "NUR201", courseName: "Pharmacology", credits: 3,
        skills: [
          { name: "medication administration", category: "other", proficiencyLevel: "advanced" },
          { name: "drug interactions", category: "other", proficiencyLevel: "intermediate" },
          { name: "critical thinking", category: "softSkills", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "NUR301", courseName: "Clinical Practice", credits: 6,
        skills: [
          { name: "clinical skills", category: "other", proficiencyLevel: "advanced" },
          { name: "teamwork", category: "softSkills", proficiencyLevel: "advanced" },
          { name: "problem solving", category: "softSkills", proficiencyLevel: "advanced" }
        ]
      }
    ]
  },

  businessAdmin: {
    programName: "Bachelor of Business Administration",
    degree: "bachelor",
    department: "Business",
    duration: 48,
    targetIndustries: ["Accounting & Finance Jobs", "Sales Jobs", "Consultancy Jobs"],
    description: "Comprehensive business management and administration program.",
    courses: [
      {
        courseCode: "BUS101", courseName: "Principles of Management", credits: 3,
        skills: [
          { name: "leadership", category: "softSkills", proficiencyLevel: "intermediate" },
          { name: "project management", category: "projectManagement", proficiencyLevel: "beginner" },
          { name: "strategic planning", category: "businessAnalysis", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "BUS201", courseName: "Financial Accounting", credits: 4,
        skills: [
          { name: "accounting", category: "businessAnalysis", proficiencyLevel: "advanced" },
          { name: "excel", category: "other", proficiencyLevel: "intermediate" },
          { name: "financial analysis", category: "businessAnalysis", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "BUS202", courseName: "Marketing Management", credits: 3,
        skills: [
          { name: "marketing strategy", category: "businessAnalysis", proficiencyLevel: "intermediate" },
          { name: "market research", category: "businessAnalysis", proficiencyLevel: "intermediate" },
          { name: "communication", category: "softSkills", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "BUS301", courseName: "Business Analytics", credits: 4,
        skills: [
          { name: "data analysis", category: "dataScience", proficiencyLevel: "intermediate" },
          { name: "excel", category: "other", proficiencyLevel: "advanced" },
          { name: "business intelligence", category: "businessAnalysis", proficiencyLevel: "intermediate" },
          { name: "tableau", category: "dataScience", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "BUS401", courseName: "Strategic Management", credits: 4,
        skills: [
          { name: "strategic planning", category: "businessAnalysis", proficiencyLevel: "advanced" },
          { name: "leadership", category: "softSkills", proficiencyLevel: "advanced" },
          { name: "decision making", category: "softSkills", proficiencyLevel: "advanced" }
        ]
      }
    ]
  },

  civilEngineering: {
    programName: "Bachelor of Engineering in Civil Engineering",
    degree: "bachelor",
    department: "Engineering",
    duration: 48,
    targetIndustries: ["Engineering Jobs", "Trade & Construction Jobs"],
    description: "Civil engineering with focus on infrastructure and construction.",
    courses: [
      {
        courseCode: "CE101", courseName: "Engineering Mechanics", credits: 4,
        skills: [
          { name: "structural analysis", category: "other", proficiencyLevel: "intermediate" },
          { name: "mathematics", category: "other", proficiencyLevel: "advanced" },
          { name: "problem solving", category: "softSkills", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "CE201", courseName: "Structural Design", credits: 4,
        skills: [
          { name: "autocad", category: "design", proficiencyLevel: "intermediate" },
          { name: "structural design", category: "other", proficiencyLevel: "advanced" },
          { name: "engineering software", category: "other", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "CE301", courseName: "Construction Management", credits: 3,
        skills: [
          { name: "project management", category: "projectManagement", proficiencyLevel: "advanced" },
          { name: "budgeting", category: "projectManagement", proficiencyLevel: "intermediate" },
          { name: "leadership", category: "softSkills", proficiencyLevel: "intermediate" }
        ]
      }
    ]
  },

  graphicDesign: {
    programName: "Bachelor of Arts in Graphic Design",
    degree: "bachelor",
    department: "Design",
    duration: 36,
    targetIndustries: ["Creative & Design Jobs", "PR, Advertising & Marketing Jobs"],
    description: "Creative program focusing on visual communication and design.",
    courses: [
      {
        courseCode: "GD101", courseName: "Design Fundamentals", credits: 3,
        skills: [
          { name: "graphic design", category: "design", proficiencyLevel: "intermediate" },
          { name: "creativity", category: "softSkills", proficiencyLevel: "advanced" },
          { name: "visual communication", category: "design", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "GD201", courseName: "Digital Design", credits: 4,
        skills: [
          { name: "photoshop", category: "design", proficiencyLevel: "advanced" },
          { name: "illustrator", category: "design", proficiencyLevel: "advanced" },
          { name: "figma", category: "design", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "GD202", courseName: "UI/UX Design", credits: 4,
        skills: [
          { name: "ui/ux design", category: "design", proficiencyLevel: "advanced" },
          { name: "figma", category: "design", proficiencyLevel: "advanced" },
          { name: "user research", category: "design", proficiencyLevel: "intermediate" },
          { name: "prototyping", category: "design", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "GD301", courseName: "Web Design", credits: 3,
        skills: [
          { name: "html", category: "webDevelopment", proficiencyLevel: "intermediate" },
          { name: "css", category: "webDevelopment", proficiencyLevel: "intermediate" },
          { name: "web design", category: "design", proficiencyLevel: "advanced" },
          { name: "responsive design", category: "webDevelopment", proficiencyLevel: "intermediate" }
        ]
      }
    ]
  },

  informationTechnology: {
    programName: "Diploma in Information Technology",
    degree: "diploma",
    department: "IT",
    duration: 24,
    targetIndustries: ["IT Jobs"],
    description: "Practical IT program covering networking, systems, and support.",
    courses: [
      {
        courseCode: "IT101", courseName: "Computer Fundamentals", credits: 3,
        skills: [
          { name: "computer hardware", category: "other", proficiencyLevel: "intermediate" },
          { name: "operating systems", category: "cloud", proficiencyLevel: "beginner" },
          { name: "troubleshooting", category: "softSkills", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "IT201", courseName: "Networking Basics", credits: 4,
        skills: [
          { name: "networking", category: "cloud", proficiencyLevel: "intermediate" },
          { name: "cisco", category: "cloud", proficiencyLevel: "beginner" },
          { name: "network security", category: "security", proficiencyLevel: "beginner" }
        ]
      },
      {
        courseCode: "IT202", courseName: "Database Management", credits: 3,
        skills: [
          { name: "sql", category: "database", proficiencyLevel: "intermediate" },
          { name: "mysql", category: "database", proficiencyLevel: "intermediate" },
          { name: "database administration", category: "database", proficiencyLevel: "beginner" }
        ]
      }
    ]
  },

  cybersecurity: {
    programName: "Master of Science in Cybersecurity",
    degree: "master",
    department: "Computer Science",
    duration: 24,
    targetIndustries: ["IT Jobs", "Engineering Jobs"],
    description: "Advanced cybersecurity and information security program.",
    courses: [
      {
        courseCode: "CYB501", courseName: "Network Security", credits: 4,
        skills: [
          { name: "network security", category: "security", proficiencyLevel: "advanced" },
          { name: "firewall", category: "security", proficiencyLevel: "advanced" },
          { name: "vpn", category: "security", proficiencyLevel: "intermediate" }
        ]
      },
      {
        courseCode: "CYB502", courseName: "Ethical Hacking", credits: 4,
        skills: [
          { name: "penetration testing", category: "security", proficiencyLevel: "advanced" },
          { name: "cybersecurity", category: "security", proficiencyLevel: "advanced" },
          { name: "vulnerability assessment", category: "security", proficiencyLevel: "advanced" }
        ]
      },
      {
        courseCode: "CYB503", courseName: "Cryptography", credits: 3,
        skills: [
          { name: "encryption", category: "security", proficiencyLevel: "advanced" },
          { name: "cryptography", category: "security", proficiencyLevel: "advanced" },
          { name: "security protocols", category: "security", proficiencyLevel: "advanced" }
        ]
      }
    ]
  }
};

/**
 * Seed curricula and courses
 */
const seedCurriculaAndCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all institutions
    const institutions = await Institution.find();
    
    if (institutions.length === 0) {
      console.error('❌ No institutions found. Please run institutionSeeder first!');
      process.exit(1);
    }

    console.log(`📊 Found ${institutions.length} institutions\n`);

    // Clear existing data
    console.log('🗑️  Clearing existing curricula and courses...');
    await Course.deleteMany({});
    await Curriculum.deleteMany({});
    console.log('✅ Cleared\n');

    const stats = {
      curricula: 0,
      courses: 0,
      byDegree: {},
      byCountry: {}
    };

    console.log('📝 Creating curricula and courses...\n');

    // Distribute programs across institutions
    const programKeys = Object.keys(programTemplates);
    let programIndex = 0;

    for (const institution of institutions) {
      // Each institution gets 1-2 programs
      const numPrograms = Math.floor(Math.random() * 2) + 1;
      
      console.log(`🏫 ${institution.name} (${institution.location.country})`);

      for (let i = 0; i < numPrograms; i++) {
        const programKey = programKeys[programIndex % programKeys.length];
        const template = programTemplates[programKey];
        programIndex++;

        // Create curriculum
        const curriculum = await Curriculum.create({
          institutionId: institution._id,
          programName: template.programName,
          degree: template.degree,
          department: template.department,
          duration: template.duration,
          targetIndustries: template.targetIndustries,
          description: template.description,
          courses: []
        });

        stats.curricula++;
        stats.byDegree[template.degree] = (stats.byDegree[template.degree] || 0) + 1;
        stats.byCountry[institution.location.country] = (stats.byCountry[institution.location.country] || 0) + 1;

        console.log(`  📚 ${template.programName}`);

        // Create courses for this curriculum
        const courseIds = [];
        for (const courseTemplate of template.courses) {
          const course = await Course.create({
            curriculumId: curriculum._id,
            courseCode: courseTemplate.courseCode,
            courseName: courseTemplate.courseName,
            credits: courseTemplate.credits,
            description: courseTemplate.description || "",
            skills: courseTemplate.skills
          });

          courseIds.push(course._id);
          stats.courses++;
        }

        // Update curriculum with course IDs
        curriculum.courses = courseIds;
        await curriculum.save();

        // Update institution's activePrograms
        await Institution.findByIdAndUpdate(
          institution._id,
          { $push: { activePrograms: curriculum._id } }
        );

        console.log(`     ✓ ${courseIds.length} courses created`);
      }
      console.log();
    }

    console.log('✅ SUCCESS! Curricula and courses seeded\n');
    console.log('📊 Summary:');
    console.log('='.repeat(60));
    console.log(`Total Curricula: ${stats.curricula}`);
    console.log(`Total Courses: ${stats.courses}`);
    
    console.log('\nBy Degree Type:');
    Object.entries(stats.byDegree).forEach(([degree, count]) => {
      console.log(`  ${degree}: ${count}`);
    });

    console.log('\nBy Country:');
    Object.entries(stats.byCountry).forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

    console.log('='.repeat(60));
    console.log('\n✅ Seeding completed successfully!');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding curricula:', error);
    process.exit(1);
  }
};

seedCurriculaAndCourses();