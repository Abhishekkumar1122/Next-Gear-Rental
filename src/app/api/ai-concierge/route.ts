import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCityWeather } from "@/lib/weather-service";

export const dynamic = "force-dynamic";

const KNOWN_CITIES = [
  "manali", "goa", "delhi", "mumbai", "bengaluru", "bangalore", 
  "shimla", "leh", "srinagar", "jaipur", "udaipur", "rishikesh", 
  "dehradun", "pune", "hyderabad", "chennai", "kolkata", "noida", "gurugram", "gurgaon"
];

function extractCity(query: string): string | null {
  const lower = query.toLowerCase();
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city)) {
      if (city === "bangalore") return "bengaluru";
      if (city === "gurgaon") return "gurugram";
      return city;
    }
  }
  return null;
}

function extractVehicleType(query: string): string | null {
  const lower = query.toLowerCase();
  if (lower.includes("bike") || lower.includes("motorcycle") || lower.includes("bullet") || lower.includes("enfield") || lower.includes("himalayan")) {
    return "bike";
  }
  if (lower.includes("car") || lower.includes("suv") || lower.includes("sedan") || lower.includes("thar") || lower.includes("automatic")) {
    return "car";
  }
  if (lower.includes("scooty") || lower.includes("scooter") || lower.includes("activa") || lower.includes("jupiter")) {
    return "scooty";
  }
  return null;
}

function extractMaxPrice(query: string): number | null {
  const match = query.match(/(?:under|below|budget|less than|within|₹|inr)\s*(\d{3,5})/i) || query.match(/(\d{3,5})\s*(?:rs|rupees|inr|₹)?/i);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (val >= 300 && val <= 25000) return val;
  }
  return null;
}

// Call Google Gemini API with Strict Next Gear Scope & Knowledge Context
async function generateWithGemini(userPrompt: string, contextData: { city: string | null; weather: unknown; vehicles: unknown[] }): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
  ];

  const systemPrompt = `You are NextGo AI, the official AI representative for Next Gear Rentals (India's premier self-drive car & bike rental platform).

STRICT OPERATIONAL GUARDRAILS:
1. EXCLUSIVE SCOPE: You MUST ONLY answer questions related to Next Gear Rentals, vehicle bookings (bikes, cars, scooties), destination weather/snowfall advisories for Indian travel cities (Goa, Manali, Delhi, Mumbai, Leh, etc.), rental policies, required documents, security deposits, NRI rules, and Next Gear website features.
2. OUT-OF-SCOPE REDIRECT: If the user asks about completely unrelated topics (e.g., general trivia, programming, politics, movies, science, or outside companies), politely decline and say:
   "I am NextGo AI, dedicated exclusively to Next Gear Rentals & trip planning. How can I assist you with vehicle bookings, weather advisories, or rental rules today?"
3. TONE & FORMATTING: Be professional, warm, concise, and helpful. Use clean Markdown with bullet points and emojis.

NEXT GEAR OFFICIAL KNOWLEDGE BASE:
- Founder & CEO: Abhishek Kumar (Born 20th October 2002 in Aurangabad, Bihar | Alumnus of Lovely Professional University, LPU Punjab). Founded Next Gear Rentals in 2022.
- Required Documents: Original Driving License + Original Aadhaar Card or Passport.
- Security Deposit: ₹0 deposit on select rides. Standard deposit is ₹1,000 to ₹3,000 (100% refundable on return).
- Cancellation Policy: 100% Free Cancellation up to 24 hours prior to booking start. 50% refund for cancellations within 24 hours.
- NRI / International Drivers: International Driving Permit (IDP) + Home Country DL + Passport.
- Age Limits: Minimum 18+ for two-wheelers, 21+ for self-drive cars.

LIVE DATABASE CONTEXT:
- User Prompt: "${userPrompt}"
- Target City: ${contextData.city || "Not specified"}
- Real-time Destination Weather & Snowfall: ${JSON.stringify(contextData.weather || "None")}
- Database Fleet Found: ${JSON.stringify(contextData.vehicles || [])}`;

  for (const modelName of modelsToTry) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 450 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return generatedText;
        }
      }
    } catch {
      // Try next model if API call fails
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessage = (body.message || "").trim();
    const defaultCity = body.city || "Delhi";

    if (!rawMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const cleanText = rawMessage.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
    const detectedCity = extractCity(rawMessage);
    const capitalizedCity = detectedCity ? (detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1)) : null;
    const vehicleType = extractVehicleType(rawMessage);
    const maxPrice = extractMaxPrice(rawMessage);

    // Weather / Snowfall intent
    const isWeatherQuery = /\b(weather|wether|weathr|weater|climate|climat|temp|temperature|rain|rainy|snow|snowfall|snaow|snaowfall|snowing|ice|icy|aqi|forecast|chances|status|report)\b/i.test(cleanText);

    // Policy & Documents intent
    const isPolicyQuery = /\b(policy|policies|rule|rules|terms|deposit|cancel|cancellation|document|documents|license|nri|age|insurance|security)\b/i.test(cleanText);

    // Greeting intent
    const isGreetingQuery = /\b(hi|hy|hello|hey|namaste|hie|yo|hola)\b/i.test(cleanText);

    // Vehicle query intent
    const isExplicitVehicleQuery = vehicleType !== null || maxPrice !== null || /\b(rent|book|ride|fleet|car|bike|scooty|motorcycle|scooter|thar|bullet|enfield)\b/i.test(cleanText);

    // Completely out-of-scope check for local fallback
    const isOutOfScope = /\b(code|python|java|math|physics|chemistry|politics|movie|song|recipe|president|capital of|who is|joke|essay)\b/i.test(cleanText) && !isExplicitVehicleQuery && !isWeatherQuery && !isPolicyQuery && !detectedCity;

    // Target City for weather lookup
    const targetCityForWeather = capitalizedCity || defaultCity;
    const weatherData = (isWeatherQuery || isExplicitVehicleQuery || detectedCity)
      ? await getCityWeather(targetCityForWeather).catch(() => null)
      : null;

    // Fetch Database Vehicles
     
    let vehicles: any[] = [];
    if (isExplicitVehicleQuery || detectedCity) {
       
      const whereClause: any = {};
      if (capitalizedCity) {
        whereClause.city = { name: { contains: capitalizedCity, mode: "insensitive" } };
      }
      if (vehicleType) {
        whereClause.type = { equals: vehicleType, mode: "insensitive" };
      }
      if (maxPrice) {
        whereClause.pricePerDayINR = { lte: maxPrice };
      }

      vehicles = await prisma.vehicle.findMany({
        where: whereClause,
        include: { city: true },
        take: 4,
        orderBy: { pricePerDayINR: "asc" },
      });
    }

    const vehicleSummary = vehicles.map((v) => ({
      id: v.id,
      title: v.title,
      type: v.type,
      city: v.city.name,
      pricePerDayINR: v.pricePerDayINR,
      transmission: v.transmission,
      fuel: v.fuel,
      imageUrl: v.imageUrl,
    }));

    // Generate response with Google Gemini
    const geminiText = await generateWithGemini(rawMessage, {
      city: capitalizedCity,
      weather: weatherData,
      vehicles: vehicleSummary,
    });

    // Local Fallback Generator adhering strictly to Next Gear scope
    let aiResponseText = geminiText || "";

    if (!aiResponseText) {
      if (cleanText.includes("founder") || cleanText.includes("abhishek") || cleanText.includes("who created") || cleanText.includes("who started") || cleanText.includes("owner") || cleanText.includes("ceo")) {
        aiResponseText = `👨‍💼 **Founder & CEO Profile — Next Gear Rentals**:\n\n` +
          `• **Name**: **Abhishek Kumar**\n` +
          `• **Role**: Founder & Chief Executive Officer\n` +
          `• **Date of Birth**: October 20, 2002 (Born in Aurangabad, Bihar)\n` +
          `• **Education**: **Lovely Professional University (LPU), Punjab**\n` +
          `• **Background**: Founded Next Gear Rentals in 2022 to revolutionize India's self-drive rental ecosystem with zero-deposit bookings, verified fleets, and doorstep airport delivery across Delhi, Goa, Manali, Mumbai, and Bangalore.`;
      } else if (isOutOfScope) {
        aiResponseText = "I am **NextGo AI**, dedicated exclusively to Next Gear Rentals & trip planning. How can I assist you with vehicle bookings, weather advisories, or rental rules today?";
      } else if (isGreetingQuery) {
        aiResponseText = "Hey there! 👋 Welcome to **NextGo AI**. How can I assist with your vehicle rental, trip planning, weather updates, or booking policies today?\n\nYou can ask me things like:\n• *'Manali snowfall chances'* \n• *'What is Next Gear cancellation policy?'*\n• *'Bikes in Goa under ₹1500'*";
      } else if (isPolicyQuery) {
        aiResponseText = `📋 **Next Gear Rental Policies & Requirements**:\n\n` +
          `• 📄 **Required Documents**: Valid Original Driving License + Original Aadhaar Card / Passport for identity verification.\n` +
          `• 💰 **Security Deposit**: ₹0 Deposit available on select rides. Standard deposit is ₹1,000–₹3,000, 100% refundable upon vehicle return.\n` +
          `• 🛑 **Cancellation Policy**: **100% Free Cancellation** up to 24 hours before trip start. 50% refund for cancellations within 24 hours.\n` +
          `• 🌍 **NRI / International Drivers**: Valid International Driving Permit (IDP) + Home License + Passport.\n` +
          `• 🔞 **Age Limit**: Minimum 18+ for two-wheelers, 21+ for self-drive cars.`;
      } else if (isWeatherQuery || detectedCity) {
        const cityObj = weatherData || await getCityWeather(capitalizedCity || defaultCity).catch(() => null);
        if (cityObj) {
          const isMountainCity = ["Manali", "Shimla", "Leh", "Srinagar", "Dehradun", "Rishikesh"].includes(cityObj.cityName);
          
          let snowfallLine = "";
          if (cityObj.isSnowing || cityObj.snowfallCm > 0) {
            snowfallLine = `• ❄️ **Snowfall Status**: 🚨 **Active Snowfall (${cityObj.snowfallCm} cm recorded)**! Slippery roads near high mountain passes.\n`;
          } else if (isMountainCity || cleanText.includes("snow") || cleanText.includes("snaow")) {
            if (cityObj.temperatureC <= 10) {
              snowfallLine = `• ❄️ **Snowfall Chances**: 🏔️ **Moderate to High Chances** in upper passes (Solang Valley / Rohtang). Base town temp is ${cityObj.temperatureC}°C.\n`;
            } else {
              snowfallLine = `• ❄️ **Snowfall Chances**: ☀️ **No Snowfall Currently (0 cm)** — Current temp is ${cityObj.temperatureC}°C. Peak snowfall occurs during winter (Dec–Feb).\n`;
            }
          }

          aiResponseText = `🌤️ **Live Weather & Snowfall Report for ${cityObj.cityName}**:\n\n` +
            `• **Temperature**: ${cityObj.temperatureC}°C (${cityObj.condition})\n` +
            snowfallLine +
            `• **AQI Air Quality**: ${cityObj.aqiValue} (${cityObj.aqiStatus})\n` +
            `• **Riding Status**: **${cityObj.ridingSuitability}**\n` +
            `• **Safety Advice**: ${cityObj.ridingAdvice}`;

          if (vehicles.length > 0) {
            aiResponseText += `\n\n🏎️ Top rides available in ${cityObj.cityName}:`;
          }
        } else {
          aiResponseText = `🌤️ Current weather in **${capitalizedCity || defaultCity}** is clear and suitable for driving!`;
        }
      } else if (vehicles.length > 0) {
        const typeLabel = vehicleType ? `${vehicleType}s` : "vehicles";
        const budgetLabel = maxPrice ? ` under ₹${maxPrice}` : "";
        aiResponseText = `🤖 **NextGo AI** found **${vehicles.length} ${typeLabel}** in **${capitalizedCity || "our fleet"}**${budgetLabel}! Select a ride below to book instantly:`;
      } else {
        aiResponseText = `I am **NextGo AI**. Ask me anything about Next Gear vehicle rentals, city weather reports, riding advisories, or booking rules!`;
      }
    }

    return NextResponse.json({
      reply: aiResponseText,
      poweredBy: geminiText ? "Google Gemini AI" : "NextGo AI Precision Engine",
      weather: (isWeatherQuery || detectedCity) ? (weatherData ? {
        cityName: weatherData.cityName,
        tempC: weatherData.temperatureC,
        condition: weatherData.condition,
        icon: weatherData.conditionIcon,
        isSnowing: weatherData.isSnowing,
        snowfallCm: weatherData.snowfallCm,
        aqiStatus: weatherData.aqiStatus,
        aqiValue: weatherData.aqiValue,
        ridingAdvice: weatherData.ridingAdvice,
        suitability: weatherData.ridingSuitability,
      } : null) : null,
      vehicles: vehicleSummary,
      detectedCity: capitalizedCity || defaultCity,
    });
  } catch (error) {
    console.error("AI Concierge API error:", error);
    return NextResponse.json({ error: "Failed to process AI query" }, { status: 500 });
  }
}
