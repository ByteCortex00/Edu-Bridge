/**
 * Adzuna Job Categories Configuration
 * Selected high-priority categories for skills gap analysis
 */
export const ADZUNA_CATEGORIES = {
  IT_JOBS: {
    tag: 'it-jobs',
    label: 'IT Jobs',
    priority: 1,
    description: 'Software development, IT infrastructure, systems administration'
  },
  ENGINEERING_JOBS: {
    tag: 'engineering-jobs',
    label: 'Engineering Jobs',
    priority: 2,
    description: 'Civil, mechanical, electrical, software engineering'
  },
  HEALTHCARE_NURSING: {
    tag: 'healthcare-nursing-jobs',
    label: 'Healthcare & Nursing Jobs',
    priority: 3,
    description: 'Medical professionals, nurses, healthcare administrators'
  },
  ACCOUNTING_FINANCE: {
    tag: 'accounting-finance-jobs',
    label: 'Accounting & Finance Jobs',
    priority: 4,
    description: 'Accountants, financial analysts, auditors, bookkeepers'
  },
  TEACHING_JOBS: {
    tag: 'teaching-jobs',
    label: 'Teaching Jobs',
    priority: 5,
    description: 'Teachers, lecturers, education specialists'
  },
  SCIENTIFIC_QA: {
    tag: 'scientific-qa-jobs',
    label: 'Scientific & QA Jobs',
    priority: 6,
    description: 'Research scientists, lab technicians, quality assurance'
  },
  CREATIVE_DESIGN: {
    tag: 'creative-design-jobs',
    label: 'Creative & Design Jobs',
    priority: 7,
    description: 'Graphic designers, UX/UI designers, content creators'
  },
  SALES_JOBS: {
    tag: 'sales-jobs',
    label: 'Sales Jobs',
    priority: 8,
    description: 'Sales representatives, business development, account managers'
  },
  PR_MARKETING: {
    tag: 'pr-advertising-marketing-jobs',
    label: 'PR, Advertising & Marketing Jobs',
    priority: 9,
    description: 'Marketing managers, PR specialists, digital marketers'
  },
  HR_RECRUITMENT: {
    tag: 'hr-jobs',
    label: 'HR & Recruitment Jobs',
    priority: 10,
    description: 'Human resources, talent acquisition, HR managers'
  },
  LEGAL_JOBS: {
    tag: 'legal-jobs',
    label: 'Legal Jobs',
    priority: 11,
    description: 'Lawyers, paralegals, compliance officers'
  },
  LOGISTICS_JOBS: {
    tag: 'logistics-warehouse-jobs',
    label: 'Logistics & Warehouse Jobs',
    priority: 12,
    description: 'Supply chain, procurement, inventory management'
  },
  CUSTOMER_SERVICE: {
    tag: 'customer-services-jobs',
    label: 'Customer Service Jobs',
    priority: 13,
    description: 'Support agents, client success, help desk'
  }
};

/**
 * Get all Adzuna category tags as array
 */
export const getAdzunaCategoryTags = () => {
  return Object.values(ADZUNA_CATEGORIES).map(cat => cat.tag);
};

/**
 * Get category by tag
 */
export const getAdzunaCategoryByTag = (tag) => {
  return Object.values(ADZUNA_CATEGORIES).find(cat => cat.tag === tag);
};

/**
 * Comprehensive skills database organized by category
 * Enhanced with more industry-specific skills aligned with Adzuna categories
 */
const skillsTaxonomy = {
  // IT JOBS - Programming & Software Development
  programming: [
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift',
    'kotlin', 'go', 'rust', 'typescript', 'sql', 'r', 'scala', 'perl',
    'dart', 'matlab', 'shell scripting', 'bash', 'powershell', 'vba',
    'objective-c', 'groovy', 'elixir', 'clojure', 'haskell', 'assembly',
    'lua', 'fortran', 'cobol', 'f#', 'erlang', 'solidity', 'webassembly'
  ],

  // IT JOBS - Web Development
  webDevelopment: [
    'html', 'css', 'react', 'angular', 'vue', 'vue.js', 'node.js', 'express',
    'django', 'flask', 'asp.net', 'spring', 'laravel', 'wordpress',
    'responsive design', 'rest api', 'graphql', 'websockets', 'next.js',
    'nuxt.js', 'gatsby', 'tailwind css', 'bootstrap', 'sass', 'less',
    'jquery', 'backbone.js', 'ember.js', 'svelte', 'web components',
    'progressive web apps', 'single page applications', 'remix', 'astro',
    'three.js', 'd3.js', 'webpack', 'vite', 'babel', 'ajax', 'json',
    'drupal', 'magento', 'shopify', 'woocommerce', 'joomla', 'webflow'
  ],

  // IT JOBS - Mobile Development
  mobile: [
    'ios development', 'android development', 'react native', 'flutter',
    'xamarin', 'ionic', 'swift ui', 'jetpack compose', 'mobile app development',
    'mobile ui design', 'app store optimization', 'mobile testing',
    'cordova', 'phonegap', 'kotlin multiplatform', 'unity', 'unreal engine',
    'arikit', 'arkit', 'core data', 'realm'
  ],

  // IT JOBS - Database & Data Management
  database: [
    'mongodb', 'postgresql', 'mysql', 'oracle', 'sql server', 'redis',
    'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'mariadb',
    'sqlite', 'neo4j', 'couchdb', 'database design', 'data modeling',
    'database administration', 'query optimization', 'data warehousing',
    'etl', 'data migration', 'backup and recovery', 'snowflake', 'redshift',
    'bigquery', 'hive', 'hbase', 'teradata', 'pl/sql', 't-sql'
  ],

  // IT JOBS & ENGINEERING - Cloud & DevOps
  cloud: [
    'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform',
    'jenkins', 'gitlab ci', 'circleci', 'serverless', 'cloud computing',
    'devops', 'ci/cd', 'ansible', 'chef', 'puppet', 'microservices',
    'cloud architecture', 'cloud security', 'infrastructure as code',
    'containerization', 'orchestration', 'cloud migration', 'cloudformation',
    'aws lambda', 'azure devops', 'gcp', 'heroku', 'digitalocean',
    'openshift', 'helm', 'prometheus', 'grafana', 'elk stack', 'splunk',
    'datadog', 'new relic', 'pagerduty', 'linux', 'unix', 'virtualization',
    'vmware', 'hyper-v', 'nginx', 'apache'
  ],

  // SCIENTIFIC & QA - Data Science & AI
  dataScience: [
    'machine learning', 'deep learning', 'data analysis', 'statistics',
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
    'data visualization', 'tableau', 'power bi', 'data mining',
    'predictive modeling', 'neural networks', 'natural language processing',
    'computer vision', 'big data', 'spark', 'hadoop', 'data engineering',
    'feature engineering', 'model deployment', 'a/b testing', 'hypothesis testing',
    'regression analysis', 'classification', 'clustering', 'time series analysis',
    'jupyter', 'r studio', 'sas', 'spss', 'matplotlib', 'seaborn', 'plotly',
    'airflow', 'dbt', 'mlflow', 'hugging face', 'openai api', 'langchain',
    'generative ai', 'llm', 'reinforcement learning', 'opencv'
  ],

  // ALL CATEGORIES - Soft Skills
  softSkills: [
    'communication', 'teamwork', 'leadership', 'problem solving',
    'critical thinking', 'time management', 'adaptability', 'creativity',
    'collaboration', 'presentation skills', 'analytical skills',
    'attention to detail', 'work ethic', 'interpersonal skills',
    'conflict resolution', 'decision making', 'organizational skills',
    'multitasking', 'emotional intelligence', 'negotiation', 'mentoring',
    'customer service', 'client relations', 'stakeholder engagement',
    'compliance', 'reporting', 'documentation', 'stakeholder management',
    'recruitment', 'training', 'mentoring', 'negotiation', 'empathy',
    'active listening', 'public speaking', 'writing', 'research',
    'strategic thinking', 'innovation', 'flexibility', 'resilience'
  ],

  // IT JOBS - Project Management
  projectManagement: [
    'agile', 'scrum', 'kanban', 'jira', 'project planning',
    'stakeholder management', 'risk management', 'budgeting',
    'waterfall', 'project coordination', 'resource management',
    'sprint planning', 'product management', 'pmp', 'prince2',
    'change management', 'quality management', 'scope management',
    'schedule management', 'cost management', 'asana', 'trello',
    'microsoft project', 'monday.com', 'confluence', 'basecamp',
    'clickup', 'notion', 'roadmap planning', 'backlog grooming',
    'user stories', 'business process improvement'
  ],

  // CREATIVE & DESIGN - Design Skills
  design: [
    'ui/ux design', 'figma', 'adobe xd', 'sketch', 'photoshop', 'illustrator',
    'user research', 'wireframing', 'prototyping', 'user interface design',
    'user experience', 'graphic design', 'web design', 'mobile design',
    'design thinking', 'usability testing', 'indesign', 'after effects',
    'premiere pro', 'typography', 'color theory', 'brand design',
    'logo design', 'visual design', 'interaction design', 'accessibility design',
    'design systems', 'material design', 'responsive design', 'motion design',
    'video editing', 'animation', '3d modeling', 'blender', 'maya', 'cinema 4d',
    'copywriting', 'storyboarding', 'information architecture'
  ],

  // ACCOUNTING & FINANCE - Financial Skills
  finance: [
    'financial analysis', 'accounting', 'bookkeeping', 'financial reporting',
    'budgeting', 'forecasting', 'financial modeling', 'tax preparation',
    'audit', 'quickbooks', 'excel', 'sap', 'oracle financials',
    'accounts payable', 'accounts receivable', 'general ledger',
    'financial statements', 'gaap', 'ifrs', 'cost accounting',
    'management accounting', 'financial planning', 'investment analysis',
    'risk assessment', 'compliance', 'reconciliation', 'payroll',
    'xero', 'sage', 'netsuite', 'fintech', 'cryptocurrency', 'blockchain',
    'mergers and acquisitions', 'valuation', 'corporate finance',
    'internal controls', 'sarbanes-oxley', 'treasury management'
  ],

  // SALES & MARKETING - Business Development
  businessAnalysis: [
    'requirements gathering', 'process modeling', 'data modeling',
    'business intelligence', 'stakeholder analysis', 'feasibility study',
    'business process', 'systems analysis', 'documentation',
    'business strategy', 'market research', 'competitive analysis',
    'swot analysis', 'gap analysis', 'kpi tracking', 'reporting',
    'business case development', 'workflow optimization', 'visio',
    'lucidchart', 'bpmn', 'uml', 'use cases', 'user acceptance testing'
  ],

  // IT JOBS - Testing & Quality Assurance
  testing: [
    'quality assurance', 'unit testing', 'integration testing',
    'automated testing', 'manual testing', 'selenium', 'jest',
    'mocha', 'cypress', 'test driven development', 'bug tracking',
    'regression testing', 'performance testing', 'security testing',
    'load testing', 'stress testing', 'user acceptance testing',
    'test planning', 'test case design', 'defect management',
    'continuous testing', 'postman', 'jmeter', 'appium', 'testng',
    'junit', 'nunit', 'robot framework', 'cucumber', 'playwright',
    'api testing', 'mobile testing', 'browserstack'
  ],

  // IT JOBS - Security & Cybersecurity
  security: [
    'cybersecurity', 'network security', 'information security',
    'penetration testing', 'encryption', 'authentication',
    'authorization', 'security protocols', 'vulnerability assessment',
    'firewall', 'vpn', 'security compliance', 'incident response',
    'threat analysis', 'security auditing', 'ethical hacking',
    'siem', 'intrusion detection', 'identity management',
    'security architecture', 'iso 27001', 'gdpr', 'hipaa',
    'pci dss', 'malware analysis', 'cryptography', 'cissp', 'ceh',
    'comptia security+', 'wireshark', 'metasploit', 'owasp',
    'zero trust', 'cloud security', 'iam', 'risk management'
  ],

  // ENGINEERING - Engineering Skills
  engineering: [
    'cad', 'autocad', 'solidworks', 'matlab', 'simulink',
    'civil engineering', 'mechanical engineering', 'electrical engineering',
    'structural engineering', 'hvac', 'plc programming', 'scada',
    'lean manufacturing', 'six sigma', 'quality control',
    'project engineering', 'technical drawing', 'blueprint reading',
    'prototyping', 'testing and validation', 'process improvement',
    'fea', 'cfd', 'gis', 'revit', '3d modeling', 'robotics',
    'automation', 'hydraulics', 'pneumatics', 'circuit design',
    'pcb design', 'microcontrollers', 'embedded systems', 'iot',
    'manufacturing processes', 'gmp', 'osha', 'ansys', 'catia'
  ],

  // HEALTHCARE - Medical & Healthcare
  healthcare: [
    'patient care', 'clinical skills', 'medical terminology',
    'electronic health records', 'hipaa compliance', 'nursing care',
    'pharmacology', 'anatomy', 'physiology', 'diagnostic procedures',
    'treatment planning', 'medical documentation', 'cpr', 'first aid',
    'infection control', 'medical coding', 'medical billing',
    'epic', 'cerner', 'healthcare administration', 'patient safety',
    'triage', 'vital signs', 'phlebotomy', 'icd-10', 'meditech',
    'patient advocacy', 'clinical research', 'public health',
    'mental health', 'rehabilitation', 'case management'
  ],

  // TEACHING - Education Skills
  education: [
    'curriculum development', 'lesson planning', 'classroom management',
    'educational technology', 'student assessment', 'instructional design',
    'differentiated instruction', 'learning management systems',
    'educational psychology', 'pedagogy', 'e-learning', 'moodle',
    'canvas', 'blackboard', 'student engagement', 'grading',
    'parent communication', 'special education', 'tutoring',
    'educational leadership', 'literacy', 'stem education',
    'early childhood education', 'adult learning', 'workshop facilitation',
    'remote teaching', 'google classroom', 'articulate storyline'
  ],

  // PR & MARKETING - Marketing & Digital Marketing
  marketing: [
    'digital marketing', 'seo', 'sem', 'social media marketing',
    'content marketing', 'email marketing', 'marketing automation',
    'google analytics', 'google ads', 'facebook ads', 'linkedin marketing',
    'marketing strategy', 'brand management', 'copywriting',
    'content marketing', 'campaign management', 'market analysis',
    'crm', 'hubspot', 'salesforce', 'mailchimp', 'hootsuite',
    'conversion optimization', 'influencer marketing', 'affiliate marketing',
    'video marketing', 'growth hacking', 'ppc', 'buffer', 'wordpress',
    'ahrefs', 'semrush', 'moz', 'canva', 'pr', 'public relations',
    'media relations', 'event planning', 'community management'
  ],

  // HR & RECRUITMENT - Human Resources
  humanResources: [
    'recruitment', 'talent acquisition', 'interviewing', 'onboarding',
    'employee relations', 'performance management', 'compensation',
    'benefits administration', 'hr policies', 'labor law',
    'training and development', 'succession planning', 'hrms',
    'applicant tracking system', 'employee engagement',
    'organizational development', 'workforce planning', 'hr analytics',
    'diversity and inclusion', 'conflict resolution', 'payroll processing',
    'workday', 'bamboo hr', 'greenhouse', 'lever', 'linkedin recruiter',
    'employer branding', 'people analytics', 'compliance'
  ],

  // NEW CATEGORY: SALES
  sales: [
    'sales strategy', 'lead generation', 'cold calling', 'prospecting',
    'account management', 'business development', 'sales presentation',
    'closing', 'negotiation', 'crm', 'salesforce', 'hubspot', 'pipedrive',
    'zoho crm', 'b2b sales', 'b2c sales', 'saas sales', 'relationship building',
    'territory management', 'sales forecasting', 'quota achievement',
    'consultative selling', 'upselling', 'cross-selling', 'client retention',
    'objection handling', 'sales funnel management', 'solution selling'
  ],

  // NEW CATEGORY: LEGAL
  legal: [
    'legal research', 'legal writing', 'litigation', 'contract law',
    'corporate law', 'intellectual property', 'compliance', 'regulatory affairs',
    'drafting agreements', 'legal advice', 'court proceedings', 'mediation',
    'arbitration', 'paralegal skills', 'legal documentation', 'westlaw',
    'lexisnexis', 'case management', 'depositions', 'due diligence',
    'employment law', 'real estate law', 'family law', 'criminal law',
    'tort law', 'privacy law', 'gdpr'
  ],

  // NEW CATEGORY: OPERATIONS & LOGISTICS
  operations: [
    'supply chain management', 'logistics', 'inventory management',
    'procurement', 'operations management', 'process improvement',
    'warehouse management', 'shipping and receiving', 'fleet management',
    'vendor management', 'strategic sourcing', 'demand planning',
    'erp systems', 'sap', 'oracle scm', 'six sigma', 'lean management',
    'quality assurance', 'safety compliance', 'resource allocation',
    'facilities management', 'distribution', 'freight forwarding',
    'customs compliance', 'import/export'
  ],

  // NEW CATEGORY: CUSTOMER SUPPORT
  customerSupport: [
    'customer support', 'technical support', 'help desk', 'troubleshooting',
    'ticket management', 'zendesk', 'freshdesk', 'intercom', 'salesforce service cloud',
    'customer satisfaction', 'sla management', 'call center operations',
    'phone etiquette', 'live chat support', 'email support', 'escalation management',
    'knowledge base management', 'customer onboarding', 'client success',
    'crm', 'remote support', 'conflict resolution'
  ],

  // NEW CATEGORY: ADMINISTRATION
  administration: [
    'data entry', 'administrative support', 'office management',
    'scheduling', 'calendar management', 'travel arrangements',
    'filing', 'record keeping', 'transcription', 'minutes taking',
    'reception', 'microsoft office', 'word', 'excel', 'powerpoint',
    'outlook', 'google workspace', 'zoom', 'teams', 'virtual assistance',
    'expense reporting', 'invoice processing', 'event coordination',
    'correspondence', 'typing'
  ]
};

/**
 * Common skill aliases and variations
 * Enhanced with more variations and industry terms
 */
const skillAliases = {
  // Programming
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'c++': 'cpp',
  'c#': 'csharp',
  'golang': 'go',
  'vb.net': 'vba',
  'shell': 'shell scripting',
  'bash script': 'bash',

  // Web frameworks
  'reactjs': 'react',
  'react.js': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'vuejs': 'vue.js',
  'angularjs': 'angular',
  'nextjs': 'next.js',
  'next.js': 'next.js',
  'expressjs': 'express',
  'django framework': 'django',
  'ror': 'ruby on rails',
  'rails': 'ruby on rails',

  // Data & AI
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'dl': 'deep learning',
  'nlp': 'natural language processing',
  'cv': 'computer vision',
  'genai': 'generative ai',
  'llms': 'llm',
  'powerbi': 'power bi',

  // Cloud & DevOps
  'amazon web services': 'aws',
  'gcp': 'google cloud',
  'google cloud platform': 'google cloud',
  'k8s': 'kubernetes',
  'ec2': 'aws',
  'lambda': 'aws lambda',
  's3': 'aws',
  'azure devops': 'azure devops',
  'iac': 'infrastructure as code',

  // Testing
  'qa': 'quality assurance',
  'qc': 'quality control',
  'tdd': 'test driven development',
  'bdd': 'behavior driven development',
  'uata': 'user acceptance testing',

  // Design
  'ui': 'user interface',
  'ux': 'user experience',
  'ui/ux': 'ui/ux design',
  'adobe creative suite': 'adobe creative cloud',

  // Business & Management
  'pm': 'project management',
  'pmp': 'project management professional',
  'ba': 'business analyst',
  'bi': 'business intelligence',
  'crm': 'customer relationship management',
  'erp': 'enterprise resource planning',
  'scrum master': 'scrum',
  'product owner': 'product management',
  'kpi': 'key performance indicators',
  'roi': 'return on investment',

  // Office & Admin
  'ms office': 'microsoft office',
  'ms excel': 'excel',
  'ms word': 'word',
  'ms powerpoint': 'powerpoint',
  'g suite': 'google workspace',

  // Other
  'api': 'rest api',
  'rdbms': 'database',
  'nosql': 'mongodb', // Generic mapping to popular nosql
  'ci/cd': 'continuous integration',
  'cicd': 'ci/cd',
  'devops': 'development operations',
  'fullstack': 'full stack development',
  'full stack': 'full stack development',
  'frontend': 'front end development',
  'front end': 'front end development',
  'backend': 'back end development',
  'back end': 'back end development',
  'seo': 'search engine optimization',
  'sem': 'search engine marketing',
  'hr': 'human resources',
  'pr': 'public relations'
};

/**
 * Map Adzuna categories to skill taxonomy categories
 * Helps in targeted skill extraction based on job category
 */
export const adzunaToTaxonomyMap = {
  'it-jobs': ['programming', 'webDevelopment', 'mobile', 'database', 'cloud',
              'dataScience', 'testing', 'security', 'projectManagement'],
  'engineering-jobs': ['engineering', 'cloud', 'projectManagement', 'softSkills', 'operations'],
  'healthcare-nursing-jobs': ['healthcare', 'softSkills', 'administration'],
  'accounting-finance-jobs': ['finance', 'softSkills', 'businessAnalysis', 'administration'],
  'teaching-jobs': ['education', 'softSkills', 'administration'],
  'scientific-qa-jobs': ['dataScience', 'testing', 'engineering', 'softSkills'],
  'creative-design-jobs': ['design', 'webDevelopment', 'marketing', 'softSkills'],
  'sales-jobs': ['sales', 'businessAnalysis', 'marketing', 'softSkills', 'customerSupport'],
  'pr-advertising-marketing-jobs': ['marketing', 'design', 'softSkills', 'sales'],
  'hr-jobs': ['humanResources', 'softSkills', 'projectManagement', 'administration', 'legal'],
  'legal-jobs': ['legal', 'softSkills', 'administration'],
  'logistics-warehouse-jobs': ['operations', 'softSkills', 'administration'],
  'customer-services-jobs': ['customerSupport', 'softSkills', 'sales', 'administration']
};

/**
 * Get relevant skill categories for an Adzuna job category
 */
export const getRelevantSkillCategories = (adzunaTag) => {
  const categories = adzunaToTaxonomyMap[adzunaTag];
  if (!categories) return Object.keys(skillsTaxonomy);

  return categories;
};

/**
 * Get skills filtered by Adzuna category
 */
export const getSkillsForAdzunaCategory = (adzunaTag) => {
  const categories = getRelevantSkillCategories(adzunaTag);
  return categories.flatMap(cat => skillsTaxonomy[cat] || []);
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
  ADZUNA_CATEGORIES,
  adzunaToTaxonomyMap,
  getAllSkills,
  getSkillCategory,
  normalizeSkill,
  isValidSkill,
  getSkillsByCategory,
  getAllCategories,
  getAdzunaCategoryTags,
  getAdzunaCategoryByTag,
  getRelevantSkillCategories,
  getSkillsForAdzunaCategory
};