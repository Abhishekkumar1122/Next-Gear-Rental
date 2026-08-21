export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  experienceYears: "0-3 Years" | "1-3 Years" | "0-2 Years";
  isTechnical: boolean;
  type: "Full-time" | "Remote" | "Hybrid" | "Contract";
  salaryRange: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  postedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  experienceYears: string;
  portfolioUrl?: string;
  coverNote?: string;
  resumeFileName: string;
  appliedAt: string;
}

export const DEFAULT_JOBS: JobOpening[] = [
  {
    id: "job-1",
    title: "Junior Frontend Developer (Next.js / React)",
    department: "Engineering",
    location: "Remote / Delhi",
    experienceYears: "1-3 Years",
    isTechnical: true,
    type: "Full-time",
    salaryRange: "₹6.5L - ₹10L / year",
    description: "Develop high-performance user interfaces, AI Concierge widgets, and booking flows for Next Gear Rentals using Next.js and TypeScript.",
    requirements: [
      "1 to 3 years hands-on experience in React.js or Next.js",
      "Strong proficiency in JavaScript, TypeScript, and CSS Tailwind/Vanilla",
      "Experience integrating REST APIs & Payment Gateways",
      "Familiarity with Git and responsive web design"
    ],
    responsibilities: [
      "Build fast, responsive web pages and components",
      "Optimize website load times for SEO and mobile users",
      "Collaborate with backend engineers to integrate payment & booking APIs"
    ],
    postedAt: "2026-07-20"
  },
  {
    id: "job-2",
    title: "Fleet Operations Specialist",
    department: "Operations",
    location: "Manali, Himachal Pradesh",
    experienceYears: "0-3 Years",
    isTechnical: false,
    type: "Full-time",
    salaryRange: "₹3.5L - ₹5.5L / year",
    description: "Manage mountain fleet maintenance, bike deliveries (Himalayan/Thar), snow chain fittings, and rider safety briefings at our Manali hub.",
    requirements: [
      "0 to 3 years experience in vehicle operations or hospitality",
      "Valid Two-Wheeler / Four-Wheeler Driving License",
      "Strong communication skills in Hindi and English",
      "Passion for motorcycles and mountain travel"
    ],
    responsibilities: [
      "Inspect vehicle condition before handing over to customers",
      "Provide riding safety briefings and snow chain setup in winter",
      "Maintain vehicle logs and coordinate routine servicing"
    ],
    postedAt: "2026-07-19"
  },
  {
    id: "job-3",
    title: "Customer Support & Booking Executive",
    department: "Customer Experience",
    location: "Delhi NCR / Remote",
    experienceYears: "0-3 Years",
    isTechnical: false,
    type: "Full-time",
    salaryRange: "₹3.0L - ₹4.5L / year",
    description: "Assist customers via WhatsApp, call, and AI concierge with booking inquiries, vehicle selection, document verifications, and refunds.",
    requirements: [
      "0 to 3 years experience in customer service or travel desk",
      "Fluency in spoken & written English and Hindi",
      "Comfortable working with CRM software and chat tools",
      "Patient and customer-centric mindset"
    ],
    responsibilities: [
      "Verify customer driving licenses and Aadhaar/Passports",
      "Resolve rider inquiries and assist with instant booking confirmations",
      "Handle cancellation requests and security deposit processing"
    ],
    postedAt: "2026-07-18"
  },
  {
    id: "job-4",
    title: "Backend Node.js & Database Engineer",
    department: "Engineering",
    location: "Remote / Bangalore",
    experienceYears: "1-3 Years",
    isTechnical: true,
    type: "Full-time",
    salaryRange: "₹8.0L - ₹12L / year",
    description: "Architect secure Prisma PostgreSQL APIs, AI routing logic, and real-time inventory locking engines for our rental platform.",
    requirements: [
      "1 to 3 years experience with Node.js, Express, and PostgreSQL/Prisma",
      "Knowledge of AI API integrations (Google Gemini / OpenAI)",
      "Understanding of JWT authentication and Webhook handlers",
      "Experience writing unit tests and API documentation"
    ],
    responsibilities: [
      "Design database schemas and optimize query performance",
      "Maintain Razorpay payment gateway webhooks and booking locks",
      "Build admin analytics endpoints"
    ],
    postedAt: "2026-07-15"
  },
  {
    id: "job-5",
    title: "City Hub Station Manager",
    department: "Operations",
    location: "Goa (MOPA & Dabolim)",
    experienceYears: "0-3 Years",
    isTechnical: false,
    type: "Full-time",
    salaryRange: "₹4.0L - ₹6.0L / year",
    description: "Lead doorstep vehicle deliveries and airport pick-ups across MOPA and Dabolim airports. Oversee vendor fleet partners in North and South Goa.",
    requirements: [
      "0 to 3 years in hub management, logistics, or hotel travel desks",
      "Good knowledge of Goa routes and tourist hot spots",
      "Ability to handle customer handovers professionally",
      "Valid Driving License"
    ],
    responsibilities: [
      "Supervise vehicle handovers at Goa airports and beach hubs",
      "Coordinate with local fleet partners for vehicle maintenance",
      "Manage customer feedback and on-road breakdown assistance"
    ],
    postedAt: "2026-07-12"
  },
  {
    id: "job-6",
    title: "Digital Marketing & SEO Specialist",
    department: "Marketing",
    location: "Remote / Delhi",
    experienceYears: "1-3 Years",
    isTechnical: true,
    type: "Full-time",
    salaryRange: "₹5.0L - ₹8.0L / year",
    description: "Drive Next Gear's #1 Google ranking strategy for keywords like 'car rental near me' and 'bike rental near me'. Manage blogs, Google Ads, and SEO schema.",
    requirements: [
      "1 to 3 years experience in Technical SEO & Content Marketing",
      "Familiarity with Google Search Console, Analytics, and Ahrefs/Semrush",
      "Basic HTML/Markdown skills for blog publishing",
      "Proven track record of ranking transactional keywords"
    ],
    responsibilities: [
      "Write & publish keyword-rich rental blogs and city guides",
      "Optimize website meta tags, canonicals, and JSON-LD schemas",
      "Run targeted Google Ads for high-intent searches"
    ],
    postedAt: "2026-07-10"
  }
];

// In-memory store for dynamic admin job posts & candidate applications
 
const globalStore = global as any;
if (!globalStore.__nextGearJobs) {
  globalStore.__nextGearJobs = [...DEFAULT_JOBS];
}
if (!globalStore.__nextGearApplications) {
  globalStore.__nextGearApplications = [];
}

export function getJobs(): JobOpening[] {
  return globalStore.__nextGearJobs;
}

export function addJob(newJob: Omit<JobOpening, "id" | "postedAt">): JobOpening {
  const job: JobOpening = {
    ...newJob,
    id: `job-${Date.now()}`,
    postedAt: new Date().toISOString().split("T")[0],
  };
  globalStore.__nextGearJobs.unshift(job);
  return job;
}

export function deleteJob(id: string): boolean {
  const initialLen = globalStore.__nextGearJobs.length;
  globalStore.__nextGearJobs = globalStore.__nextGearJobs.filter((j: JobOpening) => j.id !== id);
  return globalStore.__nextGearJobs.length < initialLen;
}

export function getApplications(): JobApplication[] {
  return globalStore.__nextGearApplications;
}

export function addApplication(appData: Omit<JobApplication, "id" | "appliedAt">): JobApplication {
  const app: JobApplication = {
    ...appData,
    id: `app-${Date.now()}`,
    appliedAt: new Date().toISOString(),
  };
  globalStore.__nextGearApplications.unshift(app);
  return app;
}
