import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the home Wi-Fi load the dev server (e.g. http://10.0.0.230:3000) for QA.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*"],
};

export default nextConfig;
