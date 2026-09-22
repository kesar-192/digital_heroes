/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Charity images are served from Supabase Storage's public bucket.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
