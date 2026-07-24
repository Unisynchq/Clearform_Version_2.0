/**
 * Sanitize user input to prevent XSS and injection attacks
 */

const SQL_INJECTION_PATTERNS = [
  /(\bSELECT\b.*\bFROM\b)/i,
  /(\bDROP\b.*\bTABLE\b)/i,
  /(\bDELETE\b.*\bFROM\b)/i,
  /(\bINSERT\b.*\bINTO\b)/i,
  /(\bUPDATE\b.*\bSET\b)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bALTER\b.*\bTABLE\b)/i,
  /(\bCREATE\b.*\bTABLE\b)/i,
  /(\bEXEC\b|\bEXECUTE\b)/i,
  /(\bXP_CMDSHELL\b)/i,
  /(\bOR\s+\d+\s*=\s*\d)/i,
  /(\bAND\s+\d+\s*=\s*\d)/i,
  /'?\s*OR\s+'?[^']*'\s*=\s*'/i,
  /'?\s*OR\s+'?[^']*'\s*LIKE\s*'/i,
  /(--|#|\/\*)/,
  /(\bSLEEP\b\s*\(\s*\d)/i,
  /(\bWAITFOR\b.*\bDELAY\b)/i,
  /(\bBENCHMARK\b\s*\()/i,
  /(\bINTO\s+(OUT|DUMP)FILE\b)/i,
  /(\bINFORMATION_SCHEMA\b)/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /onfocus\s*=/i,
  /onblur\s*=/i,
  /onchange\s*=/i,
  /onsubmit\s*=/i,
  /onreset\s*=/i,
  /onselect\s*=/i,
  /onabort\s*=/i,
  /<vbscript[\s>]/i,
  /<embed[\s>]/i,
  /<object[\s>]/i,
  /<iframe[\s>]/i,
  /<frame[\s>]/i,
  /<form[\s>]/i,
  /<img[^>]*src\s*=/i,
  /<link[^>]*href\s*=/i,
  /<meta[^>]*http-equiv/i,
  /<svg[\s>]/i,
  /<math[\s>]/i,
];

export function containsSqlInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

export function containsXss(value: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeString(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$]/,
  /\brm\b/i,
  /\bwget\b/i,
  /\bcurl\b/i,
  /\bbash\b/i,
  /\bsh\b/i,
  /\bpython\b/i,
  /\bperl\b/i,
  /\beval\b/i,
  /\bexec\b/i,
  /\bsystem\b/i,
  /\bpopen\b/i,
  /\.\.\//,
];

export function containsCommandInjection(value: string): boolean {
  return COMMAND_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

export function validateInput(value: string): string | null {
  if (containsSqlInjection(value)) return 'SQL injection pattern detected';
  if (containsXss(value)) return 'XSS pattern detected';
  if (containsCommandInjection(value))
    return 'Command injection pattern detected';
  return null;
}

export function validateFileName(name: string): string | null {
  if (/\.exe$/i.test(name)) return 'Executable files are not allowed';
  if (/\.(bat|cmd|ps1|sh)$/i.test(name)) return 'Script files are not allowed';
  if (/\.(hta|js|vbs|wsf)$/i.test(name))
    return 'Active script files are not allowed';
  if (/\.(jar|class)$/i.test(name))
    return 'Compiled code files are not allowed';
  if (name.includes('..')) return 'Path traversal detected';
  if (name.includes('/') || name.includes('\\'))
    return 'Path separators not allowed in filename';
  if (containsCommandInjection(name)) return 'Invalid file name pattern';
  return null;
}
