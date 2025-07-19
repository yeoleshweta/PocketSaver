/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: false, // avoid LightningCSS issues
  },
};

module.exports = nextConfig;