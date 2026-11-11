import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers read untyped JSON data files
export function readJsonFile<T = any>(filePath: string): T {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf-8')) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers read untyped JSON data files
export function readJsonObject<T = any>(filePath: string, keyPath: string): T {
  let result = readJsonFile(filePath);
  for (const key of keyPath.split('.')) {
    if (result === null || typeof result !== 'object' || !(key in result)) {
      throw new Error(`Key "${keyPath}" not found in ${filePath} (missing at "${key}")`);
    }
    result = result[key];
  }
  return result as T;
}

export function readJsonValue(filePath: string, keyPath: string): string {
  return String(readJsonObject(filePath, keyPath));
}

export function writeJsonFile(filePath: string, data: unknown): void {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2), 'utf-8');
}
