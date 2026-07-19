/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as {
  version: string
}

function gitShortSha(): string {
  const fromEnv =
    process.env.VITE_GIT_COMMIT?.trim() || process.env.CF_PAGES_COMMIT_SHA?.trim()
  if (fromEnv) return fromEnv.slice(0, 7)

  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev'
  }
}

const appVersion = pkg.version
const gitCommit = gitShortSha()

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
  },
  server: {
    allowedHosts: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
