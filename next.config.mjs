/** @type {import('next').NextConfig} */
const nextConfig = {
    // Required for MongoDB ObjectId in API routes
    experimental: {
      serverComponentsExternalPackages: ["mongoose"],
    },
    
    // Custom headers for API routes
    async headers() {
      return [
        {
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
            { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          ]
        }
      ]
    },
  
    // Image domains configuration
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**",
        },
      ],
    },
  
    // Enable React Strict Mode
    reactStrictMode: true,
  
    // Webpack configuration for mongoose
    webpack(config) {
      config.experiments = {
        ...config.experiments,
        topLevelAwait: true,
      }
      return config
    }
  }
  
  export default nextConfig