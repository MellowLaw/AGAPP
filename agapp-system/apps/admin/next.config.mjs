/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@agapp/shared'],
  // @phosphor-icons/react ships ~3,000 individual icon files behind a single
  // barrel export. Without this, every `import { X } from '@phosphor-icons/react'`
  // pulls the whole barrel into the dev compile graph — Next.js's own docs name
  // this exact package as a known case for optimizePackageImports.
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

export default nextConfig;
