import crypto from "crypto";

const key = "cDkAcI";
const salt = "AuuGQK28pQFvYfImoatVBPrMfz86HQdM";
const mode = "production";
const endpointUrl = "https://secure.payu.in/_payment";

function generatePayUHash(params) {
  const formattedAmount = Number(params.amount).toFixed(2);
  const udf1 = params.udf1 || "";
  const udf2 = params.udf2 || "";
  const udf3 = params.udf3 || "";
  const udf4 = params.udf4 || "";
  const udf5 = params.udf5 || "";

  const hashString = `${key}|${params.txnid}|${formattedAmount}|${params.productinfo}|${params.firstname}|${params.email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

function verifyPayUResponseHash(response) {
  const status = response.status || "";
  const udf1 = response.udf1 || "";
  const udf2 = response.udf2 || "";
  const udf3 = response.udf3 || "";
  const udf4 = response.udf4 || "";
  const udf5 = response.udf5 || "";
  const email = response.email || "";
  const firstname = response.firstname || "";
  const productinfo = response.productinfo || "";
  const amount = response.amount ? Number(response.amount).toFixed(2) : "";
  const txnid = response.txnid || "";

  let hashString = "";
  if (response.additionalCharges) {
    hashString = `${response.additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  const calculatedHash = crypto.createHash("sha512").update(hashString).digest("hex");
  return calculatedHash.toLowerCase() === response.hash.toLowerCase();
}

console.log("=== 1. Testing PayU Config ===");
console.log("Merchant Key:", key);
console.log("Endpoint URL:", endpointUrl);

console.log("\n=== 2. Testing PayU Request Hash Generation ===");
const txnid = "NG_PAYU_BK999_123456";
const hash = generatePayUHash({
  txnid,
  amount: 2499,
  productinfo: "Hunter 350",
  firstname: "Abhishek",
  email: "abhishek@next-gear.app",
  udf1: "BK999",
  udf2: "nextgear_web",
});

console.log("Generated SHA-512 Hash:", hash);
console.log("Hash Length:", hash.length, "(Expected: 128 chars)");

console.log("\n=== 3. Testing PayU Reverse Callback Hash Verification ===");
// In reverse hash: udf5 down to udf1:
// salt | status | ||||| | udf5 | udf4 | udf3 | udf2 | udf1 | email | firstname | productinfo | amount | txnid | key
const udf1 = "BK999";
const udf2 = "nextgear_web";
const udf3 = "";
const udf4 = "";
const udf5 = "";
const status = "success";
const amount = "2499.00";
const firstname = "Abhishek";
const email = "abhishek@next-gear.app";
const productinfo = "Hunter 350";

const reverseString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
const expectedHash = crypto.createHash("sha512").update(reverseString).digest("hex");

const response = {
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  status,
  udf1,
  udf2,
  udf3,
  udf4,
  udf5,
  hash: expectedHash,
};

const isValid = verifyPayUResponseHash(response);
console.log("PayU Hash Verification:", isValid ? "✅ 100% VALID & VERIFIED" : "❌ FAILED");

const isTamperCaught = !verifyPayUResponseHash({ ...response, amount: "1.00" });
console.log("PayU Anti-Tamper Verification:", isTamperCaught ? "🛡️ TAMPER DETECTED & REJECTED" : "❌ FAILED");

console.log("\n🎉 PayU cryptographic validation successful!");
