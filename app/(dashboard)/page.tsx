'use client';

// This file exists purely to force Next.js to generate the client-reference-manifest
// for the (dashboard) route group. Since the layout contains client components,
// Next.js expects a client manifest for the root page of this group on Vercel.
export default function RouteGroupRoot() {
  return null;
}
