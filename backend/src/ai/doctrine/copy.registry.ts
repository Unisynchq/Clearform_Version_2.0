import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Loads respondent copy variants from doctrine/copy/*.md.
 * Thin loader — wording lives in markdown, not TypeScript.
 */

const COPY_FILE = join(__dirname, 'copy', 'quality-messages.md');

type CopyCache = {
  map: Map<string, string[]>;
  version: string;
  mtimeMs: number;
};

let cache: CopyCache | null = null;

export function parseCopyMarkdown(md: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let currentKey: string | null = null;
  for (const rawLine of md.split('\n')) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(\S+)\s*$/);
    if (heading) {
      currentKey = heading[1];
      if (!map.has(currentKey)) map.set(currentKey, []);
      continue;
    }
    if (currentKey && line.startsWith('- ')) {
      const variant = line.slice(2).trim();
      if (variant) map.get(currentKey)!.push(variant);
    }
  }
  return map;
}

function load(): CopyCache {
  let mtimeMs = 0;
  try {
    mtimeMs = existsSync(COPY_FILE) ? statSync(COPY_FILE).mtimeMs : 0;
  } catch {
    mtimeMs = 0;
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache;

  let raw = '';
  try {
    raw = mtimeMs ? readFileSync(COPY_FILE, 'utf8') : '';
  } catch {
    raw = '';
  }
  cache = {
    map: parseCopyMarkdown(raw),
    version: createHash('sha256').update(raw).digest('hex').slice(0, 12),
    mtimeMs,
  };
  return cache;
}

export function copyVersion(): string {
  return load().version;
}

export function normalizeCopy(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashToIndex(seed: string, modulo: number): number {
  if (modulo <= 1) return 0;
  const digest = createHash('sha1').update(seed).digest();
  return digest.readUInt32BE(0) % modulo;
}

function interpolate(text: string, vars?: Record<string, string>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match,
  );
}

export type PickCopyOptions = {
  seed?: string;
  vars?: Record<string, string>;
  exclude?: string[];
  poolSize?: number;
  fallback?: string;
};

export function pickCopy(key: string, opts: PickCopyOptions = {}): string {
  const variants = load().map.get(key);
  if (!variants?.length) {
    return interpolate(
      opts.fallback ?? 'Please improve your answer.',
      opts.vars,
    );
  }
  let pool = variants.slice(0, Math.max(1, opts.poolSize ?? variants.length));
  if (opts.exclude?.length) {
    const excluded = new Set(opts.exclude.map(normalizeCopy));
    const fresh = pool.filter((v) => !excluded.has(normalizeCopy(v)));
    if (fresh.length) pool = fresh;
  }
  const idx = hashToIndex(opts.seed ?? key, pool.length);
  return interpolate(pool[idx], opts.vars);
}

export function copyKeys(): string[] {
  return [...load().map.keys()];
}

export function copyVariants(key: string): string[] {
  return [...(load().map.get(key) ?? [])];
}
