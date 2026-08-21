import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function sendTemplate() {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  console.log(`Dispatching Meta Pre-Approved 'hello_world' Template to +91 9234588938 via Phone ID ${phoneId}...`);

  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: "919234588938",
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" },
      },
    }),
  });

  const json = await response.json();
  console.log("Template Dispatch Status:", response.status);
  console.log("Template Dispatch Result:", JSON.stringify(json, null, 2));
}

sendTemplate();
