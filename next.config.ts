import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Disables Next 16's streaming metadata, which otherwise causes a dev-only
    // hydration-mismatch warning around the <head> metadata boundary (harmless,
    // gone in production builds, but noisy in dev). No SEO/bot surface here to lose.
    htmlLimitedBots: /.*/,
};

export default nextConfig;
