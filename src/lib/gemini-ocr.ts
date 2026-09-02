export interface OcrExtractedData {
  documentType: "aadhaar" | "aadhaar-back" | "pan" | "license" | "passport" | "vehicle_rc" | "shop_photo" | "insurance" | "other";
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
  rejectionReason?: string | null;
  notes: string;
  rawTextPreview?: string;
}

const OCR_SYSTEM_PROMPT = `You are a strict Government ID Verification & OCR Engine for Next Gear Rentals India.
Analyze the provided document image with forensic precision.

STRICT CLASSIFICATION RULES:
1. "license" (Driving License):
   - Must be an official Indian Driving License (DL), Smart Card DL, or International Driving Permit (IDP).
   - Must show official emblems (Ashoka Pillar, State Transport Department, Union of India).
   - Must contain a valid Driving License Number (e.g. DL1420110012345, MH12 20180054321, UP3220200001234, KA05 20190001234).
   - Must show validity dates and vehicle class (e.g. MCWG, LMV).
   - If this is a valid Driving License, set "documentType": "license", "isLegitimateDoc": true, and extract the DL number.

2. "aadhaar" (Aadhaar Card - FRONT Side):
   - Must be the FRONT side of an Indian Aadhaar Card.
   - Must show "Government of India" / "Unique Identification Authority of India" / "भारत सरकार" / "आधार".
   - Must contain a 12-digit Aadhaar UID number (e.g. "1234 5678 9012" or masked "XXXX XXXX 1234").
   - Must show the person's photograph, English Name, and DOB / Year of Birth.
   - If this is an Aadhaar Front, set "documentType": "aadhaar", "isLegitimateDoc": true, and extract the 12-digit number.

3. "aadhaar-back" (Aadhaar Card - BACK Side):
   - Must be the BACK side of an Indian Aadhaar Card.
   - Must contain the residential Address (पता), QR/Barcode, or UIDAI 1947 helpline text.
   - If this is an Aadhaar Back, set "documentType": "aadhaar-back", "isLegitimateDoc": true.

4. "passport" (Passport):
   - Must show Republic of India / Foreign Passport details, MRZ lines, Passport number.
   - Set "documentType": "passport", "isLegitimateDoc": true.

5. "other" (REJECT - FAKE / IRRELEVANT / RANDOM PHOTO):
   - If the image is a selfie, animal, random person photo, car/bike photo, scenery, payment screenshot, utility bill, restaurant menu, blank paper, meme, or anything that is NOT an authentic Driving License, Aadhaar, or Passport:
   - You MUST set "documentType": "other", "isLegitimateDoc": false, and provide a clear "rejectionReason".

Output MUST be strictly valid JSON without markdown fences matching this exact schema:
{
  "documentType": "aadhaar" | "aadhaar-back" | "license" | "passport" | "pan" | "vehicle_rc" | "insurance" | "other",
  "fullName": "Extracted English Name or null",
  "documentNumber": "Extracted ID / DL / UID Number or null",
  "dob": "DD/MM/YYYY or YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "fatherName": "Extracted Father/Spouse Name or null",
  "address": "Extracted Address or null",
  "state": "State name or null",
  "confidenceScore": 95,
  "isLegitimateDoc": true,
  "rejectionReason": null,
  "notes": "Brief 1-sentence note"
}`;

/**
 * Perform Multimodal Vision OCR via Google Gemini 2.5 Flash / 2.0 Flash
 */
export async function performGeminiOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrExtractedData> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini OCR] No GEMINI_API_KEY configured.");
    return generateFallbackOcrData(mimeType, "API key not configured");
  }

  const base64Data = imageBuffer.toString("base64");
  const preferredModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const modelsToTry = [
    preferredModel,
    "gemini-3.6-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter((v, i, a) => a.indexOf(v) === i);

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
        isLegitimateDoc: Boolean(parsed.isLegitimateDoc),
        rejectionReason: parsed.rejectionReason || null,
        notes: parsed.notes || "Verified via Gemini Vision Engine",
      };
    } catch (err) {
      console.warn(`[Gemini OCR] Error with model ${model}:`, err);
    }
  }

  return generateFallbackOcrData(mimeType, "Document could not be recognized by AI vision scanner");
}

function generateFallbackOcrData(mimeType: string, reason?: string): OcrExtractedData {
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
    confidenceScore: 0,
    isLegitimateDoc: false,
    rejectionReason: reason || "Unable to read document. Please upload a clear photo of your official ID.",
    notes: reason || "Unrecognized document",
  };
}
