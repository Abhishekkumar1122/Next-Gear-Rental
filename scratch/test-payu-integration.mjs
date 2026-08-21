import { getPayUConfig, generatePayUHash, verifyPayUResponseHash } from "../src/lib/payu.ts";

async function testPayU() {
  console.log("=== 1. Testing PayU Config ===");
  const config = getPayUConfig();
  console.log("PayU Config:", {
    key: config.key,
    mode: config.mode,
    endpointUrl: config.endpointUrl,
    saltPresent: Boolean(config.salt),
  });

  if (config.key !== "cDkAcI") {
    throw new Error(`Expected key cDkAcI but got ${config.key}`);
  }

  console.log("\n=== 2. Testing PayU Request Hash Generation ===");
  const testTxnid = "NG_PAYU_BOOKING123_1786659999";
  const testAmount = 2499;
  const testProduct = "Royal Enfield Hunter 350";
  const testName = "Abhishek";
  const testEmail = "abhishek@next-gear.app";
  const testPhone = "9523765172";
  const testSurl = "https://next-gear.app/api/payments/payu/response";
  const testFurl = "https://next-gear.app/api/payments/payu/response";

  const requestHash = generatePayUHash({
    txnid: testTxnid,
    amount: testAmount,
    productinfo: testProduct,
    firstname: testName,
    email: testEmail,
    phone: testPhone,
    surl: testSurl,
    furl: testFurl,
    udf1: "BOOKING123",
    udf2: "nextgear_web",
  });

  console.log("Generated SHA-512 Request Hash:", requestHash);
  if (!requestHash || requestHash.length !== 128) {
    throw new Error("Invalid SHA-512 hash length");
  }

  console.log("\n=== 3. Testing PayU Callback Reverse Hash Verification ===");
  // Simulate valid PayU successful callback
  // Formula: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const crypto = await import("crypto");
  const salt = config.salt;
  const status = "success";
  const formattedAmount = Number(testAmount).toFixed(2);
  const reverseString = `${salt}|${status}||||||||nextgear_web|BOOKING123|${testEmail}|${testName}|${testProduct}|${formattedAmount}|${testTxnid}|${config.key}`;
  const validResponseHash = crypto.createHash("sha512").update(reverseString).digest("hex");

  const responseParams = {
    key: config.key,
    txnid: testTxnid,
    amount: String(testAmount),
    productinfo: testProduct,
    firstname: testName,
    email: testEmail,
    status: "success",
    udf1: "BOOKING123",
    udf2: "nextgear_web",
    hash: validResponseHash,
    mihpayid: "403993715530123456",
    mode: "UPI",
    bank_ref_num: "522301987654",
  };

  const isVerified = verifyPayUResponseHash(responseParams);
  console.log("PayU Response Hash Verification Result:", isVerified ? "✅ VALID & VERIFIED" : "❌ FAILED");
  if (!isVerified) {
    throw new Error("Reverse hash verification failed for valid payload");
  }

  // Simulate tampered response (e.g. amount modified)
  const tamperedParams = {
    ...responseParams,
    amount: "1.00", // Tampered amount
  };
  const isTamperedCaught = !verifyPayUResponseHash(tamperedParams);
  console.log("PayU Tamper Detection Result:", isTamperedCaught ? "🛡️ TAMPER DETECTED & REJECTED" : "❌ FAILED");
  if (!isTamperedCaught) {
    throw new Error("Tamper detection failed");
  }

  console.log("\n🎉 ALL PAYU CRYPTOGRAPHIC & GATEWAY TESTS PASSED 100%!");
}

testPayU().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
