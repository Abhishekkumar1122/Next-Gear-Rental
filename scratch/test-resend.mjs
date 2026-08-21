import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  console.log("Testing Resend API...");
  
  // 1. Try sending from Next Gear domain
  const res1 = await resend.emails.send({
    from: "Next Gear <noreply@next-gear.app>",
    to: "abhisheksingha202002@gmail.com",
    subject: "Test from next-gear.app",
    html: "<p>Test email</p>",
  });
  console.log("Result 1 (from noreply@next-gear.app):", JSON.stringify(res1, null, 2));

  // 2. Try checking domains on Resend account
  try {
    const domains = await resend.domains.list();
    console.log("Resend Domains:", JSON.stringify(domains, null, 2));
  } catch (e) {
    console.log("Domains list error:", e.message);
  }

  // 3. Try sending from onboarding@resend.dev (default sandbox test domain)
  const res2 = await resend.emails.send({
    from: "Next Gear <onboarding@resend.dev>",
    to: "abhisheksingha202002@gmail.com",
    subject: "Test from onboarding@resend.dev",
    html: "<p>Test onboarding email</p>",
  });
  console.log("Result 2 (from onboarding@resend.dev):", JSON.stringify(res2, null, 2));
}

test();
