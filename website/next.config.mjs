/** @type {import('next').NextConfig} */
const apiOrigin = process.env.API_ORIGIN;

const nextConfig = {
  async rewrites() {
    return apiOrigin ? [{ source: "/v1/:path*", destination: apiOrigin + "/v1/:path*" }] : [];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
