/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['geoip-lite'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://leadzmaker.com https://www.leadzmaker.com http://localhost:5173 http://localhost:3000 *;" }
        ],
      },
      {
        source: '/widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ],
      },
      {
        source: '/widget',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://leadzmaker.com https://www.leadzmaker.com http://localhost:5173 http://localhost:3000 *;" },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://leadzmaker.com https://www.leadzmaker.com http://localhost:5173 http://localhost:3000 *;" }
        ],
      }
    ];
  },
};

module.exports = nextConfig;
