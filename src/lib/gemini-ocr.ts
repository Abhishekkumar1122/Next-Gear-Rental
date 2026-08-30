import { isVideoUrl } from "@/lib/vendor-fleet-media";

export interface OcrExtractedData {
  documentType: "aadhaar" | "pan" | "license" | "passport" | "vehicle_rc" | "shop_photo" | "insurance" | "other";
  fullName: string | null;
  documentNumber: string | null;
  dob: string | null; // YYYY-MM-DD
  expiryDate: string | null; // YYYY-MM-DD
  fatherName: string | null;
  address: string | null;
  state: string | null;
  vehicleNumber: string | null;
  confidenceScore: number; // 0 to 100
  isLegitimateDoc: boolean;
  notes: string;
  rawTextPreview?: string;
}

const OCR_SYSTEM_PROMPT = `You are a high-precision Government ID & Automotive Document OCR Verification Engine for Next Gear Rentals India.
Analyze the provided document image carefully and extract all identifiable structured details.

MULTI-LINGUAL & PAN-INDIA SCRIPT CAPABILITY:
- You support ALL 22 official Indian languages & regional scripts:
  Hindi (हिन्दी/देवनागरी), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), 
  Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ/ਗੁਰਮੁਖੀ), Odia (ଓଡ଼ିଆ), 
  Urdu (اردو), Assamese (অসমীয়া), and English.
- BILINGUAL ID RULE: Most Indian IDs (Aadhaar/DL) have name printed in both regional language AND English. ALWAYS extract the English Full Name (e.g., "K Vijay Bhaskar Reddy", "Abhishek Kumar", "Suresh Patel").
- MONOLINGUAL REGIONAL ID RULE: If an ID only has regional text, accurately read the regional script and transliterate the full name into standard English/Latin characters.
- MULTI-LINGUAL DATE PARSING: Understand DOB in all regional labels, e.g.:
  - Telugu: "పుట్టిన తేదీ / DOB"
  - Hindi: "जन्म तिथि / जन्म वर्ष"
  - Tamil: "பிறந்த தேதி / DOB"
  - Kannada: "ಹುಟ್ಟಿದ ದಿನಾಂಕ"
  - Malayalam: "ജനന തീയതി"
  - Bengali: "জন্ম তারিখ"
  - Gujarati: "જન્મ તારીખ"
  - Marathi: "जन्म तारीख"

CRITICAL EXTRACTION RULES FOR ALL SUPPORTED DOCUMENTS:
1. Aadhaar Card (Indian Citizen):
   - Extract the 12-digit UID number (e.g., "1234 5678 9012" or masked "XXXX XXXX 1234").
   - Extract the Full Name in English. Never return null if a name is visible in any script.
   - Extract Date of Birth (DOB) (e.g. "01/07/1987" or "YYYY-MM-DD").
   - Set "documentType": "aadhaar" and "documentNumber" to the Aadhaar number.

2. Driving License (DL / IDP / Foreign License):
   - Extract the DL number (e.g., "DL1420110012345", "MH12 20180054321", or International Driving Permit number).
   - Extract the holder's Full Name and DOB.
   - Set "documentType": "license" and "documentNumber" to the DL number.

3. Passport (NRI / International Travelers & Foreign Tourists):
   - Extract Passport Number (e.g., "Z1234567", "A2345678", "N12345678", etc.).
   - Extract Full Name, Nationality, DOB, and Expiry Date.
   - Set "documentType": "passport" and "documentNumber" to the Passport Number.

4. PAN Card (Vendor & Customer Tax ID):
   - Extract 10-character alphanumeric PAN (format: ABCDE1234F).
   - Extract Full Name and DOB.
   - Set "documentType": "pan" and "documentNumber" to the PAN number.

5. Vehicle RC Book / Smart Card / Insurance (Fleet Manager):
   - Extract Vehicle Registration Number (e.g. "DL01AB1234"), Chassis Number, Engine Number, and Owner Name.
   - Set "documentType": "vehicle_rc" or "insurance" and "documentNumber" to Registration/Policy Number.

Output MUST be strictly valid JSON without markdown fences matching this exact schema:
{
  "documentType": "aadhaar" | "license" | "passport" | "pan" | "vehicle_rc" | "insurance" | "other",
  "fullName": "Extracted English Name or null",
  "documentNumber": "Extracted ID / Passport / DL Number or null",
  "dob": "DD/MM/YYYY or YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "fatherName": "Extracted Father/Spouse Name or null",
  "address": "Extracted Address or null",
  "state": "State or Country name or null",
  "vehicleNumber": "Vehicle Registration Number or null",
  "confidenceScore": 95,
  "isLegitimateDoc": true,
  "notes": "Brief 1-sentence note"
}`;

/**
 * Perform Multimodal Vision OCR via Google Gemini 2.0 Flash / 1.5 Flash
 */
export async function performGeminiOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrExtractedData> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini OCR] No GEMINI_API_KEY configured. Returning heuristic fallback.");
    return generateFallbackOcrData(mimeType);
  }

  const base64Data = imageBuffer.toString("base64");
  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: OCR_SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[Gemini OCR] Model ${model} returned ${res.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      // Clean markdown codeblocks if present
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        documentType: parsed.documentType || "other",
        fullName: parsed.fullName || null,
        documentNumber: parsed.documentNumber ? String(parsed.documentNumber).trim().toUpperCase() : null,
        dob: parsed.dob || null,
        expiryDate: parsed.expiryDate || null,
        fatherName: parsed.fatherName || null,
        address: parsed.address || null,
        state: parsed.state || null,
        vehicleNumber: parsed.vehicleNumber ? String(parsed.vehicleNumber).trim().toUpperCase() : null,
        confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 90,
        isLegitimateDoc: Boolean(parsed.isLegitimateDoc ?? true),
        notes: parsed.notes || "OCR extracted successfully via Gemini AI",
      };
    } catch (err) {
      console.warn(`[Gemini OCR] Error with model ${model}:`, err);
    }
  }

  return generateFallbackOcrData(mimeType);
}

function generateFallbackOcrData(mimeType: string): OcrExtractedData {
  return {
    documentType: "other",
    fullName: null,
    documentNumber: null,
    dob: null,
    expiryDate: null,
    fatherName: null,
    address: null,
    state: null,
    vehicleNumber: null,
    confidenceScore: 70,
    isLegitimateDoc: true,
    notes: `Document received (${mimeType}). Manual verification by admin enabled.`,
  };
}
