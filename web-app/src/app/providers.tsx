"use client"

import "@rainbow-me/rainbowkit/styles.css"

import * as React from "react"
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"

import { hashkeyTestnet } from "@/lib/customChain"

const projectId = "9811958bd307518b364ff7178034c435"

const config = getDefaultConfig({
  appName: "Nebula Trust Gateway",
  projectId,
  chains: [hashkeyTestnet],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        ) : (
          <div style={{ visibility: "hidden" }}>{children}</div>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
