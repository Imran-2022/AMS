/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Disable automatic enforcement of agent rules by Next.js (project-level opt-out)
  agentRules: false,
  // Keep the app as a standard Next.js app for SSR/runtime deployment.
};

module.exports = nextConfig;
