// seeders/institutionSeeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Institution from '../models/institutionModel.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Sample institutions data for 5 countries
 */
const institutions = [
  // UNITED KINGDOM (GB) - 10 institutions
  {
    name: "University of Oxford",
    type: "university",
    location: { country: "United Kingdom", region: "England", city: "Oxford" },
    contactEmail: "admissions@ox.ac.uk",
    description: "One of the world's leading universities with a strong focus on research and academic excellence."
  },
  {
    name: "Imperial College London",
    type: "university",
    location: { country: "United Kingdom", region: "England", city: "London" },
    contactEmail: "admissions@imperial.ac.uk",
    description: "Specialist institution focusing on science, engineering, medicine and business."
  },
  {
    name: "Manchester Metropolitan University",
    type: "university",
    location: { country: "United Kingdom", region: "England", city: "Manchester" },
    contactEmail: "enquiries@mmu.ac.uk",
    description: "Modern university with strong industry connections and practical learning approach."
  },
  {
    name: "Edinburgh College",
    type: "college",
    location: { country: "United Kingdom", region: "Scotland", city: "Edinburgh" },
    contactEmail: "info@edinburghcollege.ac.uk",
    description: "Scotland's largest college offering vocational and academic programs."
  },
  {
    name: "City of Bristol College",
    type: "college",
    location: { country: "United Kingdom", region: "England", city: "Bristol" },
    contactEmail: "enquiries@cityofbristol.ac.uk",
    description: "Further education college specializing in technical and vocational training."
  },
  {
    name: "University of Cambridge",
    type: "university",
    location: { country: "United Kingdom", region: "England", city: "Cambridge" },
    contactEmail: "admissions@cam.ac.uk",
    description: "Historic university known for scientific research and academic innovation."
  },
  {
    name: "Birmingham City University",
    type: "university",
    location: { country: "United Kingdom", region: "England", city: "Birmingham" },
    contactEmail: "admissions@bcu.ac.uk",
    description: "Modern university with strong links to creative industries and technology."
  },
  {
    name: "Glasgow Technical College",
    type: "technical",
    location: { country: "United Kingdom", region: "Scotland", city: "Glasgow" },
    contactEmail: "info@glasgowtech.ac.uk",
    description: "Technical college specializing in engineering and construction trades."
  },
  {
    name: "Leeds College of Technology",
    type: "technical",
    location: { country: "United Kingdom", region: "England", city: "Leeds" },
    contactEmail: "admissions@leedstech.ac.uk",
    description: "Provider of technical education and apprenticeships in engineering."
  },
  {
    name: "University of Warwick",
    type: "university",
    location: { country: "United Kingdom", region: "England", city: "Coventry" },
    contactEmail: "admissions@warwick.ac.uk",
    description: "Research university with strong business and computer science programs."
  },

  // UNITED STATES (US) - 10 institutions
  {
    name: "Massachusetts Institute of Technology",
    type: "university",
    location: { country: "United States", region: "Massachusetts", city: "Cambridge" },
    contactEmail: "admissions@mit.edu",
    description: "World-leading university in science, technology, and engineering research."
  },
  {
    name: "Stanford University",
    type: "university",
    location: { country: "United States", region: "California", city: "Stanford" },
    contactEmail: "admission@stanford.edu",
    description: "Premier research university in Silicon Valley with strong tech industry ties."
  },
  {
    name: "Community College of Denver",
    type: "college",
    location: { country: "United States", region: "Colorado", city: "Denver" },
    contactEmail: "admissions@ccd.edu",
    description: "Community college offering affordable pathways to four-year degrees."
  },
  {
    name: "Austin Community College",
    type: "college",
    location: { country: "United States", region: "Texas", city: "Austin" },
    contactEmail: "info@austincc.edu",
    description: "Leading community college with strong technology and healthcare programs."
  },
  {
    name: "Georgia Institute of Technology",
    type: "technical",
    location: { country: "United States", region: "Georgia", city: "Atlanta" },
    contactEmail: "admission@gatech.edu",
    description: "Top-ranked technical university specializing in engineering and computing."
  },
  {
    name: "University of California Berkeley",
    type: "university",
    location: { country: "United States", region: "California", city: "Berkeley" },
    contactEmail: "admissions@berkeley.edu",
    description: "Public research university with excellence in STEM and social sciences."
  },
  {
    name: "Miami Dade College",
    type: "college",
    location: { country: "United States", region: "Florida", city: "Miami" },
    contactEmail: "admissions@mdc.edu",
    description: "Largest college in US serving diverse student population."
  },
  {
    name: "Carnegie Mellon University",
    type: "university",
    location: { country: "United States", region: "Pennsylvania", city: "Pittsburgh" },
    contactEmail: "admission@cmu.edu",
    description: "Leading university in computer science, robotics, and engineering."
  },
  {
    name: "Seattle Central College",
    type: "college",
    location: { country: "United States", region: "Washington", city: "Seattle" },
    contactEmail: "admissions@seattlecentral.edu",
    description: "Urban community college with strong transfer programs to universities."
  },
  {
    name: "New York Technical Institute",
    type: "technical",
    location: { country: "United States", region: "New York", city: "New York" },
    contactEmail: "info@nytech.edu",
    description: "Technical institute focusing on IT, cybersecurity, and digital skills."
  },

  // AUSTRALIA (AU) - 10 institutions
  {
    name: "University of Melbourne",
    type: "university",
    location: { country: "Australia", region: "Victoria", city: "Melbourne" },
    contactEmail: "admissions@unimelb.edu.au",
    description: "Australia's leading university with global reputation for research."
  },
  {
    name: "University of Sydney",
    type: "university",
    location: { country: "Australia", region: "New South Wales", city: "Sydney" },
    contactEmail: "admissions@sydney.edu.au",
    description: "Oldest university in Australia with comprehensive programs."
  },
  {
    name: "TAFE Queensland",
    type: "technical",
    location: { country: "Australia", region: "Queensland", city: "Brisbane" },
    contactEmail: "info@tafeqld.edu.au",
    description: "Largest training provider in Queensland offering vocational education."
  },
  {
    name: "Australian National University",
    type: "university",
    location: { country: "Australia", region: "ACT", city: "Canberra" },
    contactEmail: "admissions@anu.edu.au",
    description: "National research university with focus on policy and science."
  },
  {
    name: "RMIT University",
    type: "university",
    location: { country: "Australia", region: "Victoria", city: "Melbourne" },
    contactEmail: "study@rmit.edu.au",
    description: "Technology-focused university with strong industry partnerships."
  },
  {
    name: "Perth College of Business",
    type: "college",
    location: { country: "Australia", region: "Western Australia", city: "Perth" },
    contactEmail: "admissions@perthcollege.edu.au",
    description: "Business college offering practical training in management and IT."
  },
  {
    name: "University of Queensland",
    type: "university",
    location: { country: "Australia", region: "Queensland", city: "Brisbane" },
    contactEmail: "admissions@uq.edu.au",
    description: "Research-intensive university with strong science programs."
  },
  {
    name: "Adelaide Technical College",
    type: "technical",
    location: { country: "Australia", region: "South Australia", city: "Adelaide" },
    contactEmail: "info@adelaidetech.edu.au",
    description: "Technical college specializing in trades and engineering."
  },
  {
    name: "Monash University",
    type: "university",
    location: { country: "Australia", region: "Victoria", city: "Melbourne" },
    contactEmail: "future@monash.edu",
    description: "Global university with campuses worldwide and strong research output."
  },
  {
    name: "Sydney Technical Institute",
    type: "technical",
    location: { country: "Australia", region: "New South Wales", city: "Sydney" },
    contactEmail: "enrol@sydneytech.edu.au",
    description: "Institute focused on technical skills and industry certifications."
  },

  // POLAND (PL) - 10 institutions
  {
    name: "University of Warsaw",
    type: "university",
    location: { country: "Poland", region: "Masovian", city: "Warsaw" },
    contactEmail: "admission@uw.edu.pl",
    description: "Leading Polish university with comprehensive academic programs."
  },
  {
    name: "Warsaw University of Technology",
    type: "technical",
    location: { country: "Poland", region: "Masovian", city: "Warsaw" },
    contactEmail: "admissions@pw.edu.pl",
    description: "Top technical university in Poland specializing in engineering."
  },
  {
    name: "Jagiellonian University",
    type: "university",
    location: { country: "Poland", region: "Lesser Poland", city: "Krakow" },
    contactEmail: "admission@uj.edu.pl",
    description: "Oldest university in Poland with strong research tradition."
  },
  {
    name: "Poznan College of Technology",
    type: "technical",
    location: { country: "Poland", region: "Greater Poland", city: "Poznan" },
    contactEmail: "info@poznantech.edu.pl",
    description: "Technical college with focus on IT and automation."
  },
  {
    name: "Wroclaw University of Science",
    type: "university",
    location: { country: "Poland", region: "Lower Silesian", city: "Wroclaw" },
    contactEmail: "admissions@pwr.edu.pl",
    description: "Technical university with strong international partnerships."
  },
  {
    name: "Gdansk Technical University",
    type: "technical",
    location: { country: "Poland", region: "Pomeranian", city: "Gdansk" },
    contactEmail: "admission@pg.edu.pl",
    description: "Coastal technical university with maritime and engineering programs."
  },
  {
    name: "AGH University of Science and Technology",
    type: "technical",
    location: { country: "Poland", region: "Lesser Poland", city: "Krakow" },
    contactEmail: "admission@agh.edu.pl",
    description: "Leading technical university in mining, metallurgy, and IT."
  },
  {
    name: "Lodz University of Technology",
    type: "technical",
    location: { country: "Poland", region: "Lodz", city: "Lodz" },
    contactEmail: "info@p.lodz.pl",
    description: "Technical university with strong textile engineering heritage."
  },
  {
    name: "Silesian University of Technology",
    type: "technical",
    location: { country: "Poland", region: "Silesian", city: "Gliwice" },
    contactEmail: "admission@polsl.pl",
    description: "Industrial region university focused on engineering and automation."
  },
  {
    name: "Warsaw Business College",
    type: "college",
    location: { country: "Poland", region: "Masovian", city: "Warsaw" },
    contactEmail: "admissions@wbc.edu.pl",
    description: "Business college with programs in management and economics."
  },

  // KENYA (KE) - 10 institutions
  {
    name: "University of Nairobi",
    type: "university",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "admissions@uonbi.ac.ke",
    description: "Kenya's premier university with comprehensive academic offerings."
  },
  {
    name: "Jomo Kenyatta University of Agriculture",
    type: "university",
    location: { country: "Kenya", region: "Kiambu", city: "Juja" },
    contactEmail: "info@jkuat.ac.ke",
    description: "Leading institution in agriculture, engineering, and technology."
  },
  {
    name: "Strathmore University",
    type: "university",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "admissions@strathmore.edu",
    description: "Private university known for business and IT programs."
  },
  {
    name: "Technical University of Kenya",
    type: "technical",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "info@tukenya.ac.ke",
    description: "Technical university offering engineering and applied sciences."
  },
  {
    name: "Kenyatta University",
    type: "university",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "admissions@ku.ac.ke",
    description: "Large public university with diverse program offerings."
  },
  {
    name: "Mombasa Technical Training Institute",
    type: "technical",
    location: { country: "Kenya", region: "Mombasa", city: "Mombasa" },
    contactEmail: "info@mtti.ac.ke",
    description: "Coastal technical institute with maritime and hospitality programs."
  },
  {
    name: "Nairobi Technical Training Institute",
    type: "technical",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "admissions@ntti.ac.ke",
    description: "Government technical institute offering practical skills training."
  },
  {
    name: "Kenya College of Accountancy",
    type: "college",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "info@kca.ac.ke",
    description: "Specialized college for accounting and business studies."
  },
  {
    name: "Eldoret Polytechnic",
    type: "technical",
    location: { country: "Kenya", region: "Uasin Gishu", city: "Eldoret" },
    contactEmail: "info@eldoretpoly.ac.ke",
    description: "Polytechnic offering technical and vocational training."
  },
  {
    name: "United States International University",
    type: "university",
    location: { country: "Kenya", region: "Nairobi", city: "Nairobi" },
    contactEmail: "admissions@usiu.ac.ke",
    description: "Private university with American-style education system."
  }
];

/**
 * Seed institutions into database
 */
const seedInstitutions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing institutions (optional - comment out if you want to keep existing)
    const existingCount = await Institution.countDocuments();
    console.log(`📊 Current institutions in database: ${existingCount}`);
    
    console.log('🗑️  Clearing existing institutions...');
    await Institution.deleteMany({});
    console.log('✅ Cleared\n');

    // Insert new institutions
    console.log('📝 Inserting 50 sample institutions...\n');
    const result = await Institution.insertMany(institutions);

    console.log('✅ SUCCESS! Institutions seeded\n');
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Total institutions: ${result.length}`);
    
    // Count by country
    const byCountry = {};
    result.forEach(inst => {
      const country = inst.location.country;
      byCountry[country] = (byCountry[country] || 0) + 1;
    });
    
    console.log('\nBy Country:');
    Object.entries(byCountry).forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

    // Count by type
    const byType = {};
    result.forEach(inst => {
      byType[inst.type] = (byType[inst.type] || 0) + 1;
    });
    
    console.log('\nBy Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('='.repeat(50));
    console.log('\n✅ Seeding completed successfully!');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding institutions:', error);
    process.exit(1);
  }
};

// Run the seeder
seedInstitutions();