/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Disable automatic enforcement of agent rules by Next.js (project-level opt-out)
  agentRules: false,

  // Only produce the trimmed `standalone` build output for the Docker/Render build.
  // Netlify's Next.js Runtime expects the normal `.next` output (no top-level
  // index.html in standalone mode -> Netlify can't infer a publish directory ->
  // every route 404s), so this stays "undefined" (default) for Netlify builds,
  // and is only switched on when the Dockerfile explicitly sets DOCKER_BUILD=true.
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
};

module.exports = nextConfig;