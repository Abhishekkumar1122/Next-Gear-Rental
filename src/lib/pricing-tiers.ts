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

  // Resolve state abbreviation based on city
  let stateCode = "DL"; // Default to Delhi
  if (city) {
    const c = city.toLowerCase();
    if (c.includes("noida") || c.includes("uttar pradesh") || c.includes("up")) stateCode = "UP";
    else if (c.includes("mumbai") || c.includes("maharashtra") || c.includes("mh")) stateCode = "MH";
    else if (c.includes("bengaluru") || c.includes("bangalore") || c.includes("karnataka") || c.includes("ka")) stateCode = "KA";
    else if (c.includes("gurgaon") || c.includes("haryana") || c.includes("hr")) stateCode = "HR";
    else if (c.includes("punjab") || c.includes("pb")) stateCode = "PB";
    else if (c.includes("delhi")) stateCode = "DL";
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
