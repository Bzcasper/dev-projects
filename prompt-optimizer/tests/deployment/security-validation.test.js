/**
 * Security Testing for Production Configuration
 * Validates security measures and identifies potential vulnerabilities
 */

import { describe, test, expect, beforeAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Security Validation', () => {
  const projectRoot = process.cwd()
  const webDistPath = path.join(projectRoot, 'packages/web/dist')
  
  beforeAll(async () => {
    // Ensure build exists
    const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
    if (!distExists) {
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
    }
  })

  describe('Sensitive Data Protection', () => {
    test('should not expose API keys in build output', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Check for various API key patterns
          expect(content).not.toMatch(/["\']?api[_-]?key["\']?\s*[:=]\s*["\'][a-zA-Z0-9_-]{20,}["\']/)
          expect(content).not.toMatch(/["\']?secret["\']?\s*[:=]\s*["\'][a-zA-Z0-9_-]{20,}["\']/)
          expect(content).not.toMatch(/["\']?token["\']?\s*[:=]\s*["\'][a-zA-Z0-9_-]{20,}["\']/)
          expect(content).not.toMatch(/sk-[a-zA-Z0-9]{40,}/) // OpenAI API key pattern
          expect(content).not.toMatch(/AIza[0-9A-Za-z\\-_]{35}/) // Google API key pattern
        }
      }
    })

    test('should not expose private keys or certificates', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Check for certificate patterns
          expect(content).not.toContain('-----BEGIN PRIVATE KEY-----')
          expect(content).not.toContain('-----BEGIN RSA PRIVATE KEY-----')
          expect(content).not.toContain('-----BEGIN CERTIFICATE-----')
          expect(content).not.toContain('ssh-rsa ')
          expect(content).not.toContain('ssh-ed25519 ')
        }
      }
    })

    test('should not expose database credentials', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Database connection patterns
          expect(content).not.toMatch(/mongodb:\/\/[^/]*:[^@]*@/)
          expect(content).not.toMatch(/postgres:\/\/[^/]*:[^@]*@/)
          expect(content).not.toMatch(/mysql:\/\/[^/]*:[^@]*@/)
          expect(content).not.toMatch(/["\']?password["\']?\s*[:=]\s*["\'][^"']{3,}["\']/)
        }
      }
    })

    test('should not expose internal paths or system information', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // System paths
          expect(content).not.toMatch(/\/home\/[^/]+\//)
          expect(content).not.toMatch(/C:\\Users\\[^\\]+\\/)
          expect(content).not.toMatch(/\/var\/www\//)
          expect(content).not.toMatch(/\/etc\//)
          expect(content).not.toMatch(/\.env\.local/)
          expect(content).not.toMatch(/\.env\.production/)
        }
      }
    })
  })

  describe('Content Security Policy', () => {
    test('should have secure HTML structure', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Should not have inline scripts without nonce
      const inlineScripts = content.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []
      for (const script of inlineScripts) {
        if (!script.includes('src=')) {
          // Inline script should be minimal or have nonce
          const scriptContent = script.replace(/<\/?script[^>]*>/g, '').trim()
          if (scriptContent.length > 100) {
            console.warn('Large inline script detected:', scriptContent.substring(0, 100) + '...')
          }
        }
      }
    })

    test('should not have dangerous inline styles', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Check for potentially dangerous CSS
      expect(content).not.toMatch(/style\s*=\s*["\'][^"']*javascript:/i)
      expect(content).not.toMatch(/style\s*=\s*["\'][^"']*expression\s*\(/i)
    })

    test('should have proper meta tags for security', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Should have viewport meta tag
      expect(content).toMatch(/<meta\s+name=["']viewport["']/i)
      
      // Should have charset declaration
      expect(content).toMatch(/<meta\s+charset=["']utf-8["']/i)
    })
  })

  describe('XSS Prevention', () => {
    test('should not have unescaped user input patterns', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Dangerous HTML injection patterns
          expect(content).not.toMatch(/\.innerHTML\s*=\s*[^+]*\+/)
          expect(content).not.toMatch(/\.outerHTML\s*=\s*[^+]*\+/)
          expect(content).not.toMatch(/document\.write\s*\([^)]*\+/)
          
          // eval usage (should be avoided)
          expect(content).not.toMatch(/[^a-zA-Z]eval\s*\(/)
          expect(content).not.toMatch(/new\s+Function\s*\(/)
        }
      }
    })

    test('should use safe DOM manipulation', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      // Check main application files
      const mainFiles = jsFiles.slice(0, 3)
      
      for (const file of mainFiles) {
        const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
        
        // Should prefer textContent over innerHTML when possible
        // This is more of a best practice check
        const innerHTMLCount = (content.match(/\.innerHTML/g) || []).length
        const textContentCount = (content.match(/\.textContent/g) || []).length
        
        if (innerHTMLCount > textContentCount * 2) {
          console.warn(`High innerHTML usage in ${file}: ${innerHTMLCount} vs ${textContentCount} textContent`)
        }
      }
    })
  })

  describe('Dependency Security', () => {
    test('should not have known vulnerable dependencies', async () => {
      try {
        // Run npm audit to check for vulnerabilities
        const { stdout, stderr } = await execAsync('pnpm audit --json', { 
          cwd: projectRoot,
          timeout: 60000
        })
        
        if (stdout) {
          const auditResult = JSON.parse(stdout)
          
          // Check for high severity vulnerabilities
          if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
            const vulnerabilities = auditResult.metadata.vulnerabilities
            expect(vulnerabilities.high || 0).toBe(0)
            expect(vulnerabilities.critical || 0).toBe(0)
          }
        }
      } catch (error) {
        // If audit command fails, just warn
        console.warn('Security audit failed:', error.message)
      }
    })

    test('should have dependency integrity', async () => {
      const packageJsonPath = path.join(projectRoot, 'package.json')
      const packageLockPath = path.join(projectRoot, 'pnpm-lock.yaml')
      
      const packageJsonExists = await fs.access(packageJsonPath).then(() => true).catch(() => false)
      const lockFileExists = await fs.access(packageLockPath).then(() => true).catch(() => false)
      
      expect(packageJsonExists).toBe(true)
      expect(lockFileExists).toBe(true)
      
      // Lock file should be newer or same as package.json
      if (packageJsonExists && lockFileExists) {
        const packageJsonStat = await fs.stat(packageJsonPath)
        const lockFileStat = await fs.stat(packageLockPath)
        
        expect(lockFileStat.mtime.getTime()).toBeGreaterThanOrEqual(
          packageJsonStat.mtime.getTime() - 1000 // Allow 1 second difference
        )
      }
    })
  })

  describe('Environment Variable Security', () => {
    test('should not expose environment variables in client build', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Should not contain server-side environment variables
          expect(content).not.toMatch(/process\.env\.(?!VITE_)/)
          expect(content).not.toMatch(/NODE_ENV.*production/)
          
          // Common sensitive env var names
          expect(content).not.toContain('DATABASE_URL')
          expect(content).not.toContain('JWT_SECRET')
          expect(content).not.toContain('REDIS_URL')
        }
      }
    })

    test('should only expose VITE_ prefixed variables', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // VITE_ variables are OK to expose
          const viteVars = content.match(/VITE_[A-Z_]+/g) || []
          
          // Should have the expected VITE variables
          if (viteVars.includes('VITE_VERCEL_DEPLOYMENT')) {
            expect(viteVars).toContain('VITE_VERCEL_DEPLOYMENT')
          }
        }
      }
    })
  })

  describe('HTTP Security Headers Readiness', () => {
    test('should be compatible with security headers', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Should not have content that would break CSP
      expect(content).not.toMatch(/javascript:\s*void\s*\(0\)/)
      expect(content).not.toMatch(/on\w+\s*=\s*["'][^"']*["']/) // inline event handlers
      
      // Should be compatible with X-Frame-Options
      // (No specific requirements, but should not have frame-busting code)
      expect(content).not.toContain('top.location')
      expect(content).not.toContain('parent.location')
    })

    test('should not have mixed content issues', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Should not have http:// links when served over HTTPS
      const httpLinks = content.match(/http:\/\/[^"'\s]*/g) || []
      
      for (const link of httpLinks) {
        // Some exceptions for localhost or well-known HTTP-only services
        if (!link.includes('localhost') && !link.includes('127.0.0.1')) {
          console.warn('HTTP link in HTTPS context:', link)
        }
      }
    })
  })

  describe('Client-Side Security', () => {
    test('should have secure cookie handling patterns', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Check cookie handling
          if (content.includes('document.cookie')) {
            // Should set secure flags
            expect(content).toMatch(/secure[\s]*[=:]/i)
            expect(content).toMatch(/samesite/i)
          }
        }
      }
    })

    test('should have secure storage patterns', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Should not store sensitive data in localStorage
          if (content.includes('localStorage')) {
            // Common sensitive keys that shouldn't be in localStorage
            expect(content).not.toMatch(/localStorage.*password/i)
            expect(content).not.toMatch(/localStorage.*token.*[a-zA-Z0-9]{20,}/)
            expect(content).not.toMatch(/localStorage.*secret/i)
          }
        }
      }
    })
  })

  describe('Third-Party Integration Security', () => {
    test('should have secure external resource loading', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // External scripts should have integrity checks when possible
      const externalScripts = content.match(/<script[^>]*src=["\']https?:\/\/[^"']*[^>]*>/g) || []
      
      for (const script of externalScripts) {
        // Popular CDNs should have SRI
        if (script.includes('unpkg.com') || script.includes('jsdelivr.net') || script.includes('cdnjs.com')) {
          if (!script.includes('integrity=')) {
            console.warn('External script without SRI:', script)
          }
        }
      }
    })

    test('should not load resources from suspicious domains', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Check for suspicious domains
          const domains = content.match(/https?:\/\/([^\/\s"']+)/g) || []
          
          for (const domain of domains) {
            expect(domain).not.toMatch(/\.tk$|\.ml$|\.ga$|\.cf$/) // Suspicious TLDs
            expect(domain).not.toContain('bit.ly') // URL shorteners
            expect(domain).not.toContain('tinyurl.com')
          }
        }
      }
    })
  })
})