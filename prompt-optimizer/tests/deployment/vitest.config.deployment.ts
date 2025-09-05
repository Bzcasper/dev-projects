/**
 * Vitest Configuration for Deployment Tests
 * Specialized configuration for running deployment readiness tests
 */

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load environment variables
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  
  return {
    test: {
      name: 'deployment-tests',
      globals: true,
      environment: 'node',
      
      // Extended timeouts for deployment operations
      testTimeout: 600000, // 10 minutes for complex deployment tests
      hookTimeout: 120000, // 2 minutes for setup/teardown
      
      // Include only deployment test files
      include: [
        'tests/deployment/**/*.test.{js,ts}',
        'tests/deployment/**/*.spec.{js,ts}'
      ],
      
      // Exclude other test files
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        'packages/**/tests/**' // Exclude package-specific tests
      ],
      
      // Environment variables for deployment tests
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DEPLOYMENT_TEST: 'true',
        // Disable analytics and tracking in tests
        DISABLE_ANALYTICS: 'true',
        DISABLE_TELEMETRY: 'true'
      },
      
      // Sequential execution for deployment tests to avoid conflicts
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true // Run deployment tests one at a time
        }
      },
      
      // Reporters for CI/CD integration
      reporter: [
        'default',
        'json',
        'junit'
      ],
      
      outputFile: {
        json: './tests/deployment/results/deployment-test-results.json',
        junit: './tests/deployment/results/deployment-test-results.xml'
      },
      
      // Coverage configuration for deployment tests
      coverage: {
        enabled: false, // Deployment tests don't need code coverage
        provider: 'v8',
        reporter: ['text', 'json-summary'],
        reportsDirectory: './tests/deployment/coverage'
      },
      
      // Setup files for deployment tests
      setupFiles: [
        './tests/deployment/setup-deployment-tests.js'
      ],
      
      // Retry configuration for flaky deployment tests
      retry: 1, // Retry once for deployment tests
      
      // Bail on first failure for deployment tests
      bail: 0, // Don't bail - run all tests for comprehensive report
      
      // Custom test environment configuration
      testNamePattern: undefined, // Run all tests by default
      
      // Watch mode disabled for deployment tests
      watch: false,
      
      // Disable file watching
      watchExclude: ['**/node_modules/**', '**/dist/**']
    }
  }
})