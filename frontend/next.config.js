/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable Turbopack, use Webpack
    experimental: {
        turbo: false,
    },
}

module.exports = nextConfig
