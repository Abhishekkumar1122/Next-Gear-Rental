/**
 * Calculates the portion of the total booking price that the customer
 * must pay online during checkout. The rest is collected at pickup.
 */
export function calculateBookingAmount(totalAmount: number): number {
  if (totalAmount < 400) {
    return totalAmount;
  }
  if (totalAmount >= 400 && totalAmount <= 699) {
    return 250;
  }
  if (totalAmount >= 700 && totalAmount <= 1499) {
    return 399;
  }
  if (totalAmount >= 1500 && totalAmount <= 3000) {
    return 750;
  }
  return 999;
}

/**
 * Formats raw database IDs into user-friendly Next Gear booking references.
 */
export function formatBookingId(id: string, city?: string, dateStr?: string | Date): string {
  if (!id) return "";

  // If already formatted in NG-STATE-DATE format (e.g. NG-UP-23072615), keep it
  if (id.startsWith("NG-") && (id.match(/-/g) || []).length >= 2) {
    return id;
  }

  // Resolve state abbreviation dynamically based on city / state across Pan-India
  let stateCode = "DL"; // Default to Delhi
  if (city) {
    const c = city.toLowerCase();
    if (c.includes("delhi") || c.includes("new delhi") || c.includes("dl")) stateCode = "DL";
    else if (c.includes("noida") || c.includes("greater noida") || c.includes("ghaziabad") || c.includes("lucknow") || c.includes("kanpur") || c.includes("varanasi") || c.includes("agra") || c.includes("uttar pradesh") || c.includes("up")) stateCode = "UP";
    else if (c.includes("mumbai") || c.includes("pune") || c.includes("nagpur") || c.includes("nashik") || c.includes("thane") || c.includes("maharashtra") || c.includes("mh")) stateCode = "MH";
    else if (c.includes("bengaluru") || c.includes("bangalore") || c.includes("mysore") || c.includes("mangalore") || c.includes("karnataka") || c.includes("ka")) stateCode = "KA";
    else if (c.includes("gurgaon") || c.includes("gurugram") || c.includes("faridabad") || c.includes("panipat") || c.includes("haryana") || c.includes("hr")) stateCode = "HR";
    else if (c.includes("chandigarh") || c.includes("punjab") || c.includes("amritsar") || c.includes("ludhiana") || c.includes("jalandhar") || c.includes("pb")) stateCode = "PB";
    else if (c.includes("jaipur") || c.includes("udaipur") || c.includes("jodhpur") || c.includes("kota") || c.includes("rajasthan") || c.includes("rj")) stateCode = "RJ";
    else if (c.includes("hyderabad") || c.includes("secunderabad") || c.includes("telangana") || c.includes("ts") || c.includes("tg")) stateCode = "TS";
    else if (c.includes("chennai") || c.includes("coimbatore") || c.includes("madurai") || c.includes("tamil nadu") || c.includes("tn")) stateCode = "TN";
    else if (c.includes("kolkata") || c.includes("howrah") || c.includes("siliguri") || c.includes("west bengal") || c.includes("wb")) stateCode = "WB";
    else if (c.includes("goa") || c.includes("panaji") || c.includes("margao") || c.includes("ga")) stateCode = "GA";
    else if (c.includes("ahmedabad") || c.includes("surat") || c.includes("vadodara") || c.includes("rajkot") || c.includes("gujarat") || c.includes("gj")) stateCode = "GJ";
    else if (c.includes("bhopal") || c.includes("indore") || c.includes("gwalior") || c.includes("madhya pradesh") || c.includes("mp")) stateCode = "MP";
    else if (c.includes("patna") || c.includes("gaya") || c.includes("muzaffarpur") || c.includes("bihar") || c.includes("br")) stateCode = "BR";
    else if (c.includes("ranchi") || c.includes("jamshedpur") || c.includes("dhanbad") || c.includes("jharkhand") || c.includes("jh")) stateCode = "JH";
    else if (c.includes("dehradun") || c.includes("rishikesh") || c.includes("haridwar") || c.includes("uttarakhand") || c.includes("uk")) stateCode = "UK";
    else if (c.includes("shimla") || c.includes("manali") || c.includes("dharamshala") || c.includes("himachal") || c.includes("hp")) stateCode = "HP";
    else if (c.includes("kochi") || c.includes("thiruvananthapuram") || c.includes("calicut") || c.includes("kerala") || c.includes("kl")) stateCode = "KL";
    else if (c.includes("guwahati") || c.includes("assam") || c.includes("as")) stateCode = "AS";
    else if (c.includes("bhubaneswar") || c.includes("cuttack") || c.includes("puri") || c.includes("odisha") || c.includes("or") || c.includes("od")) stateCode = "OD";
    else if (c.includes("srinagar") || c.includes("jammu") || c.includes("jk")) stateCode = "JK";
  }

  // Resolve date format (DDMMYY)
  let dateCode = "230726";
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  if (dateObj && !isNaN(dateObj.getTime())) {
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);
    dateCode = `${dd}${mm}${yy}`;
  }

  // Resolve 2-digit sequential number from CUID
  const cleanId = id.startsWith("NG-") ? id.replace("NG-", "") : id;
  let sum = 0;
  for (let i = 0; i < cleanId.length; i++) {
    sum += cleanId.charCodeAt(i);
  }
  const seqNum = String((sum % 89) + 10).padStart(2, "0");

  return `NG-${stateCode}-${dateCode}${seqNum}`;
}
