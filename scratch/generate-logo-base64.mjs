import fs from "fs";
import path from "path";

const logoPath = path.resolve("./public/Logo1.png");
const buffer = fs.readFileSync(logoPath);
const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

const code = `// Base64 encoded Next Gear Logo for PDF and Email Templates (Zero external dependency)
export const NEXT_GEAR_LOGO_BASE64 = "${base64}";
`;

fs.writeFileSync("./src/lib/logo-base64.ts", code);
console.log("Logo base64 saved to src/lib/logo-base64.ts successfully!");
