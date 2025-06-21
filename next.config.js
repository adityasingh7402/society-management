const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // ... other existing config
}

// Add port configuration for Railway
if (process.env.PORT) {
  nextConfig.env = {
    ...nextConfig.env,
    PORT: process.env.PORT
  }
}

module.exports = nextConfig