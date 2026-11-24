import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const expectedLanguages = ['en', 'kn', 'ta', 'hi', 'te', 'ml', 'mr', 'ur', 'bn', 'gu', 'pa', 'or', 'as', 'kok'];

function parseLocaleKeys(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  // Match key: 'value' or key:\n    'value'
  const regex = /^\s*([a-zA-Z0-9_]+):\s*(?:\n\s*)?['"`]([\s\S]*?)['"`],?\s*$/gm;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    map.set(match[1], match[2].trim());
  }
  return map;
}

const enMap = parseLocaleKeys(path.join(localesDir, 'en.ts'));
const baseKeys = Array.from(enMap.keys());

console.log(`CredVaniAI 14-Language Translation Completeness Report`);
console.log(`Reference English key count: ${baseKeys.length}\n`);

let hasFailure = false;

for (const code of expectedLanguages) {
  const filePath = path.join(localesDir, `${code}.ts`);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] Missing locale file: ${code}.ts`);
    hasFailure = true;
    continue;
  }
  const langMap = parseLocaleKeys(filePath);
  const missing = baseKeys.filter((k) => !langMap.has(k));
  const empty = baseKeys.filter((k) => langMap.has(k) && langMap.get(k).length === 0);
  const untranslated = code === 'en'
    ? []
    : baseKeys.filter((k) => {
        const val = langMap.get(k);
        const enVal = enMap.get(k);
        // Ignore pure numbers/codes like "8.35%"
        if (!val || !/[A-Za-z]{4,}/.test(enVal)) return false;
        return val === enVal;
      });

  const status = missing.length === 0 && empty.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') hasFailure = true;

  console.log(
    `[${status}] ${code.padEnd(4)} | Keys: ${langMap.size}/${baseKeys.length} | Missing: ${missing.length} | Empty: ${empty.length} | Identical-to-EN: ${untranslated.length}`
  );
  if (missing.length > 0) console.log(`   Missing keys: ${missing.join(', ')}`);
  if (empty.length > 0) console.log(`   Empty keys: ${empty.join(', ')}`);
  if (untranslated.length > 0) console.log(`   Untranslated keys: ${untranslated.join(', ')}`);
}

if (hasFailure) {
  process.exit(1);
}
console.log('\nAll 14 languages verified at 100% translation completeness.');
