import { PageShell } from "@/components/page-shell";

export default function RefundPolicyPage() {
  return (
    <PageShell
      title="Refund & Cancellation Policy"
      subtitle="Clear terms and process for cancellations, refunds, and rescheduling your rental bookings."
    >
      {/* CANCELLATION POLICY SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">1. Cancellation Policy (Consumer Protection Act 2019 Compliant)</h2>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">Your Consumer Right: Easy Return Period</h3>
            <p className="text-sm text-green-800">
              Under Consumer Protection Act 2019, you have the right to cancel for any reason before the service begins (rental start time). The following timeline reflects your statutory rights.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-black mb-3">Cancellation Timeline & Refunds</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black/5">
                    <th className="border border-black/10 p-3 text-left font-semibold">Cancellation Time</th>
                    <th className="border border-black/10 p-3 text-left font-semibold">Refund</th>
                    <th className="border border-black/10 p-3 text-left font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black/10 p-3">More than 24 hours</td>
                    <td className="border border-black/10 p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded">100%</span></td>
                    <td className="border border-black/10 p-3">Full refund (excl. insurance)</td>
                  </tr>
                  <tr className="bg-black/[0.02]">
                    <td className="border border-black/10 p-3">12-24 hours</td>
                    <td className="border border-black/10 p-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">50%</span></td>
                    <td className="border border-black/10 p-3">50% refunded, 50% fee deducted</td>
                  </tr>
                  <tr>
                    <td className="border border-black/10 p-3">Less than 12 hours</td>
                    <td className="border border-black/10 p-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded">0%</span></td>
                    <td className="border border-black/10 p-3">Can reschedule instead</td>
                  </tr>
                  <tr className="bg-black/[0.02]">
                    <td className="border border-black/10 p-3">After rental start</td>
                    <td className="border border-black/10 p-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded">0%</span></td>
                    <td className="border border-black/10 p-3">No refund available</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">How to Cancel</h3>
            <ol className="space-y-2 text-sm text-black/70 list-decimal list-inside">
              <li>Log in to your Next Gear Rentals account</li>
              <li>Go to "My Bookings" section</li>
              <li>Select the booking to cancel</li>
              <li>Click "Cancel Booking" button</li>
              <li>Confirm cancellation</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
            <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
              <li><strong>CPA 2019 Right:</strong> Cancel anytime before rental starts with applicable refund percentage</li>
              <li><strong>30-Minute Window:</strong> Full refund if cancelled within 30 minutes of booking (pre-payment)</li>
              <li><strong>Insurance:</strong> Non-refundable but damage claims remain available</li>
              <li><strong>Free Rescheduling:</strong> Reschedule within 30 days with no fees</li>
              <li><strong>Partner Cancellation:</strong> Full refund if we cancel due to vehicle unavailability</li>
            </ul>
          </div>
        </div>
      </section>

      {/* REFUND PROCESS SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">2. Refund Process & Timeline</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-3">Processing Steps</h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--brand-red)] text-white font-semibold">1</div>
                </div>
                <div>
                  <p className="font-semibold text-black">Cancellation Confirmed</p>
                  <p className="text-sm text-black/70">Immediate - Confirmation email receipt</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--brand-red)] text-white font-semibold">2</div>
                </div>
                <div>
                  <p className="font-semibold text-black">Refund Initiated</p>
                  <p className="text-sm text-black/70">Within 24 hours per CPA 2019</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--brand-red)] text-white font-semibold">3</div>
                </div>
                <div>
                  <p className="font-semibold text-black">Refund Credited</p>
                  <p className="text-sm text-black/70">5-7 business days in your account</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Refund Methods (RBI Compliant)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Card:</strong> Back to issuer (5-7 days)</li>
              <li><strong>Wallet:</strong> Instant reversal (1-2 days to appear)</li>
              <li><strong>UPI:</strong> Reversal within 3 hours</li>
              <li><strong>Bank Transfer:</strong> 3-5 business days</li>
            </ul>
          </div>
        </div>
      </section>

      {/* RESCHEDULING SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">3. Rescheduling (Better Than Cancellation)</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-black mb-2">Why Reschedule?</h3>
            <p className="text-sm text-black/70 mb-3">Keep your booking value without losing money to cancellation fees.</p>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Reschedule to any date within 30 days</li>
              <li>NO rescheduling fees</li>
              <li>Pay difference only if new date is more expensive</li>
              <li>Get credit if new date is cheaper</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">How to Modify Booking</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Date/Time:</strong> Change up to 24 hours before pickup</li>
              <li><strong>Location:</strong> Modify up to 24 hours prior</li>
              <li><strong>Vehicle:</strong> Upgrade/downgrade if available</li>
              <li><strong>Insurance:</strong> Add plans before rental starts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SPECIAL REFUNDS SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">4. Special Circumstances - Full Refund Eligible</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-black/70">
            Per Consumer Protection Act 2019, full refund (including insurance) is available for service deficiency:
          </p>

          <div>
            <h3 className="font-semibold text-black mb-2">Eligible Events</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li><strong>Vehicle Unavailable:</strong> Our fault/defect</li>
              <li><strong>Technical Failure:</strong> Platform or payment issue on our end</li>
              <li><strong>Medical Emergency:</strong> Documented proof required</li>
              <li><strong>Death/Hospitalization:</strong> Immediate family (documentation required)</li>
              <li><strong>Force Majeure:</strong> Natural disaster, government lockdown, war</li>
              <li><strong>Service Deficiency:</strong> Vehicle doesn't match description</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">Grievance Process (CPA 2019)</h3>
            <ul className="space-y-2 text-sm text-black/70 list-disc list-inside">
              <li>Contact: <strong>grievance@nextgear.in</strong></li>
              <li>Complaint window: <strong>2 years</strong> from transaction</li>
              <li>Response time: <strong>5-7 business days</strong></li>
              <li>Escalation: District Consumer Commission (free filing)</li>
              <li>National Helpline: <strong>1800-11-4000</strong> (24/7)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SUPPORT SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-2xl font-bold mb-4">5. Need Help?</h2>
        
        <div className="space-y-4">
          <ul className="space-y-3 text-sm text-black/70">
            <li><strong className="text-black">Email:</strong> support@nextgear.in</li>
            <li><strong className="text-black">Phone:</strong> 1800-NEXTGEAR</li>
            <li><strong className="text-black">Chat:</strong> Available 9 AM - 11 PM</li>
            <li><strong className="text-black">Response:</strong> Within 24 hours</li>
          </ul>
        </div>
      </section>

      {/* ACCEPTANCE SECTION */}
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mt-6 bg-green-50">
        <h2 className="text-2xl font-bold mb-4 text-green-900">6. Policy Acknowledgment</h2>
        <p className="text-sm text-black/70 mb-4">
          By booking, you agree to this policy and understand your CPA 2019 consumer rights.
        </p>
        <p className="text-xs text-black/60 border-t border-green-200 pt-3">
          Last Updated: March 21, 2026 | Compliant with CPA 2019, RBI Guidelines, IT Act 2000, E-Commerce Rules 2020
        </p>
      </section>
    </PageShell>
  );
}