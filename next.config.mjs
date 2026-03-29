/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep yahoo-finance2 as server-only Node.js — do not bundle it client-side
  serverExternalPackages: ['yahoo-finance2'],

  webpack: (config) => {
    // yahoo-finance2 contains test/deno internals that webpack cannot resolve.
    // Setting these to false tells webpack to skip them at build time.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@std/testing/mock':                             false,
      '@std/testing/bdd':                              false,
      '@gadicc/fetch-mock-cache/runtimes/deno.ts':    false,
      '@gadicc/fetch-mock-cache/stores/fs.ts':         false,
    }
    return config
  },
}

export default nextConfig
