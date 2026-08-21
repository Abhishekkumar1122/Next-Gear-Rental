import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function registerNumber() {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  console.log(`Attempting Meta Graph API Register for Phone ID: ${phoneId}...`);

  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin: "123456",
    }),
  });

  const json = await response.json();
  console.log("Register Response Status:", response.status);
  console.log("Register Result:", JSON.stringify(json, null, 2));
}

registerNumber();
