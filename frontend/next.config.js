/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Disable automatic enforcement of agent rules by Next.js (project-level opt-out)
  agentRules: false,
  // Build standalone output for Docker
  output: 'standalone',
  // devIndicators: {
  //   position: 'bottom-right',
  // },
};

module.exports = nextConfig;
