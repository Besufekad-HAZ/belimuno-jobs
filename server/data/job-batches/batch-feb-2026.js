/**
 * Job Batch: February 2026
 * 
 * This file contains all job postings from Belimuno HR Outsourcing announcements
 * posted in February 2026. Includes 67 jobs across 7 batches:
 * - Batch A: General Construction / Heavy Machinery (17 jobs)
 * - Batch B: Site BOPe Engineer (1 job)
 * - Batch C: Highway/Bridge Engineers (4 jobs)
 * - Batch D: Immediate Recruitment (6 jobs)
 * - Batch E: Urgent Welenchity Deployment (14 jobs)
 * - Batch F: Various Positions / Airport/Service (18 jobs)
 * - Batch G: Belimuno Internal Positions (7 jobs)
 * 
 * Usage: node post-bulk-jobs.js data/job-batches/batch-feb-2026.js
 */

// ============================================================
// BATCH A – General Construction / Heavy Machinery (Post 1)
// Contact: 0988287218
// ============================================================
const batchA_GeneralRequirements = `
General Requirements:
• Relevant license or certification for the position
• Proven experience in a similar role
• Ability to work safely and responsibly
• Strong teamwork and discipline

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218
Apply early – limited positions available!
`.trim();

const batchA = [
  {
    title: 'Excavator Operator',
    description: `We are seeking 5 qualified and experienced Excavator Operators for immediate deployment.

Positions Available: 5

Requirements:
• Valid excavator operating license/certification
• Proven experience operating excavators in construction projects
• Knowledge of safety protocols and equipment maintenance
• Ability to work in various terrain and weather conditions

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['Excavator Operation', 'Heavy Machinery', 'Safety Protocols', 'Equipment Maintenance'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'excavator'],
  },
  {
    title: 'JCB Operator',
    description: `We are seeking 3 qualified and experienced JCB Operators for immediate deployment.

Positions Available: 3

Requirements:
• Valid JCB/backhoe loader operating license
• Experience in earthmoving and construction operations
• Knowledge of safety protocols and equipment maintenance

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['JCB Operation', 'Heavy Machinery', 'Earthmoving', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'jcb'],
  },
  {
    title: 'Drill Machine Operator',
    description: `We are seeking 4 qualified and experienced Drill Machine Operators.

Positions Available: 4

Requirements:
• Valid drill machine operating license/certification
• Experience operating various types of drilling equipment
• Knowledge of drilling techniques, safety protocols, and equipment maintenance

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['Drill Machine Operation', 'Heavy Machinery', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'drilling'],
  },
  {
    title: 'Trailer Driver',
    description: `We are seeking 2 qualified and experienced Trailer Drivers.

Positions Available: 2

Requirements:
• Valid heavy vehicle driving license for trailers
• Proven experience driving trailers/heavy transport vehicles
• Knowledge of road safety regulations and vehicle maintenance

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 20000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Trailer Driving', 'Heavy Vehicle License', 'Road Safety', 'Vehicle Maintenance'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'driver', 'trailer', 'transport'],
  },
  {
    title: 'Wheel Loader Operator',
    description: `We are seeking 3 qualified and experienced Wheel Loader Operators.

Positions Available: 3

Requirements:
• Valid wheel loader operating license/certification
• Experience operating wheel loaders in construction/mining environments
• Knowledge of safety protocols and equipment maintenance

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 23000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['Wheel Loader Operation', 'Heavy Machinery', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'wheel-loader'],
  },
  {
    title: 'HMV Driver',
    description: `We are seeking 17 qualified and experienced HMV (Heavy Motor Vehicle) Drivers.

Positions Available: 17

Requirements:
• Valid HMV driving license
• Proven experience driving heavy motor vehicles
• Knowledge of road safety regulations and vehicle maintenance
• Clean driving record

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 18000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['HMV Driving', 'Heavy Vehicle License', 'Road Safety', 'Vehicle Maintenance'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'driver', 'hmv', 'heavy-vehicle'],
  },
  {
    title: 'Paver Operator',
    description: `We are seeking 1 qualified and experienced Paver Operator.

Positions Available: 1

Requirements:
• Valid paver machine operating license/certification
• Experience in road paving and asphalt operations
• Knowledge of paving techniques, safety protocols, and equipment maintenance

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Paver Operation', 'Road Construction', 'Asphalt Paving', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'paver', 'road-construction'],
  },
  {
    title: 'Sensor Operator',
    description: `We are seeking 2 qualified and experienced Sensor Operators for construction machinery.

Positions Available: 2

Requirements:
• Valid certification for sensor/leveling equipment operation
• Experience operating sensor-equipped construction machinery
• Knowledge of grading and leveling techniques

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 24000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Sensor Operation', 'Construction Machinery', 'Grading', 'Leveling'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'sensor'],
  },
  {
    title: 'Tandem Roller Operator',
    description: `We are seeking 1 qualified and experienced Tandem Roller Operator.

Positions Available: 1

Requirements:
• Valid roller operating license/certification
• Experience in road compaction and asphalt rolling
• Knowledge of compaction techniques and safety protocols

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Tandem Roller Operation', 'Road Compaction', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'roller', 'road-construction'],
  },
  {
    title: 'PTR Operator',
    description: `We are seeking 1 qualified and experienced PTR (Pneumatic Tired Roller) Operator.

Positions Available: 1

Requirements:
• Valid PTR operating license/certification
• Experience in road compaction using pneumatic tired rollers
• Knowledge of compaction techniques and safety protocols

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['PTR Operation', 'Road Compaction', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'ptr', 'road-construction'],
  },
  {
    title: 'Hydra Operator',
    description: `We are seeking 2 qualified and experienced Hydra Crane Operators.

Positions Available: 2

Requirements:
• Valid hydra crane operating license/certification
• Experience operating hydra cranes for lifting and material handling
• Knowledge of load calculations, rigging, and safety protocols

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Hydra Crane Operation', 'Lifting Equipment', 'Rigging', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'hydra-crane'],
  },
  {
    title: 'TM Driver',
    description: `We are seeking 2 qualified and experienced TM (Transit Mixer) Drivers.

Positions Available: 2

Requirements:
• Valid heavy vehicle driving license
• Experience driving transit mixer/concrete mixer trucks
• Knowledge of concrete handling procedures and road safety

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 20000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Transit Mixer Driving', 'Heavy Vehicle License', 'Concrete Handling', 'Road Safety'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'driver', 'transit-mixer', 'concrete'],
  },
  {
    title: 'Forklift Operator',
    description: `We are seeking 1 qualified and experienced Forklift Operator.

Positions Available: 1

Requirements:
• Valid forklift operating license/certification
• Experience in warehouse/construction site material handling
• Knowledge of load management and safety protocols

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 18000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Forklift Operation', 'Material Handling', 'Warehouse Operations', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'operator', 'forklift', 'warehouse'],
  },
  {
    title: 'Engineer / Supervisor',
    description: `We are seeking 2 qualified and experienced Engineers / Supervisors for construction projects.

Positions Available: 2

Requirements:
• Relevant engineering degree or equivalent qualification
• Proven supervisory experience in construction projects
• Strong leadership and project management skills
• Knowledge of construction methods, safety standards, and quality control

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 40000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['Construction Engineering', 'Project Supervision', 'Quality Control', 'Safety Management', 'Leadership'],
    experienceLevel: 'expert',
    tags: ['construction', 'engineering', 'supervisor', 'management'],
  },
  {
    title: 'Mechanic',
    description: `We are seeking 2 qualified and experienced Mechanics for heavy machinery maintenance.

Positions Available: 2

Requirements:
• Relevant mechanical certification or diploma
• Experience maintaining and repairing heavy construction machinery
• Knowledge of diesel engines, hydraulic systems, and electrical systems
• Ability to diagnose and troubleshoot mechanical issues

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['Heavy Machinery Repair', 'Diesel Engines', 'Hydraulic Systems', 'Troubleshooting'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'mechanic', 'maintenance', 'heavy-machinery'],
  },
  {
    title: 'Welder',
    description: `We are seeking 3 qualified and experienced Welders.

Positions Available: 3

Requirements:
• Relevant welding certification
• Experience in MIG, TIG, Arc, and Oxy-Acetylene welding
• Ability to read and interpret welding blueprints
• Knowledge of welding safety protocols

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 20000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'high',
    requiredSkills: ['MIG Welding', 'TIG Welding', 'Arc Welding', 'Blueprint Reading', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'welder', 'fabrication'],
  },
  {
    title: 'Service Van / Browser Driver',
    description: `We are seeking 2 qualified and experienced Service Van / Browser Drivers.

Positions Available: 2

Requirements:
• Valid driving license for service vehicles
• Experience driving service/utility vehicles at construction sites
• Knowledge of vehicle maintenance and road safety regulations

${batchA_GeneralRequirements}`,
    category: 'Other',
    budget: 16000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'medium',
    requiredSkills: ['Service Vehicle Driving', 'Vehicle Maintenance', 'Road Safety'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'driver', 'service-vehicle'],
  },
];


// ============================================================
// BATCH B – Site BOPe Engineer (Post 2)
// Contact: 0988287218
// ============================================================
const batchB = [
  {
    title: 'Site BOPe Engineer - Site Manager of VHS',
    description: `We are seeking a qualified Site BOPe Engineer to serve as Site Manager of VHS.

Positions Available: 1

Main Responsibilities:
• Report to Site Manager
• Collect and prepare handbooks such as drawings, standards, tools and apparatus
• Create erection and commissioning plan according to the Contract and Customer requirements
• Coordination with site team and relevant parties, control and supervise site activities
• Control process schedule, including two shifts or overtime working if necessary
• Attend customer's regular meetings
• Communicate with VHS Project Management Members; submit necessary reports/memos/letters
• Implementation of field claim management relevant to erection/test/commissioning
• Coordination with site supervisors to clearly define data and parameters to be recorded
• Review protocol after test or erection, check data meets drawing and contract requirements
• Supervision and execution of Field NCR during construction period
• Definition and arrangement of HSE measures per company and customer requirements
• Create and maintain Daily and Monthly reports
• Maintain drawings, erection manual, commissioning manual – ensure latest version usage
• Compliance with PRC regulations and company core ideologies

Requirements:
• Bachelor's degree or above in Electrical Engineering, Automation, Electronic Engineering or related fields
• 3+ years working experience in electrical product systems
• High sense of responsibility and accountability
• Strong coordination and communication skills
• English proficiency (writing, speaking, listening)
• Proactive, willing to learn and cooperate as a team player
• Reporting skills

Personality & Character:
• Open communication
• Availability for 6 months on GERD site
• Full compliance with company regulations

Education & Age:
• College degree or above
• Age: 45 or below

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218
Apply early – limited positions available!`,
    category: 'Other',
    budget: 70000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Engineering',
    location: 'GERD Site, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Electrical Engineering', 'Site Management', 'Project Coordination', 'Commissioning', 'HSE Management', 'English Proficiency', 'Report Writing'],
    experienceLevel: 'expert',
    tags: ['engineering', 'site-management', 'electrical', 'gerd', 'hydropower'],
  },
];


// ============================================================
// BATCH C – Highway / Bridge Engineers (Post 3)
// 10+ years experience required
// ============================================================
const batchC_Reqs = `
Requirements:
• Minimum 10+ years of relevant experience
• Relevant engineering degree
• Immediate availability for site deployment

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218
Prompt deployment to site is needed – apply immediately!
`.trim();

const batchC = [
  {
    title: 'Highway Engineer',
    description: `We are seeking 1 highly experienced Highway Engineer for immediate site deployment.

Positions Available: 1

${batchC_Reqs}`,
    category: 'Other',
    budget: 80000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Highway Engineering', 'Road Design', 'Construction Management', 'Project Planning'],
    experienceLevel: 'expert',
    tags: ['engineering', 'highway', 'road-construction', 'senior'],
  },
  {
    title: 'Highway Engineer – Asphalt Paving Supervision',
    description: `We are seeking 1 highly experienced Highway Engineer specializing in Asphalt Paving Supervision for immediate site deployment.

Positions Available: 1

${batchC_Reqs}`,
    category: 'Other',
    budget: 80000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Highway Engineering', 'Asphalt Paving', 'Construction Supervision', 'Quality Control'],
    experienceLevel: 'expert',
    tags: ['engineering', 'highway', 'asphalt', 'paving', 'supervision', 'senior'],
  },
  {
    title: 'Bridge Engineer',
    description: `We are seeking 1 highly experienced Bridge Engineer for immediate site deployment.

Positions Available: 1

${batchC_Reqs}`,
    category: 'Other',
    budget: 85000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Bridge Engineering', 'Structural Design', 'Construction Management', 'Project Planning'],
    experienceLevel: 'expert',
    tags: ['engineering', 'bridge', 'structural', 'senior'],
  },
  {
    title: 'Survey Engineer',
    description: `We are seeking 1 highly experienced Survey Engineer for immediate site deployment.

Positions Available: 1

${batchC_Reqs}`,
    category: 'Other',
    budget: 70000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Land Surveying', 'GPS/GNSS', 'Total Station', 'AutoCAD', 'GIS'],
    experienceLevel: 'expert',
    tags: ['engineering', 'surveying', 'senior'],
  },
];


// ============================================================
// BATCH D – Immediate Recruitment (Post 4)
// Belimuno HR Outsourcing Solutions – Immediate deployment
// ============================================================
const batchD_Footer = `
How to Apply:
Interested and qualified candidates are encouraged to send their CVs for immediate consideration.
Prompt deployment is required to ensure smooth work activities.

Send your CV to: 0988287218
Contact us: 0988287218

Belimuno HR Outsourcing Solutions – Your trusted partner in workforce excellence.
`.trim();

const batchD = [
  {
    title: 'Excavator Operator – Immediate Deployment',
    description: `IMMEDIATE RECRUITMENT – Belimuno HR Outsourcing Solutions is urgently recruiting Excavator Operators for immediate deployment to site.

Positions Available: 4

Requirements:
• Valid excavator operating license/certification
• Proven experience operating excavators
• Must be available for immediate deployment

${batchD_Footer}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Excavator Operation', 'Heavy Machinery', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'excavator', 'urgent'],
  },
  {
    title: 'JCB Operator – Immediate Deployment',
    description: `IMMEDIATE RECRUITMENT – Belimuno HR Outsourcing Solutions is urgently recruiting JCB Operators for immediate deployment to site.

Positions Available: 2

Requirements:
• Valid JCB/backhoe loader operating license
• Experience in earthmoving and construction operations
• Must be available for immediate deployment

${batchD_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['JCB Operation', 'Heavy Machinery', 'Earthmoving'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'jcb', 'urgent'],
  },
  {
    title: 'Mechanic – Immediate Deployment',
    description: `IMMEDIATE RECRUITMENT – Belimuno HR Outsourcing Solutions is urgently recruiting a Mechanic for immediate deployment to site.

Positions Available: 1

Requirements:
• Relevant mechanical certification
• Experience maintaining heavy construction machinery
• Must be available for immediate deployment

${batchD_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Heavy Machinery Repair', 'Diesel Engines', 'Hydraulic Systems'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'mechanic', 'maintenance', 'urgent'],
  },
  {
    title: 'Tandem Roller Operator – Immediate Deployment',
    description: `IMMEDIATE RECRUITMENT – Belimuno HR Outsourcing Solutions is urgently recruiting a Tandem Roller Operator for immediate deployment to site.

Positions Available: 1

Requirements:
• Valid roller operating license/certification
• Experience in road compaction
• Must be available for immediate deployment

${batchD_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Tandem Roller Operation', 'Road Compaction', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'roller', 'urgent'],
  },
  {
    title: 'Welder – Immediate Deployment',
    description: `IMMEDIATE RECRUITMENT – Belimuno HR Outsourcing Solutions is urgently recruiting Welders for immediate deployment to site.

Positions Available: 2

Requirements:
• Relevant welding certification
• Experience in various welding techniques
• Must be available for immediate deployment

${batchD_Footer}`,
    category: 'Other',
    budget: 20000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['MIG Welding', 'TIG Welding', 'Arc Welding'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'welder', 'fabrication', 'urgent'],
  },
  {
    title: 'HMV Driver – Immediate Deployment',
    description: `IMMEDIATE RECRUITMENT – Belimuno HR Outsourcing Solutions is urgently recruiting HMV Drivers for immediate deployment to site.

Positions Available: 10

Requirements:
• Valid HMV driving license
• Proven experience driving heavy motor vehicles
• Must be available for immediate deployment

${batchD_Footer}`,
    category: 'Other',
    budget: 18000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Ethiopia',
    priority: 'urgent',
    requiredSkills: ['HMV Driving', 'Heavy Vehicle License', 'Road Safety'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'driver', 'hmv', 'heavy-vehicle', 'urgent'],
  },
];


// ============================================================
// BATCH E – Urgent Recruitment at Welenchity (Post 5)
// Immediate deployment to Welenchity
// ============================================================
const batchE_Footer = `
Requirements:
• Relevant job experience
• Ability to work under pressure
• Good communication & teamwork
• Must be available for immediate deployment

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218
Location: Welenchity
`.trim();

const batchE = [
  {
    title: 'Excavator Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Excavator Operators for immediate deployment to Welenchity project site.

Positions Available: 4

${batchE_Footer}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Excavator Operation', 'Heavy Machinery', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'excavator', 'welenchity', 'urgent'],
  },
  {
    title: 'JCB Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting JCB Operators for immediate deployment to Welenchity project site.

Positions Available: 3

${batchE_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['JCB Operation', 'Heavy Machinery', 'Earthmoving'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'jcb', 'welenchity', 'urgent'],
  },
  {
    title: 'Mechanic – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Mechanics for immediate deployment to Welenchity project site.

Positions Available: 3

${batchE_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Heavy Machinery Repair', 'Diesel Engines', 'Hydraulic Systems', 'Troubleshooting'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'mechanic', 'maintenance', 'welenchity', 'urgent'],
  },
  {
    title: 'Engineer / Supervisor – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Engineers / Supervisors for immediate deployment to Welenchity project site.

Positions Available: 2

${batchE_Footer}`,
    category: 'Other',
    budget: 40000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Construction Engineering', 'Project Supervision', 'Quality Control', 'Leadership'],
    experienceLevel: 'expert',
    tags: ['construction', 'engineering', 'supervisor', 'welenchity', 'urgent'],
  },
  {
    title: 'Welder – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Welders for immediate deployment to Welenchity project site.

Positions Available: 2

${batchE_Footer}`,
    category: 'Other',
    budget: 20000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['MIG Welding', 'TIG Welding', 'Arc Welding', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'welder', 'fabrication', 'welenchity', 'urgent'],
  },
  {
    title: 'HMV Driver – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting HMV Drivers for immediate deployment to Welenchity project site.

Positions Available: 30

${batchE_Footer}`,
    category: 'Other',
    budget: 18000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['HMV Driving', 'Heavy Vehicle License', 'Road Safety'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'driver', 'hmv', 'heavy-vehicle', 'welenchity', 'urgent'],
  },
  {
    title: 'Paver Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting a Paver Operator for immediate deployment to Welenchity project site.

Positions Available: 1

${batchE_Footer}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Paver Operation', 'Road Construction', 'Asphalt Paving'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'paver', 'welenchity', 'urgent'],
  },
  {
    title: 'Sensor Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Sensor Operators for immediate deployment to Welenchity project site.

Positions Available: 2

${batchE_Footer}`,
    category: 'Other',
    budget: 24000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Sensor Operation', 'Construction Machinery', 'Grading'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'sensor', 'welenchity', 'urgent'],
  },
  {
    title: 'Tandem Roller Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting a Tandem Roller Operator for immediate deployment to Welenchity project site.

Positions Available: 1

${batchE_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Tandem Roller Operation', 'Road Compaction', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'roller', 'welenchity', 'urgent'],
  },
  {
    title: 'PTR Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting a PTR (Pneumatic Tired Roller) Operator for immediate deployment to Welenchity project site.

Positions Available: 1

${batchE_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['PTR Operation', 'Road Compaction', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'ptr', 'welenchity', 'urgent'],
  },
  {
    title: 'Hydra Operator – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Hydra Crane Operators for immediate deployment to Welenchity project site.

Positions Available: 3

${batchE_Footer}`,
    category: 'Other',
    budget: 25000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Hydra Crane Operation', 'Lifting Equipment', 'Rigging'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'heavy-machinery', 'operator', 'hydra-crane', 'welenchity', 'urgent'],
  },
  {
    title: 'Electrician – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting Electricians for immediate deployment to Welenchity project site.

Positions Available: 2

${batchE_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Electrical Installation', 'Wiring', 'Troubleshooting', 'Safety Protocols'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'electrician', 'welenchity', 'urgent'],
  },
  {
    title: 'DG Mechanic – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting a DG (Diesel Generator) Mechanic for immediate deployment to Welenchity project site.

Positions Available: 1

${batchE_Footer}`,
    category: 'Other',
    budget: 23000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Diesel Generator Repair', 'Engine Maintenance', 'Troubleshooting'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'mechanic', 'diesel-generator', 'welenchity', 'urgent'],
  },
  {
    title: 'Auto Electrician – Welenchity',
    description: `URGENT RECRUITMENT – We are urgently recruiting an Auto Electrician for immediate deployment to Welenchity project site.

Positions Available: 1

${batchE_Footer}`,
    category: 'Other',
    budget: 22000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Welenchity, Ethiopia',
    priority: 'urgent',
    requiredSkills: ['Auto Electrical Systems', 'Vehicle Wiring', 'Diagnostics', 'Troubleshooting'],
    experienceLevel: 'intermediate',
    tags: ['construction', 'auto-electrician', 'welenchity', 'urgent'],
  },
];


// ============================================================
// BATCH F – Various Positions (Post 7 – Airport/Service)
// ============================================================
const batchF = [
  {
    title: 'Baggage & Cargo Handler',
    description: `An organization invites qualified, competent, and physically fit candidates for the position of Baggage & Cargo Handler.

Positions Available: Multiple

Requirements:
• Educational Qualification: Minimum 10th Grade completion
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Interested applicants who meet the stated requirements are encouraged to apply.
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 10000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Aviation / Airport Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Physical Fitness', 'Cargo Handling', 'Teamwork'],
    experienceLevel: 'entry',
    tags: ['airport', 'cargo', 'handler', 'baggage'],
  },
  {
    title: 'Cleaner (Fleet Service Attendant)',
    description: `An organization invites qualified, competent, and physically fit candidates for the position of Cleaner / Fleet Service Attendant.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion (new/old curriculum)
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 8000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Aviation / Airport Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Cleaning', 'Fleet Service', 'Physical Fitness'],
    experienceLevel: 'entry',
    tags: ['airport', 'cleaner', 'fleet-service'],
  },
  {
    title: 'Catering Helper',
    description: `An organization invites qualified candidates for the position of Catering Helper.

Positions Available: Multiple

Requirements:
• Level I Certificate in Food & Beverage / Hotel Operation or related field
  OR 10th/12th Grade completion with 8 months certified training
• COC Certificate: Mandatory
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 10000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Aviation / Catering Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Food & Beverage', 'Catering', 'COC Certificate', 'Hotel Operations'],
    experienceLevel: 'entry',
    tags: ['catering', 'food-service', 'airport'],
  },
  {
    title: 'Gardener',
    description: `An organization invites qualified, competent, and physically fit candidates for the position of Gardener.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 8000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Facility Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'low',
    requiredSkills: ['Gardening', 'Landscaping', 'Physical Fitness'],
    experienceLevel: 'entry',
    tags: ['gardener', 'landscaping', 'facility'],
  },
  {
    title: 'Laborer',
    description: `An organization invites qualified, competent, and physically fit candidates for the position of Laborer.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 8000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'General Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Physical Fitness', 'Teamwork', 'Hard Work'],
    experienceLevel: 'entry',
    tags: ['laborer', 'general-worker'],
  },
  {
    title: 'Equipment & Beverage Packer / Tray Setup Worker',
    description: `An organization invites qualified candidates for the position of Laborer – Equipment & Beverage Packer / Tray Setup Worker.

Positions Available: Multiple

Requirements:
• Level I Certificate in Food & Beverage / Hotel Operation or related field
  OR 10th/12th Grade completion with 8 months training
• COC Certificate: Mandatory
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 10000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Aviation / Catering Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Food & Beverage', 'Packing', 'COC Certificate', 'Tray Setup'],
    experienceLevel: 'entry',
    tags: ['catering', 'packer', 'tray-setup', 'airport'],
  },
  {
    title: 'Laborer – GTV, Car Wash & Greasing Service',
    description: `An organization invites qualified candidates for the position of Laborer – GTV, Car Wash & Greasing Service.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Experience: Minimum 2 years in vehicle washing & greasing
• Driving License: Minimum 3rd Grade
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 10000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Automotive Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Vehicle Washing', 'Greasing', '3rd Grade Driving License', 'Vehicle Maintenance'],
    experienceLevel: 'entry',
    tags: ['car-wash', 'greasing', 'vehicle-service', 'gtv'],
  },
  {
    title: 'Waiter / Waitress',
    description: `An organization invites qualified candidates for the position of Waiter / Waitress.

Positions Available: Multiple

Requirements:
• Level I Certificate or COC equivalent in Food & Beverage Service / Hotel Operation
  OR 10th/12th Grade completion with 8 months training
• Age Limit: 18–30 years
• Good command of English, French, or other international languages is an advantage
• Interview examination mandatory
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 10000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Hospitality',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Food & Beverage Service', 'Customer Service', 'English', 'COC Certificate'],
    experienceLevel: 'entry',
    tags: ['waiter', 'waitress', 'hospitality', 'food-service'],
  },
  {
    title: 'Habitat Management / Bird Chaser',
    description: `An organization invites qualified candidates for the position of Habitat Management / Bird Chaser.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Age Limit: 18–30 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 8000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Aviation / Airport Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'low',
    requiredSkills: ['Wildlife Management', 'Physical Fitness', 'Outdoor Work'],
    experienceLevel: 'entry',
    tags: ['bird-chaser', 'habitat-management', 'airport', 'wildlife'],
  },
  {
    title: 'Security Guard',
    description: `An organization invites qualified candidates for the position of Security Guard.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Training: Military training mandatory
• Additional Advantage: Licensed weapon with ammunition
• Age Limit: 20–35 years

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 12000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Security Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Security', 'Military Training', 'Surveillance', 'Physical Fitness'],
    experienceLevel: 'entry',
    tags: ['security', 'guard', 'military-training'],
  },
  {
    title: 'Tailor',
    description: `An organization invites qualified candidates for the position of Tailor.

Positions Available: Multiple

Requirements:
• Diploma / Level III Certificate with 1 year relevant experience
  OR 10th/12th Grade completion from garment/tailoring school with 4 years experience
• Age Limit: 18–30 years
• Interview & practical examination mandatory
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 12000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Textile / Garment',
    location: 'Addis Ababa, Ethiopia',
    priority: 'low',
    requiredSkills: ['Tailoring', 'Sewing', 'Garment Making', 'Pattern Reading'],
    experienceLevel: 'intermediate',
    tags: ['tailor', 'garment', 'sewing'],
  },
  {
    title: 'Driver',
    description: `An organization invites qualified candidates for the position of Driver.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• License: Minimum 4th Grade or Public II
• Experience: Minimum 2 years driving experience
• Age Limit: 25–35 years
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 14000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Transport',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['4th Grade Driving License', 'Vehicle Operation', 'Road Safety'],
    experienceLevel: 'intermediate',
    tags: ['driver', 'transport', 'vehicle'],
  },
  {
    title: 'Tyre Repairman',
    description: `An organization invites qualified candidates for the position of Tyre Repairman.

Positions Available: Multiple

Requirements:
• Level I Certificate in Powertrain/Under-class Service with 1 year experience
  OR 10th/12th Grade completion with 3 years experience
• Driving License: Minimum 3rd Grade
• Age Limit: 18–30 years
• Practical exam mandatory
• Must be physically fit

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 10000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Automotive Services',
    location: 'Addis Ababa, Ethiopia',
    priority: 'low',
    requiredSkills: ['Tyre Repair', 'Vehicle Maintenance', '3rd Grade Driving License'],
    experienceLevel: 'entry',
    tags: ['tyre-repair', 'automotive', 'vehicle-maintenance'],
  },
  {
    title: 'Mason',
    description: `An organization invites qualified candidates for the position of Mason.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Experience: Minimum 2 years in masonry & plastering
• Age Limit: 18–30 years
• Practical exam mandatory

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 12000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Masonry', 'Plastering', 'Bricklaying', 'Construction'],
    experienceLevel: 'intermediate',
    tags: ['mason', 'construction', 'plastering'],
  },
  {
    title: 'Carpenter',
    description: `An organization invites qualified candidates for the position of Carpenter.

Positions Available: Multiple

Requirements:
• Diploma / Level III Certificate in Wood Carpentry or related field
• Experience: Minimum 1 year
• Age Limit: 18–30 years
• Practical exam mandatory

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 12000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Construction',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Carpentry', 'Woodworking', 'Furniture Making', 'Construction'],
    experienceLevel: 'intermediate',
    tags: ['carpenter', 'woodworking', 'construction'],
  },
  {
    title: 'Welder (Aviation/Service)',
    description: `An organization invites qualified candidates for the position of Welder.

Positions Available: Multiple

Requirements:
• Experience: Minimum 2 years in MIG, TIG, Arc, and Oxy-Acetylene welding
• Preference: Experience in 8-inch stainless steel high-pressure pipe welding

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 15000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Service Industry',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['MIG Welding', 'TIG Welding', 'Arc Welding', 'Oxy-Acetylene', 'Pipe Welding'],
    experienceLevel: 'intermediate',
    tags: ['welder', 'pipe-welding', 'stainless-steel'],
  },
  {
    title: 'Painter / A/C Painter',
    description: `An organization invites qualified candidates for the position of Painter / A/C Painter.

Positions Available: Multiple

Requirements:
• Educational Qualification: 10th or 12th Grade completion
• Experience: Minimum 2 years relevant work experience
• Age Limit: 18–30 years
• Practical exam mandatory

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 12000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Service Industry',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Painting', 'Surface Preparation', 'A/C Painting', 'Spray Painting'],
    experienceLevel: 'intermediate',
    tags: ['painter', 'ac-painter', 'surface-finishing'],
  },
  {
    title: 'Cook',
    description: `An organization invites qualified candidates for the position of Cook.

Positions Available: Multiple

Requirements:
• Level III Certificate in Food Preparation / Kitchen Operation
  OR Level II Certificate with catering training or 1-year experience
• COC Certificate: Mandatory
• Age Limit: 18–35 years
• Interview & practical exam mandatory

How to Apply:
Send your CV to: 0988287218
Contact us: 0988287218`,
    category: 'Other',
    budget: 12000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Hospitality / Catering',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Cooking', 'Food Preparation', 'Kitchen Management', 'COC Certificate'],
    experienceLevel: 'intermediate',
    tags: ['cook', 'food-preparation', 'catering', 'kitchen'],
  },
];


// ============================================================
// BATCH G – Belimuno Internal Positions (Posts 8/9)
// ============================================================
const batchG = [
  {
    title: 'Chief Business Support Directorate',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Chief Business Support Directorate.

Positions Available: 1

Qualification: BA/MBA Degree
Experience: Minimum 12 years

Responsibilities:
• Develop and implement business and marketing strategies
• Drive organizational growth and operational efficiency
• Oversee overall business performance and strategic initiatives

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218

Join BELIMUNO and be part of a professional team committed to excellence and growth.`,
    category: 'Consulting',
    budget: 100000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'high',
    requiredSkills: ['Business Strategy', 'Marketing', 'Organizational Growth', 'Operational Efficiency', 'Leadership'],
    experienceLevel: 'expert',
    tags: ['management', 'business', 'director', 'senior-leadership', 'belimuno-internal'],
  },
  {
    title: 'Senior HR Officer',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Senior HR Officer.

Positions Available: 1

Qualification: BA Degree
Experience: 3–5 years

Responsibilities:
• Manage end-to-end recruitment and talent acquisition
• Oversee workforce planning and HR operations
• Ensure compliance with federal, state, and local labor laws and regulations, particularly in an employment agency context

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218`,
    category: 'Other',
    budget: 35000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'high',
    requiredSkills: ['Recruitment', 'Talent Acquisition', 'Workforce Planning', 'Labor Law Compliance', 'HR Operations'],
    experienceLevel: 'intermediate',
    tags: ['hr', 'recruitment', 'talent-acquisition', 'belimuno-internal'],
  },
  {
    title: 'Senior Accountant',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Senior Accountant.

Positions Available: 1

Qualification: BA Degree
Experience: 3–5 years

Responsibilities:
• Prepare accurate and timely financial statements and reports
• Perform complex financial analyses and reconciliations
• Maintain proficiency in accounting software and tools

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218`,
    category: 'Other',
    budget: 35000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'high',
    requiredSkills: ['Financial Reporting', 'Financial Analysis', 'Reconciliation', 'Accounting Software', 'Bookkeeping'],
    experienceLevel: 'intermediate',
    tags: ['accounting', 'finance', 'belimuno-internal'],
  },
  {
    title: 'Junior HR Officer',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Junior HR Officer.

Positions Available: 1

Qualification: Diploma
Experience: 2+ years

Responsibilities:
• Work independently and collaboratively with minimal supervision
• Handle sensitive and confidential information ethically
• Address workplace issues and assist in conflict resolution

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218`,
    category: 'Other',
    budget: 18000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['HR Operations', 'Confidentiality', 'Conflict Resolution', 'Teamwork'],
    experienceLevel: 'entry',
    tags: ['hr', 'junior', 'belimuno-internal'],
  },
  {
    title: 'Head of Administration',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Head of Administration.

Positions Available: 1

Qualification: BA/MBA Degree
Experience: Minimum 12 years

Responsibilities:
• Manage and improve overall office operations
• Oversee facilities and budgets
• Develop and implement administrative policies
• Supervise administrative staff and ensure regulatory compliance

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218`,
    category: 'Other',
    budget: 80000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'high',
    requiredSkills: ['Office Operations', 'Facility Management', 'Budget Management', 'Policy Development', 'Staff Supervision'],
    experienceLevel: 'expert',
    tags: ['administration', 'management', 'senior-leadership', 'belimuno-internal'],
  },
  {
    title: 'Administrative Assistant',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Administrative Assistant.

Positions Available: 1

Qualification: Diploma
Experience: 2+ years

Responsibilities:
• Handle records, information management, and communications
• Support assigned administrative sections
• Assist with day-to-day operational needs across departments

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218`,
    category: 'Other',
    budget: 15000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'medium',
    requiredSkills: ['Records Management', 'Communication', 'Administrative Support', 'Organization'],
    experienceLevel: 'entry',
    tags: ['admin', 'assistant', 'office', 'belimuno-internal'],
  },
  {
    title: 'Marketing Officer',
    description: `BELIMUNO HR Outsourcing Solutions is seeking a qualified professional for the position of Marketing Officer.

Positions Available: 1

Qualification: BA Degree
Experience: 4–6 years

Responsibilities:
• Develop and execute marketing strategies to build brand awareness
• Conduct market research and manage marketing campaigns
• Create content, analyze performance data, and collaborate with internal teams

How to Apply:
Interested candidates are encouraged to apply by submitting their CV and relevant documents.
Contact us: 0988287218`,
    category: 'Marketing',
    budget: 30000,
    company: 'Belimuno HR Outsourcing Solutions',
    industry: 'Human Resources',
    location: 'Addis Ababa, Ethiopia',
    priority: 'high',
    requiredSkills: ['Marketing Strategy', 'Market Research', 'Content Creation', 'Campaign Management', 'Brand Awareness'],
    experienceLevel: 'intermediate',
    tags: ['marketing', 'content', 'branding', 'belimuno-internal'],
  },
];


// ============================================================
// ALL JOBS COMBINED
// ============================================================
const allJobs = [
  ...batchA,
  ...batchB,
  ...batchC,
  ...batchD,
  ...batchE,
  ...batchF,
  ...batchG,
];

// Export the jobs array
module.exports = allJobs;
