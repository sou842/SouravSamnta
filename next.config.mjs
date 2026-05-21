/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@whiskeysockets/baileys', 'jimp', 'sharp'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
