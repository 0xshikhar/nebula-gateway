import { generateNonce, SiweMessage } from "siwe"

import type { TrustProtocol } from "@/lib/nebula-trust"

export interface BrowserProofRequest {
  address: string
  chainId: number
  protocol: TrustProtocol
  trustBand: number
}

export interface BrowserProofArtifact {
  proofId: string
  message: string
  nonce: string
  issuedAt: string
}

export function createBrowserProof(request: BrowserProofRequest): BrowserProofArtifact {
  if (typeof window === "undefined") {
    throw new Error("Browser proof generation requires a browser context")
  }

  const nonce = generateNonce()
  const issuedAt = new Date().toISOString()
  const proofId = `proof_${Date.now()}`

  const message = new SiweMessage({
    domain: window.location.host,
    address: request.address,
    statement: `Generate a Nebula Trust proof for ${request.protocol}. Trust band ${request.trustBand}.`,
    uri: window.location.origin,
    version: "1",
    chainId: request.chainId,
    nonce,
    issuedAt,
  })

  return {
    proofId,
    message: message.prepareMessage(),
    nonce,
    issuedAt,
  }
}
