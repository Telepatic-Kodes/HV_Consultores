/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gifmgwaogpamdeeiymup.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    turbotrace: {
      logDetail: true,
    },
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'pdf-parse': 'pdf-parse',
    })
    // Fix for Windows symlink issues
    config.resolve.symlinks = false
    return config
  },
}

module.exports = nextConfig
