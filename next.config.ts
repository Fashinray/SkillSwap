import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets the dev server's Fast Refresh websocket connect when the app is
  // opened from another device on the LAN (e.g. a phone). Without this,
  // Next.js silently blocks that cross-origin HMR connection, the client
  // loses its connection to the dev server, and its recovery logic forces
  // periodic full page reloads — which wipes any in-progress form input.
  // NOTE: this is the machine's LAN IP and will need updating again if it
  // changes (DHCP lease renewal, different Wi-Fi network, etc).
  allowedDevOrigins: ['192.168.18.4', '192.168.1.64'],
  // Needed for next/image on the match page's user avatars, which come
  // from this project's Supabase Storage bucket.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uzhjsyiqjglgjgryprst.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
