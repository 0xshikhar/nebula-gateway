import { defineChain } from "viem"

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { decimals: 18, name: "HSK", symbol: "HSK" },
  rpcUrls: { default: { http: ["https://testnet.hsk.xyz"] } },
  blockExplorers: {
    default: {
      name: "HashKey Testnet Explorer",
      url: "https://testnet-explorer.hsk.xyz",
    },
  },
  testnet: true,
})
