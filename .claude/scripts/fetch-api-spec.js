// Refreshes the EventHub OpenAPI spec in the Claude domain cache (.claude/domain/openapi.json).
// The Swagger UI does not serve a raw JSON file; the spec is embedded in swagger-ui-init.js, so it is extracted from there.
// Usage: npm run api:spec
const fs = require('fs');
const path = require('path');

const INIT_URL = 'https://api.eventhub.rahulshettyacademy.com/api/docs/swagger-ui-init.js';
const SPEC_FILE = path.join(__dirname, '..', 'domain', 'openapi.json');

function extractSwaggerDoc(source) {
  const start = source.indexOf('{', source.indexOf('"swaggerDoc"'));
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return JSON.parse(source.slice(start, i + 1));
  }
  throw new Error('swaggerDoc not found in swagger-ui-init.js');
}

(async () => {
  const response = await fetch(INIT_URL);
  if (!response.ok) throw new Error(`GET ${INIT_URL} failed: ${response.status}`);
  const spec = extractSwaggerDoc(await response.text());
  fs.mkdirSync(path.dirname(SPEC_FILE), { recursive: true });
  fs.writeFileSync(SPEC_FILE, JSON.stringify(spec, null, 2) + '\n');

  console.log(`Saved ${Object.keys(spec.paths).length} paths to ${path.relative(process.cwd(), SPEC_FILE)}`);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
