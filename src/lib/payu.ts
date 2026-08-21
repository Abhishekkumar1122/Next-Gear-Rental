import crypto from "crypto";

export interface PayUInitiateParams {
  txnid: string;
  amount: number | string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUResponseParams {
  key?: string;
  txnid?: string;
  amount?: string;
  productinfo?: string;
  firstname?: string;
  email?: string;
  status?: string;
  hash?: string;
  additionalCharges?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  mihpayid?: string;
  mode?: string;
  bank_ref_num?: string;
  error?: string;
  error_Message?: string;
  [key: string]: any;
}

export function getPayUConfig() {
  const key = process.env.PAYU_MERCHANT_KEY || "cDkAcI";
  const salt = process.env.PAYU_MERCHANT_SALT || "AuuGQK28pQFvYfImoatVBPrMfz86HQdM";
  const mode = (process.env.PAYU_MODE || "production").toLowerCase();

  const endpointUrl =
    mode === "test" || mode === "sandbox"
      ? "https://test.payu.in/_payment"
      : "https://secure.payu.in/_payment";

  return {
    key,
    salt,
    mode,
    endpointUrl,
  };
}

/**
 * Generates the mandatory PayU SHA-512 Hash for checkout submission.
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
 */
export function generatePayUHash(params: PayUInitiateParams, saltOverride?: string): string {
  const { key, salt: configSalt } = getPayUConfig();
  const salt = saltOverride || configSalt;

  const formattedAmount = Number(params.amount).toFixed(2);
  const udf1 = params.udf1 || "";
  const udf2 = params.udf2 || "";
  const udf3 = params.udf3 || "";
  const udf4 = params.udf4 || "";
  const udf5 = params.udf5 || "";

  const hashString = `${key}|${params.txnid}|${formattedAmount}|${params.productinfo}|${params.firstname}|${params.email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;

  return crypto.createHash("sha512").update(hashString).digest("hex");
}

/**
 * Validates the PayU Response SHA-512 Hash to guarantee tamper-proof security.
 * Formula: sha512(additionalCharges ? additionalCharges + '|' : '') + salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyPayUResponseHash(response: PayUResponseParams, saltOverride?: string): boolean {
  const { key: configKey, salt: configSalt } = getPayUConfig();
  const salt = saltOverride || configSalt;
  const key = response.key || configKey;

  if (!response.hash) return false;

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
