/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@agapp/shared'],
  // iconsax-react barrel imports optimization for dev server performance
  experimental: {
    optimizePackageImports: ['iconsax-react'],
  },
  // Baseline hardening headers. Not a full CSP — this app loads Leaflet tiles,
  // Google Fonts, and Supabase over various origins, so a locked-down
  // script-src/connect-src needs its own pass rather than guessing here.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
