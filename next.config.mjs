/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable proper handling of Railway's domain
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ];
  },
  // Trust Railway's proxy
  poweredByHeader: false,
  // Add any required domains for images
  images: {
    domains: ['res.cloudinary.com'],
    unoptimized: true
  }
};

export default nextConfig;
