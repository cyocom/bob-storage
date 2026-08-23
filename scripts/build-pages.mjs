import { cpSync, mkdirSync, rmSync } from "node:fs";

const outDir = "dist";
const files = ["index.html", "styles.css", "inventory.js", "inventory.json"];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of files) {
  cpSync(file, `${outDir}/${file}`);
}

cpSync("assets", `${outDir}/assets`, { recursive: true });

console.log(`Built ${outDir}/ for Cloudflare Pages`);
