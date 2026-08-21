const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "../public/Logo1.png");
const buffer = fs.readFileSync(logoPath);
const base64 = "data:image/png;base64," + buffer.toString("base64");

const outContent = "export const NEXT_GEAR_LOGO_BASE64 = `" + base64 + "`;\n";
const outPath = path.join(__dirname, "../src/lib/logo-base64.ts");

fs.writeFileSync(outPath, outContent);
console.log("Successfully generated src/lib/logo-base64.ts");
