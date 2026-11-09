/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@doctor-tracker/validation", "@doctor-tracker/auth"],
  serverExternalPackages: ["mongodb"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_URL ?? "http://127.0.0.1:4000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
