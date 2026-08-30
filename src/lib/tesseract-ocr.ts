import { createWorker } from "tesseract.js";

export interface RealOcrResult {
  success: boolean;
  documentType: "aadhaar" | "license" | "aadhaar-back" | "unknown";
  documentNumber: string | null;
  fullName: string | null;
  dob: string | null;
  expiryDate: string | null;
  rawText: string;
  confidence: number;
  errorMessage?: string;
}

/**
 * Clean & normalize text for OCR parsing
 */
function cleanOcrText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .trim();
}

/**
 * Extract Indian Driving License Number
 * Standard formats:
 * - DL-1420110012345 or DL14 20110012345
 * - MH12 20180054321
 * - HR2619980004567
 * - UP1420200001234
 * - TS0920190012345
 * - Generic: 2-letter state code + 2-digit RTO + 4-digit Year + 7-digit serial
 */
function extractDrivingLicenseNumber(text: string): string | null {
  // 1. Standard Sarathi 15/16-char format: SS-RR-YYYY-NNNNNNN
  const regexStandard = /\b([A-Z]{2})[ -]?([0-9]{2})[ -]?([0-9]{4})[ -]?([0-9]{7})\b/i;
  const matchStandard = text.match(regexStandard);
  if (matchStandard) {
    const [, state, rto, year, num] = matchStandard;
    return `${state.toUpperCase()}${rto}${year}${num}`;
  }

  // 2. Legacy state format: e.g., DL-04-2001-1234567 or MH-02-123456
  const regexLegacy = /\b([A-Z]{2})[- /]?([0-9]{2})[- /]?([0-9]{4,7})[- /]?([0-9]{3,7})\b/i;
  const matchLegacy = text.match(regexLegacy);
  if (matchLegacy) {
    const clean = matchLegacy[0].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (clean.length >= 10 && clean.length <= 18) {
      return clean;
    }
  }

  // 3. Look for explicit keyword like "DL NO", "DL No.", "License No", "Licence No"
  const regexKeyword = /(?:DL\s*NO|LICEN[CS]E\s*NO|DRIVING\s*LICEN[CS]E)[\s.:/=-]*([A-Z0-9 -/]{9,20})/i;
  const matchKeyword = text.match(regexKeyword);
  if (matchKeyword && matchKeyword[1]) {
    const clean = matchKeyword[1].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (clean.length >= 8 && clean.length <= 18) {
      return clean;
    }
  }

  return null;
}

/**
 * Extract Indian Aadhaar Number (12-digit UID)
 * Formats:
 * - 1234 5678 9012
 * - 1234-5678-9012
 * - 123456789012
 */
function extractAadhaarNumber(text: string): string | null {
  // 1. Spaced 4-4-4 format: 1234 5678 9012
  const regexSpaced = /\b([2-9][0-9]{3})\s+([0-9]{4})\s+([0-9]{4})\b/;
  const matchSpaced = text.match(regexSpaced);
  if (matchSpaced) {
    return `${matchSpaced[1]} ${matchSpaced[2]} ${matchSpaced[3]}`;
  }

  // 2. Hyphenated format: 1234-5678-9012
  const regexHyphen = /\b([2-9][0-9]{3})-([0-9]{4})-([0-9]{4})\b/;
  const matchHyphen = text.match(regexHyphen);
  if (matchHyphen) {
    return `${matchHyphen[1]} ${matchHyphen[2]} ${matchHyphen[3]}`;
  }

  // 3. Consecutive 12 digits (with Government / UIDAI context)
  if (/Aadhaar|UIDAI|Government of India|Unique Identification|Mera Aadhaar/i.test(text)) {
    const regex12 = /\b([2-9][0-9]{11})\b/;
    const match12 = text.match(regex12);
    if (match12) {
      const s = match12[1];
      return `${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 12)}`;
    }
  }

  return null;
}

/**
 * Extract Date of Birth (DOB)
 */
function extractDob(text: string): string | null {
  const regexDob = /(?:DOB|Date of Birth|Birth Date|D\.O\.B)[\s.:/=-]*([0-3]?[0-9][./-][0-1]?[0-9][./-][1-2][0-9]{3})/i;
  const match = text.match(regexDob);
  if (match && match[1]) {
    return match[1].replace(/[./]/g, "-");
  }

  // Standalone date with year between 1940 and 2015
  const regexDate = /\b([0-3]?[0-9][./-][0-1]?[0-9][./-](?:19[4-9][0-9]|20[0-1][0-9]))\b/;
  const matchDate = text.match(regexDate);
  if (matchDate) {
    return matchDate[1].replace(/[./]/g, "-");
  }

  return null;
}

/**
 * Extract Full Name heuristics from Indian ID cards
 */
function extractName(text: string): string | null {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Explicit "Name:" or "Name" label
    const nameMatch = line.match(/(?:Name|Holder Name)[\s.:/=-]+([A-Za-z\s]{3,40})/i);
    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim();
      if (!/government|india|union|transport|driving|licence|license|card/i.test(candidate)) {
        return candidate;
      }
    }

    // Line right before DOB line is often the person's name on Aadhaar & DL
    if (/DOB|Date of Birth|D\.O\.B/i.test(line) && i > 0) {
      const prev = lines[i - 1];
      if (/^[A-Za-z\s]{3,35}$/.test(prev) && !/government|india|male|female|licence|driving|aadhaar/i.test(prev)) {
        return prev;
      }
    }
  }

  return null;
}

/**
 * Run Real OCR on Image Buffer using Tesseract Worker
 */
export async function performRealTesseractOcr(
  imageBuffer: Buffer,
  documentTypeHint: "aadhaar" | "license" | "aadhaar-back"
): Promise<RealOcrResult> {
  let worker: any = null;
  try {
    worker = await createWorker("eng");
    const { data } = await worker.recognize(imageBuffer);
    const rawText = cleanOcrText(data.text || "");
    const confidence = Math.round(data.confidence || 0);

    let docNumber: string | null = null;
    let detectedType: "aadhaar" | "license" | "aadhaar-back" | "unknown" = documentTypeHint;

    if (documentTypeHint === "license") {
      docNumber = extractDrivingLicenseNumber(rawText);
      if (!docNumber) {
        // Check if user uploaded Aadhaar instead of DL
        const maybeAadhaar = extractAadhaarNumber(rawText);
        if (maybeAadhaar) {
          docNumber = maybeAadhaar;
          detectedType = "aadhaar";
        }
      }
    } else if (documentTypeHint === "aadhaar") {
      docNumber = extractAadhaarNumber(rawText);
      if (!docNumber) {
        // Check if user uploaded DL instead of Aadhaar
        const maybeDl = extractDrivingLicenseNumber(rawText);
        if (maybeDl) {
          docNumber = maybeDl;
          detectedType = "license";
        }
      }
    } else if (documentTypeHint === "aadhaar-back") {
      // Aadhaar back contains address & PIN code
      docNumber = "BACK_VERIFIED";
    }

    const fullName = extractName(rawText);
    const dob = extractDob(rawText);

    if (!docNumber && documentTypeHint !== "aadhaar-back") {
      return {
        success: false,
        documentType: "unknown",
        documentNumber: null,
        fullName,
        dob,
        expiryDate: null,
        rawText,
        confidence,
        errorMessage: `Could not clearly detect ${
          documentTypeHint === "license" ? "Driving License" : "Aadhaar Card"
        } number from the uploaded image. Please ensure photo is well-lit and clear, or type number manually below.`,
      };
    }

    return {
      success: true,
      documentType: detectedType,
      documentNumber: docNumber,
      fullName,
      dob,
      expiryDate: null,
      rawText,
      confidence,
    };
  } catch (err: any) {
    console.error("[Tesseract OCR Error]:", err);
    return {
      success: false,
      documentType: "unknown",
      documentNumber: null,
      fullName: null,
      dob: null,
      expiryDate: null,
      rawText: "",
      confidence: 0,
      errorMessage: err.message || "OCR engine failed to parse image.",
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
  }
}
