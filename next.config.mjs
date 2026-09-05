/** @type {import('next').NextConfig} */
const nextConfig = {
  // The deployed application is served beneath this path. Keep local
  // development at the conventional localhost root described in the README.
  ...(process.env.NODE_ENV === "production" ? { basePath: "/SHSKPIs" } : {}),
  reactStrictMode: true,
  optimizeFonts: false,
  images: {
    unoptimized: true,
  },
  // The dashboard lives at /dashboard; `/` is kept alive only so older
  // bookmarks and shared filter links keep working. 307 rather than 308 —
  // a permanent redirect gets cached hard by browsers and is painful to undo.
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
