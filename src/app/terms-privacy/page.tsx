import { PageShell } from "@/components/page-shell";
import Link from "next/link";

const sections = [
  {
    id: "eligibility",
    number: "01",
    title: "Rental Eligibility & Requirements",
    color: "blue",
    icon: "🪪",
    subsections: [
      {
        heading: "Who Can Rent (Consumer Protection Act 2019)",
        items: [
          "Minimum age: 21 years old (25+ for premium/luxury vehicles)",
          "Valid government-issued photo ID: Aadhar Card, Passport, Voter ID, or Driving License",
          "Valid driving license with minimum 2 years of experience",
          "Active mobile number and email address for communication",
          "Valid payment method: credit card, debit card, UPI, or approved wallet",
          "No Discrimination: Equal access regardless of religion, caste, gender, disability — reasonable accommodations available on request",
        ],
      },
      {
        heading: "Documents Required at Pickup",
        items: [
          "Original driving license (not photocopy)",
          "Original government-issued photo ID (Aadhar/Passport/Voter ID)",
          "Selfie or live photo verification (KYC requirement)",
          "Booking confirmation email/SMS",
          "Any advance payment receipt (if applicable)",
        ],
      },
    ],
  },
  {
    id: "insurance",
    number: "02",
    title: "Insurance & Accident Policy",
    color: "amber",
    icon: "🛡️",
    subsections: [
      {
        heading: "Mandatory Third-Party Insurance (Motor Vehicles Act 1988)",
        items: [
          "All vehicles carry third-party liability insurance (minimum ₹5 lakhs) per Motor Vehicles Act 1988 — this is non-negotiable and mandatory by law",
          "Third-party insurance covers: bodily injury or death of a third party, damage to third-party property",
          "This does NOT cover: damage to the rented vehicle, personal injury to the renter",
          "Optional: Comprehensive Damage Waiver (CDW) available at checkout for own-vehicle damage protection",
          "Without CDW: Renter is 100% liable for repair costs to the vehicle",
          "Pre-existing damage must be documented in the handover report before rental commences",
        ],
      },
      {
        heading: "Accident Protocol — What To Do",
        items: [
          "STOP immediately and do not flee the scene (IPC Section 279, 304A)",
          "Call emergency services: Police 100, Ambulance 108",
          "Call our 24x7 RSA helpline immediately after emergency: +91-9523765172",
          "Do NOT admit fault or make verbal settlements at the scene",
          "Document everything: photos of vehicle, third-party vehicle, scene, injuries",
          "Obtain FIR (First Information Report) from nearest police station — mandatory for insurance claims",
          "Submit FIR and photos within 24 hours to support@next-gear.app",
          "Failure to report accident voids all insurance coverage",
        ],
      },
    ],
  },
  {
    id: "death-fatality",
    number: "03",
    title: "Death, Serious Injury & Fatality Policy",
    color: "red",
    icon: "⚠️",
    subsections: [
      {
        heading: "In Case of Renter Death or Serious Injury",
        items: [
          "Next Gear Rentals maintains mandatory Personal Accident Cover (PAC) as per Motor Vehicles Act 1988 — this covers: death benefit up to ₹1 lakh, permanent disability benefit up to ₹50,000",
          "The PAC is limited to the named driver only and does not extend to pillion riders or passengers unless separately insured",
          "Nominee/Legal heir must contact us within 7 days of the incident with: FIR copy, Death Certificate, Hospital Report, Nominee ID proof",
          "We will cooperate fully with insurance authorities and police investigation",
          "The vehicle must not be moved from the accident site without police permission",
          "Rental charges are waived from the date of hospitalization or death upon receipt of valid documentation",
        ],
      },
      {
        heading: "Company Liability Limitation",
        items: [
          "Next Gear Rentals is a vehicle rental intermediary — we are NOT liable for accidents, injuries, or deaths arising from rider/driver negligence, traffic violations, or rash driving",
          "We are NOT liable for death or injury caused by: DUI (driving under influence), over-speeding, unauthorized off-road use, reckless driving",
          "We ARE liable if: vehicle was mechanically unfit at the time of rental (and we failed pre-rental inspection), vehicle had undisclosed defects reported to us before the ride",
          "Legal jurisdiction: All disputes governed by Indian courts in the city of rental origin",
          "Our maximum financial liability is capped at the total booking value paid by the customer",
          "For third-party death caused by renter: renter/legal heir bears full legal and financial responsibility under IPC and Motor Vehicles Act",
        ],
      },
      {
        heading: "Next of Kin & Emergency Contact",
        items: [
          "We strongly recommend adding an emergency contact during KYC/booking — in a serious accident, we will contact this person immediately",
          "In case of unresponsive renter, we will notify: registered emergency contact, local police, and ambulance",
          "All personal data of the deceased is handled with utmost confidentiality and will only be shared with legal heirs or police upon valid request",
        ],
      },
    ],
  },
  {
    id: "responsibilities",
    number: "04",
    title: "Customer Responsibilities During Rental",
    color: "purple",
    icon: "📋",
    subsections: [
      {
        heading: "Vehicle Use Rules",
        items: [
          "Vehicle Care: Keep vehicle safe from theft, damage, fire, and misuse at all times",
          "Fuel: Return with same fuel level as at pickup — or pay actual fuel cost + ₹100 service charge",
          "Mileage: Odometer recorded at pickup and return — excess mileage charged per km (shown at checkout)",
          "Late Return: Late returns charged at 2x the hourly rental rate for every hour of delay",
          "No Sub-letting: Renter may not lend, hire, or transfer the vehicle to any third party",
          "No Modifications: Mechanical, cosmetic, or electronic modifications are strictly prohibited",
          "Geographic Limits: Vehicle must not be taken outside permitted state/zone without written approval",
          "No Off-Road Use: Rental vehicles are strictly for on-road use only",
        ],
      },
      {
        heading: "Legal & Traffic Compliance",
        items: [
          "Law Compliance: All traffic rules, speed limits, and parking rules are the renter's sole responsibility",
          "Challan/Tickets: All traffic challans and parking fines during rental period are the renter's full responsibility",
          "Alcohol/Drugs: Riding/driving under influence (DUI) is STRICTLY PROHIBITED — vehicle will be impounded, booking terminated, no refund, and legal action will be pursued",
          "Helmet Mandatory: Wearing the provided helmet is mandatory for bike riders at all times (Motor Vehicles Act, S. 129)",
          "Parking: Park only in legal, designated areas — illegal parking penalties billed to renter",
          "Nighttime Use: Authorized — but renter must follow all local night-time traffic regulations",
        ],
      },
    ],
  },
  {
    id: "pricing",
    number: "05",
    title: "Pricing, GST & Invoicing",
    color: "green",
    icon: "💳",
    subsections: [
      {
        heading: "GST Compliance (GST Act 2017, HSN 9965)",
        items: [
          "Tax Rate: 18% GST on all rental services (HSN Code 9965)",
          "GST is clearly shown at checkout BEFORE payment — no hidden taxes",
          "Digital GST invoice issued automatically to your registered email after booking confirmation",
          "Example: ₹2,000 rental + ₹360 GST = ₹2,360 total billed",
          "Insurance premium: NOT subject to GST (separate line item on invoice)",
          "GST input credit: Available for businesses with valid GSTIN — declare at checkout",
        ],
      },
      {
        heading: "Additional Charges",
        items: [
          "Late return: 2× hourly rate per hour of delay",
          "Excess mileage: As specified at checkout (per km rate)",
          "Damage repair: Actual cost (CDW insurance applicable if purchased)",
          "Fuel shortage: Actual refill cost + ₹100 convenience fee",
          "Lost keys: ₹1,500 replacement charge",
          "Deep cleaning (if vehicle returned in very dirty condition): ₹500–₹2,000",
          "No hidden charges — all charges are disclosed before booking and on the final invoice",
        ],
      },
    ],
  },
  {
    id: "cancellation",
    number: "06",
    title: "Refund & Cancellation Policy",
    color: "orange",
    icon: "↩️",
    subsections: [
      {
        heading: "Cancellation Timeline",
        items: [
          "More than 24 hours before pickup: 100% full refund — no questions asked",
          "12 to 24 hours before pickup: 50% refund",
          "Less than 12 hours before pickup: No refund (reschedule option available)",
          "After rental has started: No refund",
          "No-show without cancellation: Full charge, no refund",
          "Next Gear cancels due to vehicle unavailability: 100% full refund within 3-5 business days",
          "Refund processed to original payment method within 5–7 working days",
        ],
      },
      {
        heading: "Special Circumstances",
        items: [
          "Medical emergency (hospitalization): Full refund with valid hospital documents",
          "Death in family: Full refund with Death Certificate",
          "Government lockdown/force majeure: Full refund or free reschedule",
          "Vehicle breakdown by our fault: Full refund for unused rental days",
          "For detailed cancellation terms: See our Cancellation & Refund Policy page",
        ],
      },
    ],
  },
  {
    id: "privacy",
    number: "07",
    title: "Privacy & Data Protection",
    color: "cyan",
    icon: "🔐",
    subsections: [
      {
        heading: "Data We Collect (IT Act 2000)",
        items: [
          "Identity: Name, age, contact number, address",
          "Payment: Card details — processed only by PCI-DSS certified gateways (Razorpay/Stripe); NOT stored by us",
          "Documents: Driving license, Aadhar — stored encrypted (AES-256) on secure servers",
          "Location: Vehicle GPS tracking only during active rental period — not after",
          "Usage: Booking history, support chat, reviews",
        ],
      },
      {
        heading: "Your Data Rights (IT Act 2000, Section 43A)",
        items: [
          "Encryption: AES-256 for stored data; TLS 1.3 for all data in transit",
          "No Card Storage: Payment handled exclusively by PCI-DSS certified processors",
          "Breach Notification: You will be notified within 72 hours of any data breach",
          "Data Retention: Deleted after 5 years post-transaction or upon verified request",
          "Right to Deletion: Request data deletion anytime — complied within 30 days",
          "No Third-Party Sale: We never sell or trade your personal data to advertisers",
        ],
      },
    ],
  },
  {
    id: "disputes",
    number: "08",
    title: "Grievance & Dispute Resolution",
    color: "indigo",
    icon: "⚖️",
    subsections: [
      {
        heading: "Your Consumer Rights (Consumer Protection Act 2019)",
        items: [
          "Right to Information: Full disclosure of all terms, pricing, and policies BEFORE booking",
          "Right to Choose: Freedom to select or decline insurance; no forced add-ons",
          "Right to Safety: All vehicles roadworthy and pre-inspected per Motor Vehicles Act",
          "Right to Complaint: Lodge formal complaint within 2 years via District/State Consumer Commission",
          "Right to Compensation: Up to ₹10 lakhs for proven service deficiency or negligence",
          "Right to Consumer Education: Access to all policy documents at all times — free of charge",
        ],
      },
      {
        heading: "How to Raise a Grievance",
        items: [
          "Step 1 — Contact Us: Email support@next-gear.app or call +91-9523765172 (Mon–Sat, 9AM–7PM)",
          "Step 2 — Response: We acknowledge within 48 hours (E-Commerce Rules 2020)",
          "Step 3 — Resolution: Full resolution within 30 days of complaint",
          "Step 4 — Escalation: District Consumer Commission (free to file, no court fees)",
          "National Consumer Helpline: 1800-11-4000 (24/7 toll-free)",
          "Online Grievance Portal: consumerhelpline.gov.in",
        ],
      },
    ],
  },
  {
    id: "force-majeure",
    number: "09",
    title: "Force Majeure Events",
    color: "slate",
    icon: "🌪️",
    subsections: [
      {
        heading: "Events Beyond Our Control",
        items: [
          "Natural disasters: earthquake, flood, cyclone, landslide",
          "Government action: lockdown, state of emergency, war, travel ban",
          "Pandemic or epidemic restrictions declared by central/state government",
          "Extreme weather conditions making travel unsafe",
          "Civil unrest, curfew, or public disturbances affecting operations",
          "Fire, explosion, or other catastrophic events at depot/hub",
        ],
      },
      {
        heading: "Your Options During Force Majeure",
        items: [
          "Full Refund: If vehicle is unavailable due to force majeure — 100% refund within 5 business days",
          "Free Reschedule: Move booking to a future date at no charge",
          "Credit Wallet: Amount credited to your Next Gear account for any future booking",
          "No penalty or cancellation fee applies to either party in genuine force majeure events",
        ],
      },
    ],
  },
  {
    id: "acceptance",
    number: "10",
    title: "Legal Compliance & Acceptance",
    color: "emerald",
    icon: "✅",
    subsections: [
      {
        heading: "By Booking, You Agree To",
        items: [
          "You have read, understood, and voluntarily accepted all Terms & Conditions",
          "You understand your consumer rights under Indian law",
          "You accept all rental responsibilities and liability clauses stated above",
          "You agree to pay GST and all charges disclosed before booking",
          "You accept the Refund & Cancellation Policy in full",
          "You consent to collection and processing of your personal data as described",
          "You acknowledge the Death/Injury/Accident policy and its limitation of liability",
        ],
      },
      {
        heading: "Governing Law",
        items: [
          "These terms are governed by and construed under Indian law",
          "Disputes subject to jurisdiction of courts in the city of the rental origin",
          "Applicable laws: Consumer Protection Act 2019 | Motor Vehicles Act 1988 | Information Technology Act 2000 | GST Act 2017 | E-Commerce Rules 2020 | IPC 1860",
          "Policy Updates: 30 days' notice given before any material changes — continued use = acceptance",
          "Ongoing bookings honor terms applicable at the time of booking confirmation",
        ],
      },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; badge: string; heading: string; icon: string; bullet: string }> = {
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-950/20",    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",    heading: "text-blue-300",    icon: "bg-blue-500/20 text-blue-300",    bullet: "text-blue-400" },
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-950/20",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",   heading: "text-amber-300",   icon: "bg-amber-500/20 text-amber-300",   bullet: "text-amber-400" },
  red:     { border: "border-red-500/40",     bg: "bg-red-950/25",     badge: "bg-red-500/20 text-red-300 border-red-500/40",     heading: "text-red-300",     icon: "bg-red-500/20 text-red-300",     bullet: "text-red-400" },
  purple:  { border: "border-purple-500/30",  bg: "bg-purple-950/20",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",  heading: "text-purple-300",  icon: "bg-purple-500/20 text-purple-300",  bullet: "text-purple-400" },
  green:   { border: "border-emerald-500/30", bg: "bg-emerald-950/20", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", heading: "text-emerald-300", icon: "bg-emerald-500/20 text-emerald-300", bullet: "text-emerald-400" },
  orange:  { border: "border-orange-500/30",  bg: "bg-orange-950/20",  badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",  heading: "text-orange-300",  icon: "bg-orange-500/20 text-orange-300",  bullet: "text-orange-400" },
  cyan:    { border: "border-cyan-500/30",    bg: "bg-cyan-950/20",    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",    heading: "text-cyan-300",    icon: "bg-cyan-500/20 text-cyan-300",    bullet: "text-cyan-400" },
  indigo:  { border: "border-indigo-500/30",  bg: "bg-indigo-950/20",  badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",  heading: "text-indigo-300",  icon: "bg-indigo-500/20 text-indigo-300",  bullet: "text-indigo-400" },
  slate:   { border: "border-slate-500/30",   bg: "bg-slate-800/30",   badge: "bg-slate-500/20 text-slate-300 border-slate-500/40",   heading: "text-slate-300",   icon: "bg-slate-500/20 text-slate-300",   bullet: "text-slate-400" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-950/20", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", heading: "text-emerald-300", icon: "bg-emerald-500/20 text-emerald-300", bullet: "text-emerald-400" },
};

export const metadata = {
  title: "Terms & Conditions | Next Gear Rentals",
  description:
    "Read Next Gear Rentals' complete Terms & Conditions — rental eligibility, accident policy, death & fatality clauses, insurance, liability, refunds, GST, and grievance redressal.",
};

export default function TermsPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0d0f18] via-[#0a0c14] to-[#080a0f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(220,38,38,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 uppercase tracking-widest mb-6">
            ⚖️ Legal Document
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-base md:text-lg text-white/60 max-w-2xl leading-relaxed mb-6">
            Complete rental terms, accident &amp; fatality policies, liability clauses, customer responsibilities, insurance coverage, and grievance redressal — compliant with Indian consumer protection laws.
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {["CPA 2019", "Motor Vehicles Act 1988", "IT Act 2000", "GST Act 2017", "IPC 1860"].map((law) => (
              <span key={law} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-semibold text-white/60">
                {law}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-white/30">Last Updated: September 3, 2026 &nbsp;|&nbsp; Next Gear Rentals Pvt. Ltd.</p>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#080a0f]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {sections.map((s) => {
              const c = colorMap[s.color];
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all hover:scale-105 whitespace-nowrap ${c.badge}`}
                >
                  <span>{s.icon}</span>
                  <span>{s.number}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sections */}
      <main className="mx-auto max-w-5xl px-6 py-12 space-y-8">

        {/* CRITICAL NOTICE for Section 03 */}
        <div className="rounded-2xl border border-red-500/50 bg-red-950/30 p-5 flex gap-4 shadow-lg shadow-red-500/10">
          <div className="text-2xl shrink-0">🚨</div>
          <div>
            <p className="text-sm font-black text-red-300 uppercase tracking-wide mb-1">Important Notice — Accident & Fatality</p>
            <p className="text-xs text-red-200/80 leading-relaxed">
              Next Gear Rentals vehicles carry mandatory third-party liability insurance per Motor Vehicles Act 1988. However, renters are solely responsible for accidents caused by negligence, DUI, or traffic violations. In case of death or serious injury, contact emergency services first (100/108), then our helpline <strong className="text-red-300">+91-9523765172</strong>. See Section 03 for full fatality policy.
            </p>
          </div>
        </div>

        {sections.map((section) => {
          const c = colorMap[section.color];
          return (
            <section
              key={section.id}
              id={section.id}
              className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden shadow-xl`}
            >
              {/* Section Header */}
              <div className={`px-6 py-5 border-b ${c.border} flex items-center gap-4`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black ${c.icon} border ${c.border} shrink-0`}>
                  {section.icon}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${c.heading} opacity-70`}>
                    Section {section.number}
                  </p>
                  <h2 className={`text-lg font-black text-white`}>{section.title}</h2>
                </div>
              </div>

              {/* Subsections */}
              <div className="p-6 space-y-6">
                {section.subsections.map((sub, si) => (
                  <div key={si}>
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${c.heading}`}>
                      {sub.heading}
                    </h3>
                    <ul className="space-y-2">
                      {sub.items.map((item, ii) => (
                        <li key={ii} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.bullet.replace("text-", "bg-")}`} />
                          <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white/90 font-bold'>$1</strong>") }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Footer Contact Card */}
        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-8 text-center space-y-4">
          <p className="text-2xl font-black text-white">Questions About Our Policies?</p>
          <p className="text-sm text-white/60 max-w-lg mx-auto">
            Our support team is available Mon–Sat, 9AM–7PM. For urgent matters (accident, emergency), our helpline is active 24×7.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:support@next-gear.app"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-all"
            >
              ✉️ support@next-gear.app
            </a>
            <a
              href="tel:+919523765172"
              className="inline-flex items-center gap-2 rounded-full bg-red-600 border border-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all"
            >
              📞 +91-9523765172 (24×7)
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-5 py-2.5 text-sm font-bold text-white/70 hover:bg-white/10 transition-all"
            >
              💬 Live Support
            </Link>
          </div>
          <p className="text-[11px] text-white/25 pt-2">
            © 2026 Next Gear Rentals Pvt. Ltd. &nbsp;|&nbsp; CIN: UXXXXXXXXXXXXXXXXX &nbsp;|&nbsp; GST: XXXXXXXXXXXXXXX
          </p>
        </div>
      </main>
    </div>
  );
}
