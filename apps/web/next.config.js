/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@vambe/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
