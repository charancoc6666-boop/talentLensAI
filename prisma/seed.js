const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing database records
  await prisma.auditLog.deleteMany({});
  await prisma.backgroundJob.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.applicant.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('🧹 Database cleared.');

  // 2. Create Demo Organization
  const org = await prisma.organization.create({
    data: {
      name: 'TalentLens AI (Demo Org)',
    },
  });
  console.log(`🏢 Created Organization: ${org.name} (${org.id})`);

  // 3. Create Recruiter and Applicant Users
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  const hrUser = await prisma.user.create({
    data: {
      email: 'recruiter@talentlens.ai',
      password: hashedPassword,
      name: 'Sarah Jenkins',
      role: 'HR',
    },
  });

  const adminMember = await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: hrUser.id,
      role: 'ADMIN',
    },
  });

  const reviewerUser = await prisma.user.create({
    data: {
      email: 'reviewer@talentlens.ai',
      password: hashedPassword,
      name: 'Alex Rivera',
      role: 'HR',
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: reviewerUser.id,
      role: 'REVIEWER',
    },
  });

  console.log('👥 Created HR Users and Organization Membership.');

  // 4. Create Jobs
  const jobFullStack = await prisma.job.create({
    data: {
      organizationId: org.id,
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'Full-time',
      salaryRange: '$140,000 - $180,000',
      description: 'We are looking for a Senior Full Stack Developer to lead the engineering of our core SaaS product. You will design scalable APIs, manage relational databases, and build premium frontend user interfaces using modern web frameworks.',
      experience: '5+ years',
      education: "Bachelor's in Computer Science or equivalent",
      certifications: 'AWS Certified Solutions Architect (Preferred)',
      requirements: JSON.stringify([
        { skill: 'React', weight: 'Critical' },
        { skill: 'Node.js', weight: 'Critical' },
        { skill: 'PostgreSQL', weight: 'High' },
        { skill: 'REST APIs', weight: 'High' },
        { skill: 'TypeScript', weight: 'High' },
        { skill: 'Git', weight: 'High' }
      ]),
      preferredSkills: JSON.stringify([
        { skill: 'Docker', weight: 'Medium' },
        { skill: 'AWS', weight: 'Medium' },
        { skill: 'Redis', weight: 'Medium' },
        { skill: 'Kubernetes', weight: 'Low' }
      ]),
      responsibilities: JSON.stringify([
        'Design, build, and maintain efficient, reusable, and reliable Node.js and React code.',
        'Implement robust RESTful APIs with input validation, authentication, and comprehensive test coverage.',
        'Optimize relational database schemas and complex PostgreSQL query performance.',
        'Mentor junior developers and participate in design and code reviews.'
      ]),
      status: 'ACTIVE',
    },
  });

  const jobDataScientist = await prisma.job.create({
    data: {
      organizationId: org.id,
      title: 'Lead Data Scientist',
      department: 'AI & Data Science',
      location: 'New York, NY (Remote)',
      employmentType: 'Full-time',
      salaryRange: '$160,000 - $210,000',
      description: 'Seeking a Lead Data Scientist to spearhead our AI recruitment intelligence team. You will train custom ML models, design NLP parsers for unstructured text, and work with vector databases for semantic candidate searches.',
      experience: '7+ years',
      education: 'Master or PhD in Computer Science, Statistics, or Math',
      certifications: 'Google Professional Machine Learning Engineer (Preferred)',
      requirements: JSON.stringify([
        { skill: 'Python', weight: 'Critical' },
        { skill: 'PyTorch', weight: 'Critical' },
        { skill: 'NLP', weight: 'Critical' },
        { skill: 'SQL', weight: 'High' },
        { skill: 'Machine Learning', weight: 'Critical' }
      ]),
      preferredSkills: JSON.stringify([
        { skill: 'Vector Databases', weight: 'High' },
        { skill: 'Docker', weight: 'Medium' },
        { skill: 'FastAPI', weight: 'Medium' },
        { skill: 'Hugging Face', weight: 'High' }
      ]),
      responsibilities: JSON.stringify([
        'Develop and deploy production-grade NLP models for parsing resumes and extracting technical semantics.',
        'Establish and monitor data pipelines and optimize training jobs using PyTorch/TensorFlow.',
        'Integrate vector search indices (such as Pinecone or pgvector) into production applications.',
        'Lead AI architecture planning and enforce responsible AI practices.'
      ]),
      status: 'ACTIVE',
    },
  });

  const jobDesigner = await prisma.job.create({
    data: {
      organizationId: org.id,
      title: 'Senior UI/UX Designer',
      department: 'Product Design',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'Full-time',
      salaryRange: '$120,000 - $150,000',
      description: 'Looking for a Senior UI/UX Designer to craft premium, interactive web layouts and establish our core Design System. You will work on user research, wireframing, high-fidelity mockups, and coordinate directly with developers.',
      experience: '4+ years',
      education: 'Degree in Interaction Design, Fine Arts, or equivalent experience',
      requirements: JSON.stringify([
        { skill: 'Figma', weight: 'Critical' },
        { skill: 'UI/UX Design', weight: 'Critical' },
        { skill: 'Design Systems', weight: 'Critical' },
        { skill: 'Wireframing', weight: 'High' },
        { skill: 'User Research', weight: 'High' }
      ]),
      preferredSkills: JSON.stringify([
        { skill: 'HTML/CSS', weight: 'Medium' },
        { skill: 'Prototyping', weight: 'High' },
        { skill: 'Framer Motion', weight: 'Low' }
      ]),
      responsibilities: JSON.stringify([
        'Create interactive user flows, wireframes, and pixel-perfect high-fidelity mockups.',
        'Maintain and extend our enterprise Figma design system, ensuring accessibility (WCAG) guidelines.',
        'Conduct usability testing sessions and translate user feedback into layout adjustments.',
        'Collaborate with engineers to ensure design implementation fidelity.'
      ]),
      status: 'ACTIVE',
    },
  });

  console.log('💼 Created 3 Demo Jobs (Full Stack, Data Scientist, UI/UX Designer).');

  // 5. Seed Applicants and Applications
  // We will create 22 applicants with varying degrees of fit for these jobs.
  const applicantsData = [
    {
      name: 'Aarav Kumar',
      email: 'aarav.kumar@gmail.com',
      phone: '+1 (555) 019-2834',
      location: 'San Jose, CA',
      githubUrl: 'https://github.com/aaravkumar',
      portfolioUrl: 'https://aarav.dev',
      applications: [
        {
          jobId: jobFullStack.id,
          status: 'SHORTLISTED',
          jobMatchScore: 94,
          atsScore: 91,
          portfolioScore: 95,
          technicalEvidenceScore: 92,
          confidence: 'HIGH',
          aiSummary: 'Aarav is an exceptional full-stack developer demonstrating extensive hands-on experience in React, Node.js, and PostgreSQL. His portfolio contains complex projects with verified source code evidence, automated tests, and Docker deployment configurations. Main gap is limited AWS production orchestration.',
          skillsAnalysis: JSON.stringify([
            { skill: 'React', status: 'Strong Match', evidence: 'Resume → Work at TechCorp; GitHub → web-app/src/components' },
            { skill: 'Node.js', status: 'Strong Match', evidence: 'Resume → TechCorp API; GitHub → server-api/src/routes' },
            { skill: 'PostgreSQL', status: 'Strong Match', evidence: 'GitHub → server-api/prisma/schema.prisma' },
            { skill: 'TypeScript', status: 'Strong Match', evidence: 'Used in 4 repositories' },
            { skill: 'Docker', status: 'Strong Match', evidence: 'Dockerfile found in server-api' },
            { skill: 'AWS', status: 'Partial Match', evidence: 'Mentioned deployment, no infrastructure code' },
            { skill: 'Kubernetes', status: 'Missing', evidence: 'No evidence found' }
          ]),
          strengths: JSON.stringify([
            'Robust full-stack development capability (React & Express)',
            'Comprehensive testing practices found in GitHub repositories (Jest/Supertest)',
            'Clear evidence of relational database design (PostgreSQL/Prisma)'
          ]),
          gaps: JSON.stringify([
            { skill: 'Kubernetes', importance: 'Low', recommendation: 'Familiarize with basic deployment pods' },
            { skill: 'AWS Architectures', importance: 'Medium', recommendation: 'Learn AWS ECS or EKS deployment structures' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Developed a production-grade REST API', status: 'Supported', details: 'Found Express API routes, input validators, auth middleware, and Jest tests in GitHub' },
            { claim: 'Experienced with PostgreSQL clustering', status: 'Partially Supported', details: 'Prisma schema and basic queries found, but no clustering configuration shown' },
            { claim: 'Expert in Kubernetes orchestration', status: 'Not Sufficiently Supported', details: 'No Kubernetes deployment manifests or charts found in any repositories' }
          ]),
          interviewQuestions: JSON.stringify([
            { category: 'Technical Verification', question: 'You mentioned implementing Redis caching. Explain how you handled cache invalidation and connection pooling.' },
            { category: 'Project Deep-Dive', question: 'In your project "web-app", how did you manage global state and route protection?' },
            { category: 'Missing Evidence', question: 'Walk me through your experience deploying workloads onto cloud providers like AWS.' }
          ]),
          recruiterNotes: 'Excellent candidate, spoke with him. Solid technical background, eager to join. Moving to technical interview.',
        },
        {
          jobId: jobDataScientist.id,
          status: 'REVIEW',
          jobMatchScore: 64,
          atsScore: 60,
          portfolioScore: 68,
          technicalEvidenceScore: 65,
          confidence: 'MEDIUM',
          aiSummary: 'Aarav has strong programming skills, but his focus is primarily on web development rather than data science. He has basic SQL skills, but lacks PyTorch, NLP, and machine learning training experience.',
          skillsAnalysis: JSON.stringify([
            { skill: 'Python', status: 'Partial Match', evidence: 'Used for minor scripts' },
            { skill: 'SQL', status: 'Strong Match', evidence: 'Experienced in PostgreSQL' },
            { skill: 'Machine Learning', status: 'Missing', evidence: 'No ML models in portfolio' }
          ]),
          strengths: JSON.stringify(['Strong coding practices', 'Excellent SQL knowledge']),
          gaps: JSON.stringify([
            { skill: 'PyTorch/NLP', importance: 'Critical', recommendation: 'Build NLP classification models' }
          ]),
          verificationSignals: JSON.stringify([]),
          interviewQuestions: JSON.stringify([]),
          recruiterNotes: 'Secondary choice for data science. Keep in database for engineering roles.',
        }
      ]
    },
    {
      name: 'David Chen',
      email: 'david.chen.ai@outlook.com',
      phone: '+1 (555) 043-9988',
      location: 'New York, NY',
      githubUrl: 'https://github.com/dchen-ml',
      portfolioUrl: 'https://dchen-ml.ai',
      applications: [
        {
          jobId: jobDataScientist.id,
          status: 'SHORTLISTED',
          jobMatchScore: 96,
          atsScore: 94,
          portfolioScore: 97,
          technicalEvidenceScore: 95,
          confidence: 'HIGH',
          aiSummary: 'David is a stellar Lead Data Scientist candidate with a PhD in Computer Science. His GitHub repositories demonstrate deep expertise in NLP, custom Transformer architectures, and vector search indices. The code is clean, documented, and includes validation scripts.',
          skillsAnalysis: JSON.stringify([
            { skill: 'Python', status: 'Strong Match', evidence: 'Primary language across 12 repos' },
            { skill: 'PyTorch', status: 'Strong Match', evidence: 'Found model definitions and custom loss modules' },
            { skill: 'NLP', status: 'Strong Match', evidence: 'Transformer-based parsers in repository' },
            { skill: 'Vector Databases', status: 'Strong Match', evidence: 'Pinecone and pgvector integration scripts' },
            { skill: 'Docker', status: 'Strong Match', evidence: 'Dockerfiles for model serving containers' }
          ]),
          strengths: JSON.stringify([
            'Expert NLP and deep learning pipeline architecture',
            'Strong theoretical knowledge backed by active open-source models',
            'Production containerization of machine learning models'
          ]),
          gaps: JSON.stringify([
            { skill: 'FastAPI UI', importance: 'Low', recommendation: 'Implement web-based demos for ML models' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Trained large-scale NLP parsing model from scratch', status: 'Supported', details: 'GitHub contains model architecture code, tokenization configs, and training script logs' },
            { claim: 'Designed vector search pipelines', status: 'Supported', details: 'Python modules showing cosine similarity queries and Pinecone API connectors verified' }
          ]),
          interviewQuestions: JSON.stringify([
            { category: 'Technical Verification', question: 'How did you handle tokenization and out-of-vocabulary terms in your custom parser?' },
            { category: 'Project Deep-Dive', question: 'Explain your choice of hyperparameters in the training logs of your NLP pipeline.' }
          ]),
          recruiterNotes: 'Exceptional academic and practical record. Strong cultural fit based on email exchange. Interview scheduled.',
        },
        {
          jobId: jobFullStack.id,
          status: 'REJECTED',
          jobMatchScore: 52,
          atsScore: 55,
          portfolioScore: 48,
          technicalEvidenceScore: 50,
          confidence: 'HIGH',
          aiSummary: 'David is highly qualified in AI but has minimal full-stack engineering evidence. He has no React frontend projects, no TypeScript files, and only uses Python for model serving. Not suitable for the Senior Full Stack role.',
          skillsAnalysis: JSON.stringify([
            { skill: 'React', status: 'Missing', evidence: 'No frontend files in repositories' },
            { skill: 'TypeScript', status: 'Missing', evidence: 'Only python and bash files' },
            { skill: 'Node.js', status: 'Missing', evidence: 'No JS/TS backend experience' }
          ]),
          strengths: JSON.stringify(['Strong Python backend skills']),
          gaps: JSON.stringify([
            { skill: 'React/UI Frameworks', importance: 'Critical', recommendation: 'Build interactive frontends' }
          ]),
          verificationSignals: JSON.stringify([]),
          interviewQuestions: JSON.stringify([]),
          recruiterNotes: 'Rejected for Full Stack due to zero React/Node experience. Profile saved in AI department.',
        }
      ]
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus.j.design@designstudio.io',
      phone: '+1 (555) 077-1243',
      location: 'Brooklyn, NY',
      githubUrl: 'https://github.com/marcusj-design',
      portfolioUrl: 'https://marcusj.design',
      applications: [
        {
          jobId: jobDesigner.id,
          status: 'SHORTLISTED',
          jobMatchScore: 92,
          atsScore: 90,
          portfolioScore: 95,
          technicalEvidenceScore: 88,
          confidence: 'HIGH',
          aiSummary: 'Marcus is a highly creative designer with a massive interactive portfolio. His design system files show careful alignment with WCAG accessibility guidelines, deep hierarchy, and pixel-perfect prototypes. Minimal coding skills, but excels in UI/UX and Figma.',
          skillsAnalysis: JSON.stringify([
            { skill: 'Figma', status: 'Strong Match', evidence: 'Portfolio contains 8 complex Figma prototypes' },
            { skill: 'UI/UX Design', status: 'Strong Match', evidence: 'Detailed case studies with user testing maps' },
            { skill: 'Design Systems', status: 'Strong Match', evidence: 'Figma tokens, component libraries' },
            { skill: 'HTML/CSS', status: 'Partial Match', evidence: 'Basic portfolio website HTML' }
          ]),
          strengths: JSON.stringify([
            'Stunning visual designs with cohesive grid systems',
            'Strong user research and data-backed design revisions',
            'High fidelity interactive prototyping'
          ]),
          gaps: JSON.stringify([
            { skill: 'Framer Motion / Code Integration', importance: 'Low', recommendation: 'Learn basic CSS transitions' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Led creation of enterprise design system', status: 'Supported', details: 'Figma design tokens, typography scales, and responsive components documented extensively' }
          ]),
          interviewQuestions: JSON.stringify([
            { category: 'Technical Verification', question: 'How do you coordinate design hands-offs with frontend engineers? What tools or conventions do you use?' }
          ]),
          recruiterNotes: 'Beautiful portfolio. Checked out his Figma files; they are extremely organized. Ready for next round.',
        },
        {
          jobId: jobFullStack.id,
          status: 'REJECTED',
          jobMatchScore: 41,
          atsScore: 45,
          portfolioScore: 35,
          technicalEvidenceScore: 30,
          confidence: 'HIGH',
          aiSummary: 'Marcus is purely a visual designer. He has no experience in Node.js backend development, relational databases, REST APIs, or system architecture. Not matching role requirements.',
          skillsAnalysis: JSON.stringify([]),
          strengths: JSON.stringify([]),
          gaps: JSON.stringify([{ skill: 'All backend skills', importance: 'Critical', recommendation: 'Learn programming' }]),
          verificationSignals: JSON.stringify([]),
          interviewQuestions: JSON.stringify([]),
          recruiterNotes: 'Rejected for Full Stack. Profile forwarded to Product Design.',
        }
      ]
    },
    {
      name: 'Emily Watson',
      email: 'emily.watson@devmail.net',
      phone: '+1 (555) 021-9876',
      location: 'Seattle, WA',
      githubUrl: 'https://github.com/emilyw-codes',
      portfolioUrl: 'https://emilycodes.dev',
      applications: [
        {
          jobId: jobFullStack.id,
          status: 'REVIEW',
          jobMatchScore: 82,
          atsScore: 84,
          portfolioScore: 80,
          technicalEvidenceScore: 78,
          confidence: 'MEDIUM',
          aiSummary: 'Emily is a talented frontend developer with 4 years of experience. She has strong React and TypeScript skills, and excellent styling portfolios. Her backend experience is weaker; she mentions Express but her repositories only show simple, mock server-side routers.',
          skillsAnalysis: JSON.stringify([
            { skill: 'React', status: 'Strong Match', evidence: 'Resume → Work at DevStudio; GitHub → portfolio projects' },
            { skill: 'TypeScript', status: 'Strong Match', evidence: 'TypeScript config and types in 3 repositories' },
            { skill: 'Node.js', status: 'Partial Match', evidence: 'Express mentioned in resume, but GitHub only shows static landing pages' },
            { skill: 'PostgreSQL', status: 'Missing', evidence: 'No database queries or files found' }
          ]),
          strengths: JSON.stringify([
            'Clean, modular frontend components',
            'Strong CSS and responsive design implementation',
            'Good documentation in codebases'
          ]),
          gaps: JSON.stringify([
            { skill: 'PostgreSQL & Database Design', importance: 'High', recommendation: 'Learn database schema modeling' },
            { skill: 'Node.js API Architecture', importance: 'High', recommendation: 'Build full Express API with validations' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Developed scalable Node.js servers', status: 'Not Sufficiently Supported', details: 'No server-side projects found in GitHub. Only small serverless functions for email routing.' }
          ]),
          interviewQuestions: JSON.stringify([
            { category: 'Technical Verification', question: 'How would you connect a React frontend to a relational database using Node.js? Detail the architecture.' }
          ]),
          recruiterNotes: 'Great frontend skills, but might be a bit junior for a Senior Full Stack developer who needs to architect the backend. Keep under review.',
        }
      ]
    },
    {
      name: 'Yuki Tanaka',
      email: 'y.tanaka@tokyotech.jp',
      phone: '+81 (90) 1234-5678',
      location: 'Tokyo, Japan',
      githubUrl: 'https://github.com/yuki-tanaka',
      portfolioUrl: 'https://yuki.tokyo',
      applications: [
        {
          jobId: jobFullStack.id,
          status: 'REVIEW',
          jobMatchScore: 78,
          atsScore: 80,
          portfolioScore: 72,
          technicalEvidenceScore: 82,
          confidence: 'HIGH',
          aiSummary: 'Yuki is a strong backend-focused developer. He has solid Node.js and SQL skills, with verified PostgreSQL architecture. However, he has very little React frontend evidence, with only boilerplate files in his repositories. Best suited for backend roles.',
          skillsAnalysis: JSON.stringify([
            { skill: 'Node.js', status: 'Strong Match', evidence: 'Verified backend microservices in GitHub' },
            { skill: 'PostgreSQL', status: 'Strong Match', evidence: 'Complex schemas and SQL queries found' },
            { skill: 'React', status: 'Partial Match', evidence: 'Only standard create-react-app boilerplates' }
          ]),
          strengths: JSON.stringify([
            'Strong understanding of API optimization',
            'Excellent database migrations and design'
          ]),
          gaps: JSON.stringify([
            { skill: 'React / Frontend Architecture', importance: 'High', recommendation: 'Build custom interactive UIs' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Expert in React single page apps', status: 'Partially Supported', details: 'Has boilerplate projects, but no custom React logic or state management found.' }
          ]),
          interviewQuestions: JSON.stringify([
            { category: 'Project Deep-Dive', question: 'Walk through your database indexing strategy in the backend-api repository.' }
          ]),
          recruiterNotes: 'Very strong backend, but we need someone who can also code the frontend dashboard. I will see if he is open to focusing on backend engineering.',
        }
      ]
    },
    {
      name: 'Sofia Rodriguez',
      email: 'sofia.rodriguez@techie.es',
      phone: '+34 (600) 12-34-56',
      location: 'Madrid, Spain',
      githubUrl: 'https://github.com/sofia-codes',
      portfolioUrl: 'https://sofiacodes.dev',
      applications: [
        {
          jobId: jobFullStack.id,
          status: 'REVIEW',
          jobMatchScore: 74,
          atsScore: 72,
          portfolioScore: 75,
          technicalEvidenceScore: 70,
          confidence: 'MEDIUM',
          aiSummary: 'Sofia is a mid-level full stack developer. She has solid foundational skills in React and Node.js, but lacks the architectural experience required for a Senior position. Her projects are smaller in scale (e.g. todo list, personal blogs).',
          skillsAnalysis: JSON.stringify([
            { skill: 'React', status: 'Strong Match', evidence: 'Demonstrated in 3 small projects' },
            { skill: 'Node.js', status: 'Strong Match', evidence: 'Express APIs with basic endpoints' },
            { skill: 'PostgreSQL', status: 'Partial Match', evidence: 'Simple database connections, no migrations' }
          ]),
          strengths: JSON.stringify(['Solid understanding of JS basics', 'Enthusiastic developer']),
          gaps: JSON.stringify([
            { skill: 'System Architecture', importance: 'High', recommendation: 'Study database normalization and scaling' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Architected scalable software', status: 'Not Sufficiently Supported', details: 'All projects are simple single-instance apps without production load consideration.' }
          ]),
          interviewQuestions: JSON.stringify([]),
          recruiterNotes: 'A bit junior for a Senior role, but excellent candidate. Let\'s see if she would fit in a mid-level role.',
        }
      ]
    },
    {
      name: 'Fatima Al-Sayed',
      email: 'fatima.alsayed@dubai-it.ae',
      phone: '+971 (50) 987-6543',
      location: 'Dubai, UAE',
      githubUrl: 'https://github.com/fatima-dev',
      portfolioUrl: 'https://fatimacodes.ae',
      applications: [
        {
          jobId: jobFullStack.id,
          status: 'SHORTLISTED',
          jobMatchScore: 91,
          atsScore: 89,
          portfolioScore: 92,
          technicalEvidenceScore: 90,
          confidence: 'HIGH',
          aiSummary: 'Fatima is a very strong full stack engineer. Her GitHub code shows impressive NestJS backend design with robust TypeScript typing, combined with Next.js frontends. Excellent API designs and automated test suites.',
          skillsAnalysis: JSON.stringify([
            { skill: 'React', status: 'Strong Match', evidence: 'Next.js projects with Tailwind CSS' },
            { skill: 'Node.js', status: 'Strong Match', evidence: 'NestJS api backend repositories' },
            { skill: 'PostgreSQL', status: 'Strong Match', evidence: 'Detailed database models with migrations' },
            { skill: 'TypeScript', status: 'Strong Match', evidence: 'Strict mode enabled in tsconfig' }
          ]),
          strengths: JSON.stringify([
            'Clean Architecture and NestJS experience',
            'Strong TypeScript integration across frontend and backend',
            'Excellent unit and integration test coverage'
          ]),
          gaps: JSON.stringify([
            { skill: 'Dockerization', importance: 'Medium', recommendation: 'Implement multi-stage Docker builds' }
          ]),
          verificationSignals: JSON.stringify([
            { claim: 'Built high-throughput backend APIs', status: 'Supported', details: 'Found NestJS servers with caching, rate-limiting, and validation schemas.' }
          ]),
          interviewQuestions: JSON.stringify([
            { category: 'Technical Verification', question: 'Why did you choose NestJS over Express in your main project? What are the architectural trade-offs?' }
          ]),
          recruiterNotes: 'Very impressive code quality on GitHub. High proficiency in TypeScript and backend architectures. Scheduled for hiring manager call.',
        }
      ]
    }
  ];

  // We need to add at least 15 more candidates to reach 20+ total applicants
  for (let i = 1; i <= 15; i++) {
    const statusChoices = ['NEW', 'AI_SCREENED', 'REVIEW', 'REJECTED'];
    const status = statusChoices[i % statusChoices.length];
    
    // Generating variations in scores based on index
    const jobMatchScore = Math.floor(55 + (i * 2.3) % 38);
    const atsScore = Math.round(jobMatchScore * 0.96);
    const portfolioScore = Math.round(jobMatchScore * 1.02);
    const technicalEvidenceScore = Math.round(jobMatchScore * 0.95);
    
    applicantsData.push({
      name: `Applicant ${i} (Demo)`,
      email: `candidate.demo.${i}@ztech.io`,
      phone: `+1 (555) 081-30${i < 10 ? '0' + i : i}`,
      location: i % 2 === 0 ? 'Chicago, IL' : 'Austin, TX',
      githubUrl: `https://github.com/candidate-demo-${i}`,
      portfolioUrl: `https://candidate-demo-${i}.dev`,
      applications: [
        {
          jobId: jobFullStack.id,
          status: status,
          jobMatchScore: jobMatchScore,
          atsScore: atsScore,
          portfolioScore: portfolioScore,
          technicalEvidenceScore: technicalEvidenceScore,
          confidence: jobMatchScore > 80 ? 'HIGH' : (jobMatchScore > 65 ? 'MEDIUM' : 'LOW'),
          aiSummary: `Demo applicant ${i} seeded to fill the database. Candidates scores are dynamically calculated. Fits job description as a ${jobMatchScore > 80 ? 'strong' : (jobMatchScore > 65 ? 'moderate' : 'weak')} match.`,
          skillsAnalysis: JSON.stringify([
            { skill: 'React', status: jobMatchScore > 75 ? 'Strong Match' : 'Partial Match', evidence: 'Resume / GitHub' },
            { skill: 'Node.js', status: jobMatchScore > 80 ? 'Strong Match' : (jobMatchScore > 60 ? 'Partial Match' : 'Missing'), evidence: 'Resume / Work History' },
            { skill: 'PostgreSQL', status: jobMatchScore > 70 ? 'Strong Match' : 'Missing', evidence: 'Project list' }
          ]),
          strengths: JSON.stringify([
            `Experienced in web development technologies`,
            `Demonstrated portfolio items on personal website`
          ]),
          gaps: JSON.stringify([
            { skill: 'Cloud Deployments', importance: 'Low', recommendation: 'Learn AWS/Docker configurations' }
          ]),
          verificationSignals: JSON.stringify([]),
          interviewQuestions: JSON.stringify([]),
          recruiterNotes: 'Demo candidate notes. Auto-generated during seeding.',
        }
      ]
    });
  }

  // Insert into DB
  for (const item of applicantsData) {
    // Check if applicant already exists by email
    let applicant = await prisma.applicant.findUnique({
      where: { email: item.email }
    });

    if (!applicant) {
      applicant = await prisma.applicant.create({
        data: {
          name: item.name,
          email: item.email,
          phone: item.phone,
          location: item.location,
          githubUrl: item.githubUrl,
          portfolioUrl: item.portfolioUrl,
        }
      });
    }

    for (const app of item.applications) {
      await prisma.application.create({
        data: {
          jobId: app.jobId,
          applicantId: applicant.id,
          status: app.status,
          jobMatchScore: app.jobMatchScore,
          atsScore: app.atsScore,
          portfolioScore: app.portfolioScore,
          technicalEvidenceScore: app.technicalEvidenceScore,
          confidence: app.confidence,
          aiSummary: app.aiSummary,
          skillsAnalysis: app.skillsAnalysis,
          strengths: app.strengths,
          gaps: app.gaps,
          verificationSignals: app.verificationSignals,
          interviewQuestions: app.interviewQuestions,
          recruiterNotes: app.recruiterNotes,
        }
      });

      // Log audits for applications
      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: hrUser.id,
          action: 'APPLICANT_UPLOADED',
          details: `Uploaded resume for applicant ${applicant.name}`,
        }
      });

      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: hrUser.id,
          action: 'ANALYSIS_COMPLETED',
          details: `Completed AI analysis for ${applicant.name} matching job '${jobFullStack.title}'`,
        }
      });
    }
  }

  // Create some background job items to show history
  await prisma.backgroundJob.create({
    data: {
      jobId: jobFullStack.id,
      status: 'COMPLETED',
      totalItems: 22,
      completedItems: 22,
      failedItems: 0,
    }
  });

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
