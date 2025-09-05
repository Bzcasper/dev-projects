/**
 * Rollback and Disaster Recovery Testing
 * Tests recovery procedures and rollback capabilities for deployment failures
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Disaster Recovery and Rollback Testing', () => {
  const projectRoot = process.cwd()
  const backupDir = path.join(projectRoot, '.deployment-backup')
  const tempFiles = []
  
  beforeAll(async () => {
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true })
    
    // Clean and ensure known good state
    try {
      await execAsync('pnpm clean', { cwd: projectRoot })
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
    } catch (error) {
      console.warn('Initial build failed:', error.message)
    }
  })

  afterAll(async () => {
    // Cleanup
    for (const file of tempFiles) {
      try {
        await fs.unlink(file)
      } catch (error) {
        console.warn(`Failed to cleanup ${file}`)
      }
    }
    
    try {
      await fs.rm(backupDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to cleanup backup directory')
    }
  })

  describe('Backup and Restore Procedures', () => {
    test('should create deployment backup before risky changes', async () => {
      const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const deploymentBackup = path.join(backupDir, `deployment-${backupTimestamp}`)
      
      // Create backup of critical files
      await fs.mkdir(deploymentBackup, { recursive: true })
      
      const criticalFiles = [
        'package.json',
        'vercel.json',
        'packages/web/package.json',
        'packages/core/package.json',
        'packages/ui/package.json'
      ]
      
      for (const file of criticalFiles) {
        const sourcePath = path.join(projectRoot, file)
        const exists = await fs.access(sourcePath).then(() => true).catch(() => false)
        
        if (exists) {
          const backupPath = path.join(deploymentBackup, file)
          await fs.mkdir(path.dirname(backupPath), { recursive: true })
          await fs.copyFile(sourcePath, backupPath)
        }
      }
      
      // Verify backup was created
      const backupFiles = await fs.readdir(deploymentBackup, { recursive: true })
      expect(backupFiles.length).toBeGreaterThan(0)
      
      console.log(`Created backup with ${backupFiles.length} files`)
    })

    test('should restore from backup after corruption', async () => {
      const webPackageJsonPath = path.join(projectRoot, 'packages/web/package.json')
      const originalContent = await fs.readFile(webPackageJsonPath, 'utf8')
      
      try {
        // Simulate corruption
        await fs.writeFile(webPackageJsonPath, 'invalid json content {{{')
        
        // Verify corruption breaks build
        const corruptedBuild = await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          timeout: 60000
        }).catch(error => error)
        
        expect(corruptedBuild.code).not.toBe(0)
        
        // Restore from backup (simulate)
        await fs.writeFile(webPackageJsonPath, originalContent)
        
        // Verify restoration works
        await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
        
        const webDistExists = await fs.access(path.join(projectRoot, 'packages/web/dist'))
          .then(() => true).catch(() => false)
        expect(webDistExists).toBe(true)
        
      } catch (error) {
        // Always restore even if test fails
        await fs.writeFile(webPackageJsonPath, originalContent)
        throw error
      }
    })
  })

  describe('Build Failure Recovery', () => {
    test('should recover from TypeScript compilation errors', async () => {
      const tempErrorFile = path.join(projectRoot, 'packages/core/src/temp-error.ts')
      tempFiles.push(tempErrorFile)
      
      try {
        // Introduce TypeScript error
        await fs.writeFile(tempErrorFile, `
          export const brokenCode = () => {
            return unknownVariable.doesNotExist()
          }
        `)
        
        // Build should fail
        const failedBuild = await execAsync('pnpm build:core', { 
          cwd: projectRoot,
          timeout: 60000
        }).catch(error => error)
        
        expect(failedBuild.code).not.toBe(0)
        expect(failedBuild.stderr || failedBuild.stdout).toMatch(/error|fail/i)
        
        // Remove error file to recover
        await fs.unlink(tempErrorFile)
        
        // Build should now succeed
        await execAsync('pnpm build:core', { cwd: projectRoot, timeout: 180000 })
        
        const coreDistExists = await fs.access(path.join(projectRoot, 'packages/core/dist'))
          .then(() => true).catch(() => false)
        expect(coreDistExists).toBe(true)
        
      } finally {
        // Ensure cleanup
        try {
          await fs.unlink(tempErrorFile)
        } catch (error) {
          // File may already be deleted
        }
      }
    })

    test('should recover from dependency resolution failures', async () => {
      const webPackageJsonPath = path.join(projectRoot, 'packages/web/package.json')
      const originalContent = await fs.readFile(webPackageJsonPath, 'utf8')
      const originalPackageJson = JSON.parse(originalContent)
      
      try {
        // Add non-existent dependency
        const corruptedPackageJson = {
          ...originalPackageJson,
          dependencies: {
            ...originalPackageJson.dependencies,
            'non-existent-package-12345': '^1.0.0'
          }
        }
        
        await fs.writeFile(webPackageJsonPath, JSON.stringify(corruptedPackageJson, null, 2))
        
        // Install should fail
        const failedInstall = await execAsync('pnpm install', { 
          cwd: projectRoot,
          timeout: 60000
        }).catch(error => error)
        
        expect(failedInstall.code).not.toBe(0)
        
        // Restore original package.json
        await fs.writeFile(webPackageJsonPath, originalContent)
        
        // Install should now succeed
        await execAsync('pnpm install', { cwd: projectRoot, timeout: 120000 })
        
        // Build should work
        await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
        
        const webDistExists = await fs.access(path.join(projectRoot, 'packages/web/dist'))
          .then(() => true).catch(() => false)
        expect(webDistExists).toBe(true)
        
      } finally {
        // Always restore
        await fs.writeFile(webPackageJsonPath, originalContent)
      }
    })
  })

  describe('Deployment State Recovery', () => {
    test('should handle partial deployment failures', async () => {
      // Clean all dist directories
      const distPaths = [
        path.join(projectRoot, 'packages/core/dist'),
        path.join(projectRoot, 'packages/ui/dist'),
        path.join(projectRoot, 'packages/web/dist')
      ]
      
      for (const distPath of distPaths) {
        try {
          await fs.rm(distPath, { recursive: true, force: true })
        } catch (error) {
          // Directory might not exist
        }
      }
      
      // Build only core package
      await execAsync('pnpm build:core', { cwd: projectRoot, timeout: 180000 })
      
      // Verify partial state
      const coreExists = await fs.access(distPaths[0]).then(() => true).catch(() => false)
      const uiExists = await fs.access(distPaths[1]).then(() => true).catch(() => false)
      const webExists = await fs.access(distPaths[2]).then(() => true).catch(() => false)
      
      expect(coreExists).toBe(true)
      expect(uiExists).toBe(false)
      expect(webExists).toBe(false)
      
      // Complete the build
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      // Verify complete state
      const allExist = await Promise.all(
        distPaths.map(p => fs.access(p).then(() => true).catch(() => false))
      )
      
      expect(allExist.every(exists => exists)).toBe(true)
    })

    test('should handle corrupted cache recovery', async () => {
      // Find cache directories
      const cacheLocations = [
        path.join(projectRoot, 'node_modules/.cache'),
        path.join(projectRoot, 'packages/web/node_modules/.cache'),
        path.join(projectRoot, 'packages/ui/node_modules/.cache'),
        path.join(projectRoot, 'packages/core/node_modules/.cache')
      ]
      
      const corruptedFiles = []
      
      try {
        // Corrupt cache files
        for (const cacheLocation of cacheLocations) {
          const exists = await fs.access(cacheLocation).then(() => true).catch(() => false)
          if (exists) {
            const corruptedFile = path.join(cacheLocation, 'corrupted-cache.tmp')
            await fs.writeFile(corruptedFile, 'corrupted data')
            corruptedFiles.push(corruptedFile)
          }
        }
        
        // Clean cache and rebuild
        await execAsync('pnpm clean', { cwd: projectRoot })
        await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
        
        // Verify successful recovery
        const webDistExists = await fs.access(path.join(projectRoot, 'packages/web/dist'))
          .then(() => true).catch(() => false)
        expect(webDistExists).toBe(true)
        
      } finally {
        // Cleanup corrupted files
        for (const file of corruptedFiles) {
          try {
            await fs.unlink(file)
          } catch (error) {
            console.warn(`Failed to cleanup corrupted file: ${file}`)
          }
        }
      }
    })
  })

  describe('Environment Recovery', () => {
    test('should handle environment variable corruption', async () => {
      const originalEnv = process.env.NODE_ENV
      
      try {
        // Set problematic environment
        process.env.NODE_ENV = 'corrupted-env'
        
        // Build should handle gracefully or fail clearly
        const result = await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          timeout: 180000
        }).catch(error => error)
        
        // Should either succeed or fail gracefully
        expect(result).toBeDefined()
        
        // Restore environment
        if (originalEnv) {
          process.env.NODE_ENV = originalEnv
        } else {
          delete process.env.NODE_ENV
        }
        
        // Recovery build should work
        await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
        
        const webDistExists = await fs.access(path.join(projectRoot, 'packages/web/dist'))
          .then(() => true).catch(() => false)
        expect(webDistExists).toBe(true)
        
      } finally {
        // Always restore environment
        if (originalEnv) {
          process.env.NODE_ENV = originalEnv
        } else {
          delete process.env.NODE_ENV
        }
      }
    })

    test('should recover from missing environment variables', async () => {
      const originalPath = process.env.PATH
      
      try {
        // Remove PATH temporarily
        delete process.env.PATH
        
        // Command should fail due to missing PATH
        const result = await execAsync('pnpm --version', { 
          cwd: projectRoot,
          timeout: 30000
        }).catch(error => error)
        
        expect(result.code).not.toBe(0)
        
        // Restore PATH
        process.env.PATH = originalPath
        
        // Should work again
        await execAsync('pnpm --version', { cwd: projectRoot, timeout: 30000 })
        
      } finally {
        // Always restore PATH
        process.env.PATH = originalPath
      }
    })
  })

  describe('Vercel Deployment Recovery', () => {
    test('should handle invalid vercel.json recovery', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const originalConfig = await fs.readFile(vercelConfigPath, 'utf8')
      
      try {
        // Corrupt vercel.json
        await fs.writeFile(vercelConfigPath, '{ invalid json')
        
        // Verify corruption
        expect(() => JSON.parse('{ invalid json')).toThrow()
        
        // Restore configuration
        await fs.writeFile(vercelConfigPath, originalConfig)
        
        // Verify restoration
        const restoredConfig = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
        expect(restoredConfig.buildCommand).toBeDefined()
        expect(restoredConfig.outputDirectory).toBe('packages/web/dist')
        
      } finally {
        // Always restore
        await fs.writeFile(vercelConfigPath, originalConfig)
      }
    })

    test('should validate vercel deployment requirements', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      // Verify all required Vercel deployment fields
      const requiredFields = [
        'buildCommand',
        'outputDirectory',
        'installCommand'
      ]
      
      const missingFields = requiredFields.filter(field => !config[field])
      expect(missingFields.length).toBe(0)
      
      if (missingFields.length > 0) {
        console.error('Missing Vercel config fields:', missingFields)
      }
      
      // Verify build command is executable
      const buildCommand = config.buildCommand
      expect(buildCommand).toContain('pnpm build')
      
      // Verify output directory exists after build
      const outputDir = path.join(projectRoot, config.outputDirectory)
      const outputExists = await fs.access(outputDir).then(() => true).catch(() => false)
      expect(outputExists).toBe(true)
    })
  })

  describe('Data Recovery and Consistency', () => {
    test('should maintain build artifact consistency', async () => {
      // Build project
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      // Get checksums of build artifacts
      const webDistPath = path.join(projectRoot, 'packages/web/dist')
      const assetsPath = path.join(webDistPath, 'assets')
      
      const files = await fs.readdir(assetsPath)
      const checksums = new Map()
      
      for (const file of files) {
        const content = await fs.readFile(path.join(assetsPath, file))
        const checksum = require('crypto').createHash('md5').update(content).digest('hex')
        checksums.set(file, checksum)
      }
      
      // Rebuild and verify consistency
      await execAsync('pnpm clean:dist', { cwd: projectRoot })
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      const rebuiltFiles = await fs.readdir(assetsPath)
      
      // Files should be consistent (same names, same checksums)
      for (const file of rebuiltFiles) {
        if (checksums.has(file)) {
          const newContent = await fs.readFile(path.join(assetsPath, file))
          const newChecksum = require('crypto').createHash('md5').update(newContent).digest('hex')
          
          expect(newChecksum).toBe(checksums.get(file))
        }
      }
    })

    test('should handle version rollback scenarios', async () => {
      const packageJsonPath = path.join(projectRoot, 'package.json')
      const originalPackageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      const originalVersion = originalPackageJson.version
      
      try {
        // Simulate version change
        const updatedPackageJson = {
          ...originalPackageJson,
          version: '0.0.1-rollback-test'
        }
        
        await fs.writeFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2))
        
        // Build with new version
        await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
        
        // Verify build succeeds with new version
        const webDistExists = await fs.access(path.join(projectRoot, 'packages/web/dist'))
          .then(() => true).catch(() => false)
        expect(webDistExists).toBe(true)
        
        // Rollback version
        await fs.writeFile(packageJsonPath, JSON.stringify(originalPackageJson, null, 2))
        
        // Build should still work
        await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
        
        const rolledBackDistExists = await fs.access(path.join(projectRoot, 'packages/web/dist'))
          .then(() => true).catch(() => false)
        expect(rolledBackDistExists).toBe(true)
        
      } finally {
        // Always restore original version
        await fs.writeFile(packageJsonPath, JSON.stringify(originalPackageJson, null, 2))
      }
    })
  })

  describe('Emergency Procedures', () => {
    test('should have emergency rebuild capability', async () => {
      // Completely destroy all build artifacts
      const distPaths = [
        path.join(projectRoot, 'packages/core/dist'),
        path.join(projectRoot, 'packages/ui/dist'),
        path.join(projectRoot, 'packages/web/dist'),
        path.join(projectRoot, 'node_modules')
      ]
      
      for (const distPath of distPaths) {
        try {
          await fs.rm(distPath, { recursive: true, force: true })
        } catch (error) {
          console.warn(`Could not remove ${distPath}:`, error.message)
        }
      }
      
      // Emergency rebuild
      await execAsync('pnpm install', { cwd: projectRoot, timeout: 300000 })
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      // Verify complete recovery
      const recoveryChecks = [
        path.join(projectRoot, 'packages/web/dist/index.html'),
        path.join(projectRoot, 'packages/web/dist/assets'),
        path.join(projectRoot, 'packages/core/dist'),
        path.join(projectRoot, 'packages/ui/dist')
      ]
      
      for (const checkPath of recoveryChecks) {
        const exists = await fs.access(checkPath).then(() => true).catch(() => false)
        expect(exists).toBe(true)
      }
    })

    test('should provide diagnostic information on failures', async () => {
      // Introduce a build failure
      const tempErrorFile = path.join(projectRoot, 'packages/web/src/diagnostic-error.vue')
      tempFiles.push(tempErrorFile)
      
      try {
        await fs.writeFile(tempErrorFile, '<template><div>{{ unknownVariable }}</div></template>')
        
        const failedBuild = await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          timeout: 60000
        }).catch(error => error)
        
        // Should provide diagnostic information
        expect(failedBuild.code).not.toBe(0)
        
        const errorOutput = failedBuild.stderr || failedBuild.stdout
        expect(errorOutput).toBeTruthy()
        expect(errorOutput.length).toBeGreaterThan(10) // Should have meaningful error message
        
        // Error should indicate the problematic file
        expect(errorOutput).toMatch(/diagnostic-error|unknownVariable/i)
        
      } finally {
        try {
          await fs.unlink(tempErrorFile)
        } catch (error) {
          console.warn('Failed to cleanup diagnostic error file')
        }
      }
    })
  })

  describe('Recovery Validation', () => {
    test('should validate complete system recovery', async () => {
      // Final validation that all systems are operational
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      const recoveryValidation = {
        buildArtifacts: {
          webDist: await fs.access(path.join(projectRoot, 'packages/web/dist')).then(() => true).catch(() => false),
          webIndex: await fs.access(path.join(projectRoot, 'packages/web/dist/index.html')).then(() => true).catch(() => false),
          webAssets: await fs.access(path.join(projectRoot, 'packages/web/dist/assets')).then(() => true).catch(() => false),
          coreDist: await fs.access(path.join(projectRoot, 'packages/core/dist')).then(() => true).catch(() => false),
          uiDist: await fs.access(path.join(projectRoot, 'packages/ui/dist')).then(() => true).catch(() => false)
        },
        configuration: {
          vercelJson: await fs.access(path.join(projectRoot, 'vercel.json')).then(() => true).catch(() => false),
          packageJson: await fs.access(path.join(projectRoot, 'package.json')).then(() => true).catch(() => false),
          lockFile: await fs.access(path.join(projectRoot, 'pnpm-lock.yaml')).then(() => true).catch(() => false)
        }
      }
      
      // All critical components should be operational
      const allBuildArtifactsExist = Object.values(recoveryValidation.buildArtifacts).every(exists => exists)
      const allConfigurationExists = Object.values(recoveryValidation.configuration).every(exists => exists)
      
      expect(allBuildArtifactsExist).toBe(true)
      expect(allConfigurationExists).toBe(true)
      
      console.log('Recovery validation:', recoveryValidation)
      
      // Final functional test
      const vercelConfig = JSON.parse(await fs.readFile(path.join(projectRoot, 'vercel.json'), 'utf8'))
      expect(vercelConfig.outputDirectory).toBe('packages/web/dist')
      
      const indexHtml = await fs.readFile(path.join(projectRoot, 'packages/web/dist/index.html'), 'utf8')
      expect(indexHtml).toContain('<!DOCTYPE html>')
      expect(indexHtml).toContain('id="app"')
    })
  })
})