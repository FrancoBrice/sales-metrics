/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vambe/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
