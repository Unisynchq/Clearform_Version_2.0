import {
  containsSqlInjection,
  containsXss,
  containsCommandInjection,
  validateInput,
  validateFileName,
} from '../../common/validators/sanitize.validator';

describe('Input Validation Security', () => {
  describe('SQL Injection Detection', () => {
    it('should detect basic SQL injection', () => {
      expect(containsSqlInjection("' OR 1=1 --")).toBe(true);
      expect(containsSqlInjection("' OR '1'='1")).toBe(true);
    });

    it('should detect tautology injection', () => {
      expect(containsSqlInjection("' OR 1=1 --")).toBe(true);
      expect(containsSqlInjection("admin' --")).toBe(true);
    });

    it('should detect SELECT injection', () => {
      expect(containsSqlInjection('SELECT * FROM users')).toBe(true);
    });

    it('should detect DROP TABLE injection', () => {
      expect(containsSqlInjection('DROP TABLE users')).toBe(true);
    });

    it('should detect UNION injection', () => {
      expect(containsSqlInjection(' UNION SELECT * FROM passwords')).toBe(true);
    });

    it('should detect comment injection', () => {
      expect(containsSqlInjection('admin--')).toBe(true);
      expect(containsSqlInjection('admin/*')).toBe(true);
    });

    it('should detect time-based injection', () => {
      expect(containsSqlInjection('SLEEP(5)')).toBe(true);
      expect(containsSqlInjection('WAITFOR DELAY')).toBe(true);
    });

    it('should allow safe strings', () => {
      expect(containsSqlInjection('Hello, this is a normal string')).toBe(false);
      expect(containsSqlInjection('SELECTion committee')).toBe(false);
    });
  });

  describe('XSS Detection', () => {
    it('should detect script tags', () => {
      expect(containsXss('<script>alert("xss")</script>')).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      expect(containsXss('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXss('<img src=x onerror=alert(1)>')).toBe(true);
      expect(containsXss('<div onload="evil()">')).toBe(true);
    });

    it('should detect iframe injection', () => {
      expect(containsXss('<iframe src="http://evil.com">')).toBe(true);
    });

    it('should detect embedded objects', () => {
      expect(containsXss('<object data="evil.swf">')).toBe(true);
      expect(containsXss('<embed src="evil.swf">')).toBe(true);
      expect(containsXss('<svg onload="alert(1)">')).toBe(true);
    });

    it('should allow safe content', () => {
      expect(containsXss('Normal text with <b>html</b> tags')).toBe(false);
    });
  });

  describe('Command Injection Detection', () => {
    it('should detect shell metacharacters', () => {
      expect(containsCommandInjection('; rm -rf /')).toBe(true);
      expect(containsCommandInjection('| cat /etc/passwd')).toBe(true);
      expect(containsCommandInjection('`ls -la`')).toBe(true);
    });

    it('should detect path traversal with dots', () => {
      expect(containsCommandInjection('../../etc/passwd')).toBe(true);
    });

    it('should detect dangerous commands', () => {
      expect(containsCommandInjection('rm -rf')).toBe(true);
      expect(containsCommandInjection('wget evil.com')).toBe(true);
      expect(containsCommandInjection('curl evil.com')).toBe(true);
    });

    it('should allow safe strings', () => {
      expect(containsCommandInjection('Hello World')).toBe(false);
    });
  });

  describe('Combined Validation', () => {
    it('should catch SQL injection', () => {
      const result = validateInput("' OR 1=1 --");
      expect(result).toBeTruthy();
    });

    it('should catch XSS', () => {
      const result = validateInput('<script>evil()</script>');
      expect(result).toBeTruthy();
    });

    it('should catch command injection', () => {
      const result = validateInput('; rm -rf /');
      expect(result).toBeTruthy();
    });

    it('should return null for safe input', () => {
      expect(validateInput('Hello, world!')).toBeNull();
    });
  });

  describe('File Name Validation', () => {
    it('should reject path traversal in filenames', () => {
      const result = validateFileName('../../../etc/passwd');
      expect(result).not.toBeNull();
    });

    it('should reject executable files', () => {
      const result = validateFileName('virus.exe');
      expect(result).toBe('Executable files are not allowed');
    });

    it('should reject script files', () => {
      expect(validateFileName('script.bat')).toBe('Script files are not allowed');
      expect(validateFileName('script.sh')).toBe('Script files are not allowed');
      expect(validateFileName('script.ps1')).toBe('Script files are not allowed');
    });

    it('should reject path separators', () => {
      expect(validateFileName('folder/file.pdf')).toBe('Path separators not allowed in filename');
    });

    it('should allow safe filenames', () => {
      expect(validateFileName('report.pdf')).toBeNull();
      expect(validateFileName('my-photo.jpg')).toBeNull();
      expect(validateFileName('document_2024.docx')).toBeNull();
      expect(validateFileName('image (1).png')).toBeNull();
    });
  });
});
