'use client';

import { PageShell } from '@/components/page-shell';
import { Mail, MapPin, Briefcase, Users, Target, Zap } from 'lucide-react';
import { useState } from 'react';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

const jobPostings: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'Build scalable web applications for Next Gen\'s rental platform. Work with Next.js, TypeScript, and cloud infrastructure.',
    requirements: [
      '5+ years of full-stack development experience',
      'Strong proficiency in TypeScript and React',
      'Experience with Next.js and Node.js',
      'Database design and optimization skills',
      'Experience with cloud platforms (AWS/GCP preferred)'
    ]
  },
  {
    id: '2',
    title: 'Mobile App Developer (React Native)',
    department: 'Mobile Engineering',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'Develop and maintain cross-platform mobile apps for iOS and Android. Create seamless rental experiences on mobile.',
    requirements: [
      '4+ years of React Native experience',
      'Strong JavaScript/TypeScript skills',
      'Experience with mobile app architecture',
      'Familiarity with native modules and APIs',
      'Portfolio of published apps'
    ]
  },
  {
    id: '3',
    title: 'Product Manager - Growth',
    department: 'Product',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'Drive user acquisition and retention strategies. Own growth metrics and experiment with new features.',
    requirements: [
      '3+ years of product management experience',
      'Strong analytical and data-driven mindset',
      'Experience with growth metrics and A/B testing',
      'Background in marketplace or sharing economy platforms',
      'Excellent communication skills'
    ]
  },
  {
    id: '4',
    title: 'Customer Success Manager',
    department: 'Operations',
    location: 'Multiple Cities',
    type: 'Full-time',
    description: 'Manage vendor relationships and ensure customer satisfaction. Build strong partnerships across the platform.',
    requirements: [
      '2+ years in customer success or account management',
      'Excellent interpersonal skills',
      'Problem-solving mindset',
      'Experience with B2B or marketplace platforms',
      'Multilingual skills (Hindi/English preferred)'
    ]
  },
  {
    id: '5',
    title: 'QA Engineer',
    department: 'Quality Assurance',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'Ensure quality across web and mobile platforms. Design test strategies and automation frameworks.',
    requirements: [
      '2+ years of QA experience',
      'Proficiency in test automation tools',
      'Experience with Selenium/Cypress preferred',
      'Understanding of API testing',
      'Strong attention to detail'
    ]
  },
  {
    id: '6',
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'Manage cloud infrastructure, CI/CD pipelines, and system performance. Ensure platform reliability.',
    requirements: [
      '3+ years of DevOps experience',
      'AWS or GCP expertise',
      'Strong Docker and Kubernetes knowledge',
      'CI/CD pipeline experience (GitHub Actions/GitLab CI)',
      'Infrastructure as Code (Terraform/CloudFormation)'
    ]
  }
];

const benefits = [
  { icon: Zap, title: 'Competitive Salary', description: 'Industry-leading compensation packages' },
  { icon: Users, title: 'Team Culture', description: 'Collaborative and inclusive work environment' },
  { icon: Target, title: 'Growth Opportunities', description: 'Career development and learning programs' },
  { icon: Briefcase, title: 'Flexible Work', description: 'Remote, hybrid, and office options available' }
];

const cultureValues = [
  { title: 'Innovation', description: 'We embrace new ideas and technologies to solve mobility challenges' },
  { title: 'Customer-First', description: 'Everything we build is guided by customer needs' },
  { title: 'Integrity', description: 'Honest, transparent communication in all interactions' },
  { title: 'Impact', description: 'Building solutions that matter for India\'s transportation sector' }
];

export default function CareersPage() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    // Simple validation and subscription logic
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <PageShell
      title="Careers at Next Gear"
      subtitle="Join us in revolutionizing mobility across India"
      variant="light"
    >
      <div className="space-y-12">
        {/* Why Join Us Section */}
        <section>
          <h2 className="text-2xl font-bold text-black mb-6">Why Join Next Gear?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <Icon className="w-8 h-8 text-[var(--brand-red)] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-black mb-2">{benefit.title}</h3>
                      <p className="text-sm text-black/70">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Company Culture Section */}
        <section>
          <h2 className="text-2xl font-bold text-black mb-6">Our Culture & Values</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {cultureValues.map((value, index) => (
              <div
                key={index}
                className="rounded-2xl border border-black/10 bg-gradient-to-br from-[var(--brand-red)]/5 to-[var(--brand-red)]/0 p-6"
              >
                <h3 className="font-semibold text-black mb-2 text-lg">{value.title}</h3>
                <p className="text-sm text-black/70">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Listings Section */}
        <section>
          <h2 className="text-2xl font-bold text-black mb-6">Open Positions ({jobPostings.length})</h2>
          <div className="space-y-3">
            {jobPostings.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-black/10 bg-white overflow-hidden"
              >
                <button
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  className="w-full px-6 py-5 flex items-start justify-between hover:bg-black/2 transition-colors duration-200"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-black text-lg">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-black/60">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1 text-black/60">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="bg-[var(--brand-red)]/10 text-[var(--brand-red)] px-3 py-1 rounded-full text-xs font-medium">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-[var(--brand-red)]">
                    {expandedJob === job.id ? '−' : '+'}
                  </div>
                </button>

                {/* Expanded Job Details */}
                {expandedJob === job.id && (
                  <div className="border-t border-black/10 px-6 py-5 bg-black/2 space-y-4">
                    <div>
                      <h4 className="font-semibold text-black mb-2">About the Role</h4>
                      <p className="text-sm text-black/70">{job.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {job.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm text-black/70 flex gap-2">
                            <span className="text-[var(--brand-red)] font-bold">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href={`mailto:careers@nextgear.in?subject=Application for ${job.title}`}
                      className="inline-block mt-4 px-6 py-2 bg-[var(--brand-red)] text-white rounded-lg font-medium hover:bg-[var(--brand-red)]/90 transition-colors duration-200"
                    >
                      Apply Now
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="rounded-2xl border border-[var(--brand-red)]/20 bg-gradient-to-r from-[var(--brand-red)]/5 to-[var(--brand-red)]/0 p-8 text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Looking for more opportunities?</h2>
          <p className="text-black/70 mb-6">Subscribe to get notified about new job openings</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
              className="flex-1 px-4 py-2 border border-black/10 rounded-lg focus:outline-none focus:border-[var(--brand-red)]"
            />
            <button
              onClick={handleSubscribe}
              className="px-6 py-2 bg-[var(--brand-red)] text-white rounded-lg font-medium hover:bg-[var(--brand-red)]/90 transition-colors duration-200"
            >
              Subscribe
            </button>
          </div>
          {subscribed && (
            <p className="text-green-600 text-sm mt-3">Thanks! Check your email for confirmation.</p>
          )}
        </section>

        {/* Contact Section */}
        <section className="rounded-2xl border border-black/10 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-black mb-3">Have questions?</h3>
          <p className="text-black/70 mb-4">Reach out to our HR team</p>
          <a
            href="mailto:careers@nextgear.in"
            className="inline-flex items-center gap-2 text-[var(--brand-red)] font-medium hover:underline"
          >
            <Mail className="w-4 h-4" />
            careers@nextgear.in
          </a>
        </section>
      </div>
    </PageShell>
  );
}
