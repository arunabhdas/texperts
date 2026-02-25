/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phaser uses dynamic requires and canvas — ensure compatibility
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
