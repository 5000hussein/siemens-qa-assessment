import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers read untyped JSON data files
export function readJsonFile(filePath: string): any {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
}

export function readJsonValue(filePath: string, keyPath: string): string {
  let result = readJsonFile(filePath);
  for (const key of keyPath.split('.')) {
    if (result === null || typeof result !== 'object' || !(key in result)) {
      throw new Error(`Key "${keyPath}" not found in ${filePath} (missing at "${key}")`);
    }
    result = result[key];
  }
  return String(result);
}
