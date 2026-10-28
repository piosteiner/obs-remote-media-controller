// Browser tests (npm run test:e2e): a test build of the app (.env.e2e → the local test server) against
// test/e2e/test-backend.cjs — its own data and uploads, never the live ones. The Adenai library is answered by
// the tests themselves (a fixture), so they don't depend on the Adenai server.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30000,
  retries: 1,
  workers: 1, // one server, one state
  reporter: [['list']],
  outputDir: 'test/e2e/.results',
  use: { baseURL: 'http://localhost:4175', ...devices['Desktop Chrome'], viewport: { width: 1280, height: 1000 } },
  webServer: [
    {
      command: 'node test/e2e/test-backend.cjs',
      url: 'http://localhost:3113/api/health',
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npx vite build --mode e2e --outDir dist-e2e --emptyOutDir && npx vite preview --mode e2e --outDir dist-e2e --port 4175 --strictPort',
      url: 'http://localhost:4175',
      reuseExistingServer: false,
      timeout: 180000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
