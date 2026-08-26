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
Analyze the provided document image and extract all identifiable structured details.

Target Indian Document Types:
1. Aadhaar Card (12-digit UID)
2. PAN Card (10-character alphanumeric, format: ABCDE1234F)
3. Driving License (State DL Number, Validity, Vehicle Category: MCWG, LMV)
4. Vehicle RC Book / Smart Card (Registration No, Chassis No, Engine No, Owner Name)
5. Shop / Fleet Garage Premises Photo (Business name on signboard, GPS context)
6. Insurance Certificate / Policy (Policy No, Expiry, Insured Name)
7. Passport (Passport Number, Nationality, Expiry)

Output MUST be strictly valid JSON without markdown fences matching this exact schema:
{
  "documentType": "aadhaar" | "pan" | "license" | "passport" | "vehicle_rc" | "shop_photo" | "insurance" | "other",
  "fullName": "Extracted Name or null",
  "documentNumber": "Clean alphanumeric ID number or null",
  "dob": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "fatherName": "Extracted Father/Spouse Name or null",
  "address": "Extracted Address or null",
  "state": "State name or null",
  "vehicleNumber": "Vehicle Registration Number like DL01AB1234 or null",
  "confidenceScore": 95,
  "isLegitimateDoc": true,
  "notes": "Brief 1-sentence verification note (e.g. Valid Indian PAN Card of Rahul Sharma)"
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
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
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
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
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
