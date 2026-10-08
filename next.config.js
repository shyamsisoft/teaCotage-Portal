/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['msnodesqlv8', 'mssql', 'argon2'],
  },
};

module.exports = nextConfig;
