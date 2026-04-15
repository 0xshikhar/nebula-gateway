"use client"

import "@rainbow-me/rainbowkit/styles.css"

import * as React from "react"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, cookieStorage, createConfig, createStorage, http } from "wagmi"
import { injected, walletConnect } from "wagmi/connectors"

import { hashkeyTestnet } from "@/lib/customChain"

const projectId = "9811958bd307518b364ff7178034c435"
const chains = [hashkeyTestnet] as const

const config = createConfig({
  chains,
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [hashkeyTestnet.id]: http(hashkeyTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={hashkeyTestnet.id}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
