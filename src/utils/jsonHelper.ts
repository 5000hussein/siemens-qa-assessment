import * as fs from 'fs';
import * as path from 'path';

export function readJsonFile(filePath: string): any {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
}

// Returns whatever is at the key: an object (e.g. a request body), a number or a string
export function readJsonObject(filePath: string, keyPath: string): any {
  let result = readJsonFile(filePath);
  for (const key of keyPath.split('.')) {
    if (result === null || typeof result !== 'object' || !(key in result)) {
      throw new Error(`Key "${keyPath}" not found in ${filePath} (missing at "${key}")`);
    }
    result = result[key];
  }
  return result;
}

export function readJsonValue(filePath: string, keyPath: string): string {
  return String(readJsonObject(filePath, keyPath));
}
