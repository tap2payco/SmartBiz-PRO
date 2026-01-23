
const withSerwist = require("@serwist/next").default({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@smartbiz/shared', '@smartbiz/ui'],
    reactStrictMode: true,
};

module.exports = withSerwist(nextConfig);
