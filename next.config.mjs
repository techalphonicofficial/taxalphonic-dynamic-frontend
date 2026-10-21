// Public hosts the site is opened on. The live server sits behind LiteSpeed, which forwards its
// internal host instead of the public one, so Next.js saw the browser's Origin
// (frontend.taxalphonic.com) as a different site and rejected every Server Action (CMS form
// submit) with a 500. Listed hosts are accepted; more can be added, comma-separated, in
// SERVER_ACTION_ORIGINS (.env), e.g. a staging domain.
const SERVER_ACTION_ORIGINS = [
  "taxalphonic.com",
  "www.taxalphonic.com",
  "frontend.taxalphonic.com",
  ...String(process.env.SERVER_ACTION_ORIGINS || "").split(",").map((host) => host.trim()).filter(Boolean),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: SERVER_ACTION_ORIGINS,
    },
  },
};

export default nextConfig;
