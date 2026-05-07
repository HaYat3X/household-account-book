import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google-cloud/vision", "@grpc/grpc-js", "@grpc/proto-loader"],
};

export default nextConfig;
