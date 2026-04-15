import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

export const siteConfig: SiteConfig = {
  name: "Nebula Gateway",
  author: "NebulaID",
  description:
    "Protocol-facing trust infrastructure for HashKey Chain. Verify humans, reputation, and eligibility without exposing identity.",
  keywords: [
    "HashKey Chain",
    "Nebula Gateway",
    "Privacy-preserving trust",
    "ZKID",
    "Semaphore",
    "wagmi",
    "viem",
    "RainbowKit",
    "Next.js",
  ],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "https://nebulaid.xyz",
  },
  links: {
    github: "https://github.com/NebulaID",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
