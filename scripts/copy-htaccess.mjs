import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const outputDir = join(rootDir, "out");
const sourceFile = join(rootDir, ".htaccess");
const targetFile = join(outputDir, ".htaccess");

if (!existsSync(sourceFile)) {
  console.warn(".htaccess not found in project root; skipping copy.");
  process.exit(0);
}

if (!existsSync(outputDir)) {
  console.error("Static export folder 'out' not found. Run the build first.");
  process.exit(1);
}

copyFileSync(sourceFile, targetFile);
console.log("Copied .htaccess to out/.htaccess");
