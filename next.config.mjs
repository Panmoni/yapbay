/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // experimental: {
  //   optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  // },
};

export default nextConfig;
