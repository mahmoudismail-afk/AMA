/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Required for Next.js 15 compatibility with React 18
  experimental: {
    reactCompiler: false,
  },
};

module.exports = nextConfig;
