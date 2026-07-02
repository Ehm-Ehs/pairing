/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      'react-icons',
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-slot',
      'framer-motion'
    ]
  }
};

export default nextConfig;

