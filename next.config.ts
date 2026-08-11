import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'mammoth', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
