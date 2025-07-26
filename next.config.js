/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  // Add cron job configuration
  async rewrites() {
    return [
      {
        source: '/api/cron/generate-bills',
        destination: '/api/cron/generate-monthly-bills'
      }
    ];
  },
  // Add cron configuration
  async serverRuntimeConfig() {
    return {
      cron: {
        jobs: [
          {
            // Run every hour
            schedule: '0 * * * *',
            exec: async () => {
              try {
                // Use direct model access instead of HTTP call
                const { handler } = require('./pages/api/cron/generate-monthly-bills');
                
                // Create a mock request and response
                const req = {
                  method: 'POST',
                  headers: {}
                };
                
                const res = {
                  status: (code) => ({
                    json: (data) => {
                      if (code >= 200 && code < 300) {
                        console.log('Cron job completed successfully:', data);
                      } else {
                        console.error('Cron job failed:', data);
                      }
                    }
                  })
                };

                // Execute the handler directly
                await handler(req, res);
              } catch (error) {
                console.error('Error in scheduled bills generation:', error);
              }
            }
          }
        ]
      }
    };
  }
};

module.exports = nextConfig;