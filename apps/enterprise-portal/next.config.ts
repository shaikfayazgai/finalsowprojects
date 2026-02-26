import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@glimmora/ui', '@glimmora/types', '@glimmora/config'],
}

export default nextConfig
