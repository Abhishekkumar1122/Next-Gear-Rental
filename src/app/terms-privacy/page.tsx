import { PageShell } from "@/components/page-shell";

export default function TermsPrivacyPage() {
  return (
    <PageShell
      title="Terms & Conditions"
      subtitle="Complete rental terms, privacy practices, customer responsibilities, and liability details compliant with Indian consumer protection laws."
    >
      {/* RENTAL TERMS SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">1. Rental Terms & Requirements</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-2">Eligibility (Consumer Protection Act 2019)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Minimum age: 21 years old (25+ for premium vehicles)</li>
              <li>Valid government-issued ID (Aadhar, Passport, Voter ID, License)</li>
              <li>Valid driving license: minimum 2 years old</li>
              <li>Active contact details for communication</li>
              <li>Valid payment method (credit/debit card or wallet)</li>
              <li><strong>No Discrimination:</strong> Equal access regardless of religion, caste, gender, disability. Reasonable accommodations available.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Insurance (Motor Vehicles Act 1988)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Mandatory:</strong> All vehicles have third-party liability insurance (min ₹5 lakhs) per Motor Vehicles Act 1988</li>
              <li><strong>Optional:</strong> Comprehensive insurance plans available for damage protection</li>
              <li>Without insurance: You're liable for 100% repair costs</li>
              <li>Pre-existing damage must be reported and documented before rental starts</li>
              <li><strong>Accident:</strong> Report immediately at +91-XXXXXXXXXX; document with photos</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Rental Conditions</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Return vehicle in same/better condition</li>
              <li>Late returns charged at 2x hourly rate</li>
              <li>Odometer recorded at pickup and drop-off</li>
              <li>Excess mileage charges apply if applicable</li>
              <li>Vehicle inspection report prepared during pickup/drop-off per CPA 2019</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CUSTOMER RESPONSIBILITIES */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">2. Customer Responsibilities During Rental</h2>
        
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
            <li><strong>Vehicle Care:</strong> Safeguard against theft, damage, or misuse</li>
            <li><strong>Fuel:</strong> Return with same fuel level as pickup (or pay fuel charges)</li>
            <li><strong>Document Verification:</strong> Keep driving license and ID handy during drives</li>
            <li><strong>Law Compliance:</strong> Follow traffic rules; speeding/violations your responsibility</li>
            <li><strong>Parking:</strong> Park safely; no unauthorized locations</li>
            <li><strong>Third-Party Damage:</strong> Responsible for damage caused to other vehicles/property</li>
            <li><strong>Accident Protocol:</strong> Report immediately; provide police FIR for major accidents</li>
          </ul>
        </div>
      </section>

      {/* PRICING & TAXES */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">3. Pricing, Taxes & Invoicing (GST Act 2017)</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-2">GST Compliance (HSN 9965)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Tax Rate:</strong> 18% GST on rental services (HSN Code 9965)</li>
              <li><strong>Calculation:</strong> Clearly shown at checkout before payment</li>
              <li><strong>Invoice:</strong> Digital GST invoice issued automatically after booking</li>
              <li><strong>Example:</strong> ₹2,000 rental + ₹360 GST = ₹2,360 total</li>
              <li>Insurance premium: NOT subject to GST (separate line item)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Additional Charges</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Late return: 2x hourly rental rate</li>
              <li>Excess mileage: ₹X per km (specified at checkout)</li>
              <li>Damage: Actual repair cost (insurance applicable)</li>
              <li>Fuel shortage: Actual cost + ₹100 service charge</li>
              <li>No hidden charges: All clearly disclosed before booking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* REFUND POLICY */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">4. Refund & Cancellation Policy</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-black/70 mb-3">
            For detailed refund and cancellation terms, please visit our <a href="/refund-policy" className="text-[var(--brand-red)] hover:underline font-semibold">Refund & Cancellation Policy</a> page.
          </p>

          <div>
            <h3 className="font-semibold text-black mb-2">Quick Overview</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>&gt;24 hours before: 100% refund (free cancellation)</li>
              <li>12-24 hours before: 50% refund</li>
              <li>&lt;12 hours: No refund (reschedule instead)</li>
              <li>After rental start: No refund</li>
              <li>Full refund if we cancel due to vehicle unavailability</li>
            </ul>
          </div>
        </div>
      </section>

      {/* LIABILITY */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">5. Liability & Limitations</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-2">Customer Liability</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Responsible for all damage during rental period</li>
              <li>Liable for third-party claims (accidents, injury, damage to other vehicles)</li>
              <li>Responsible for traffic violations and parking tickets</li>
              <li>Liable for theft if vehicle left unlocked or keys given to others</li>
              <li>Liable for excess mileage charges</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Our Liability</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Vehicle maintenance: We ensure roadworthiness before rental</li>
              <li>Insurance protection: Third-party coverage included</li>
              <li>Service issues: Replacement vehicle or refund if available</li>
              <li><strong>Limitation:</strong> Our liability capped at booking amount</li>
              <li>Force majeure: Not liable for acts of God, government action</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">6. Privacy & Data Protection (Information Technology Act 2000)</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-2">Data We Collect</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Identity: Name, age, contact, address</li>
              <li>Payment: Card details (processed by PCI-DSS gateways, NOT stored)</li>
              <li>Documents: DL, Aadhar (encrypted AES-256)</li>
              <li>GPS: Vehicle location tracking during rental only</li>
              <li>Usage: Booking history, feedback, support interactions</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Data Security (IT Act 2000, Section 43A)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Encryption:</strong> AES-256 for stored data, TLS 1.2+ for transit</li>
              <li><strong>No Card Storage:</strong> Payment handled by approved PCI-DSS gateways only</li>
              <li><strong>Access Control:</strong> Limited access to authorized personnel only</li>
              <li><strong>Breach Notification:</strong> Within 72 hours if any data breach occurs</li>
              <li><strong>Retention:</strong> Delete data after 5 years (post-transaction) or per request</li>
              <li><strong>Right to Deletion:</strong> Request data deletion anytime; complied within 30 days</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DISPUTE RESOLUTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">7. Grievance Redressal & Dispute Resolution</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-2">Your Consumer Rights (CPA 2019)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Right to Information:</strong> Full disclosure of terms & pricing BEFORE booking</li>
              <li><strong>Right to Choose:</strong> Free selection of insurance; no forced add-ons</li>
              <li><strong>Right to Safety:</strong> Vehicle roadworthy per Motor Vehicles Act</li>
              <li><strong>Right to Complaint:</strong> Lodge complaint within 2 years via District/State Consumer Commission</li>
              <li><strong>Right to Compensation:</strong> Up to ₹10 lakhs compensation for service deficiency or negligence</li>
              <li><strong>Right to Consumer Education:</strong> Access to clear policy documents</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Grievance Process</h3>
            <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
              <li><strong>Contact:</strong> grievance@nextgear.in or +91-XXXXXXXXXX</li>
              <li><strong>Response Time:</strong> Within 48 hours (e-commerce rules)</li>
              <li><strong>Resolution:</strong> Within 30 days of complaint</li>
              <li><strong>Escalation:</strong> District Consumer Commission (free filing, no fees)</li>
              <li><strong>National Helpline:</strong> 1800-11-4000 (24/7 toll-free)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FORCE MAJEURE */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">8. Force Majeure Events</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-black/70 mb-3">
            In case of unforeseen events beyond our control, the following apply:
          </p>

          <div>
            <h3 className="font-semibold text-black mb-2">Covered Events</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Natural disasters (earthquake, flood, cyclone)</li>
              <li>Government action (lockdown, ban, war)</li>
              <li>Pandemic/epidemic restrictions</li>
              <li>Extreme weather conditions</li>
              <li>Civil unrest affecting operations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Your Options</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Full Refund:</strong> If vehicle unavailable due to force majeure</li>
              <li><strong>Reschedule:</strong> To a later date at no cost</li>
              <li><strong>Credit:</strong> Amount credited to account for future bookings</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ACCEPTANCE */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6 bg-green-50">
        <h2 className="text-2xl font-bold mb-4 text-green-900">9. Acceptance of Terms & Legal Compliance</h2>
        
        <div>
          <p className="text-sm text-black/70 mb-4">
            By booking a vehicle through Next Gear Rentals, you acknowledge and agree:
          </p>

          <ul className="space-y-2 text-sm text-black/70 list-disc list-inside mb-4">
            <li>You have read and understood these Terms & Conditions</li>
            <li>You understand your consumer rights under applicable laws</li>
            <li>You accept your responsibilities during rental</li>
            <li>You agree to pay GST and all disclosed charges</li>
            <li>You accept the Refund & Cancellation Policy</li>
          </ul>

          <p className="text-sm text-black/70 mb-4">
            <strong>Policy Updates:</strong> We may modify this policy with 30 days' notice. Continued use indicates acceptance. Ongoing bookings honor terms at time of booking.
          </p>

          <p className="text-xs text-black/60 border-t border-green-200 pt-3">
            Last Updated: March 21, 2026 | Compliant with: Consumer Protection Act 2019, Motor Vehicles Act 1988, Information Technology Act 2000, GST Act 2017, E-Commerce Rules 2020
          </p>
        </div>
      </section>
    </PageShell>
  );
}
