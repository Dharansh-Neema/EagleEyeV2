/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...other config,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
