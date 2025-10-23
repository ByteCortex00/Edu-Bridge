/**
 * Comprehensive skills database organized by category
 * This helps identify and categorize skills from job descriptions
 */
const skillsTaxonomy = {
  programming: [
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift',
    'kotlin', 'go', 'rust', 'typescript', 'sql', 'r', 'scala', 'perl',
    'dart', 'matlab', 'shell scripting', 'bash'
  ],
  
  webDevelopment: [
    'html', 'css', 'react', 'angular', 'vue', 'vue.js', 'node.js', 'express',
    'django', 'flask', 'asp.net', 'spring', 'laravel', 'wordpress',
    'responsive design', 'rest api', 'graphql', 'websockets', 'next.js',
    'nuxt.js', 'gatsby', 'tailwind css', 'bootstrap', 'sass', 'less'
  ],
  
  mobile: [
    'ios development', 'android development', 'react native', 'flutter',
    'xamarin', 'ionic', 'swift ui', 'jetpack compose', 'mobile app development'
  ],
  
  database: [
    'mongodb', 'postgresql', 'mysql', 'oracle', 'sql server', 'redis',
    'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'mariadb',
    'sqlite', 'neo4j', 'couchdb', 'database design', 'data modeling'
  ],
  
  cloud: [
    'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform',
    'jenkins', 'gitlab ci', 'circleci', 'serverless', 'cloud computing',
    'devops', 'ci/cd', 'ansible', 'chef', 'puppet', 'microservices'
  ],
  
  dataScience: [
    'machine learning', 'deep learning', 'data analysis', 'statistics',
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
    'data visualization', 'tableau', 'power bi', 'data mining',
    'predictive modeling', 'neural networks', 'natural language processing',
    'computer vision', 'big data', 'spark', 'hadoop'
  ],
  
  softSkills: [
    'communication', 'teamwork', 'leadership', 'problem solving',
    'critical thinking', 'time management', 'adaptability', 'creativity',
    'collaboration', 'presentation skills', 'analytical skills',
    'attention to detail', 'work ethic', 'interpersonal skills'
  ],
  
  projectManagement: [
    'agile', 'scrum', 'kanban', 'jira', 'project planning', 
    'stakeholder management', 'risk management', 'budgeting',
    'waterfall', 'project coordination', 'resource management',
    'sprint planning', 'product management'
  ],
  
  design: [
    'ui/ux design', 'figma', 'adobe xd', 'sketch', 'photoshop', 'illustrator',
    'user research', 'wireframing', 'prototyping', 'user interface design',
    'user experience', 'graphic design', 'web design', 'mobile design',
    'design thinking', 'usability testing'
  ],
  
  businessAnalysis: [
    'requirements gathering', 'process modeling', 'data modeling',
    'business intelligence', 'stakeholder analysis', 'feasibility study',
    'business process', 'systems analysis', 'documentation',
    'business strategy', 'market research', 'competitive analysis'
  ],
  
  testing: [
    'quality assurance', 'unit testing', 'integration testing',
    'automated testing', 'manual testing', 'selenium', 'jest',
    'mocha', 'cypress', 'test driven development', 'bug tracking',
    'regression testing', 'performance testing', 'security testing'
  ],
  
  security: [
    'cybersecurity', 'network security', 'information security',
    'penetration testing', 'encryption', 'authentication',
    'authorization', 'security protocols', 'vulnerability assessment',
    'firewall', 'vpn', 'security compliance'
  ]
};

/**
 * Common skill aliases and variations
 * Maps alternative names to standard skill names
 */
const skillAliases = {
  'js': 'javascript',
  'ts': 'typescript',
  'reactjs': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'vuejs': 'vue.js',
  'angularjs': 'angular',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'dl': 'deep learning',
  'aws': 'amazon web services',
  'gcp': 'google cloud',
  'k8s': 'kubernetes',
  'qa': 'quality assurance',
  'ui': 'user interface',
  'ux': 'user experience',
  'api': 'rest api',
  'rdbms': 'database',
  'nosql': 'mongodb',
  'ci/cd': 'continuous integration',
  'devops': 'development operations',
  'fullstack': 'full stack development',
  'frontend': 'front end development',
  'backend': 'back end development'
};

/**
 * Get all skills as a flat array
 * @returns {Array<string>} All skills from all categories
 */
export const getAllSkills = () => {
  return Object.values(skillsTaxonomy).flat();
};

/**
 * Get category for a specific skill
 * @param {string} skill - The skill name to look up
 * @returns {string} The category name or 'other' if not found
 */
export const getSkillCategory = (skill) => {
  const lowerSkill = skill.toLowerCase().trim();
  
  for (const [category, skills] of Object.entries(skillsTaxonomy)) {
    if (skills.includes(lowerSkill)) {
      return category;
    }
  }
  
  return 'other';
};

/**
 * Normalize skill name (handle aliases and variations)
 * @param {string} skill - The skill name to normalize
 * @returns {string} Normalized skill name
 */
export const normalizeSkill = (skill) => {
  const normalized = skill.toLowerCase().trim();
  return skillAliases[normalized] || normalized;
};

/**
 * Check if a skill exists in taxonomy
 * @param {string} skill - The skill to check
 * @returns {boolean} True if skill exists
 */
export const isValidSkill = (skill) => {
  const allSkills = getAllSkills();
  const normalizedSkill = normalizeSkill(skill);
  return allSkills.includes(normalizedSkill);
};

/**
 * Get all skills in a specific category
 * @param {string} category - The category name
 * @returns {Array<string>} Skills in that category
 */
export const getSkillsByCategory = (category) => {
  return skillsTaxonomy[category] || [];
};

/**
 * Get all categories
 * @returns {Array<string>} All category names
 */
export const getAllCategories = () => {
  return Object.keys(skillsTaxonomy);
};

export default {
  skillsTaxonomy,
  skillAliases,
  getAllSkills,
  getSkillCategory,
  normalizeSkill,
  isValidSkill,
  getSkillsByCategory,
  getAllCategories
};