import type { SemaphoreProof as SemaphoreProofType } from "@semaphore-protocol/proof"

export type TrustProtocol = "vault" | "pool" | "rewards" | "airdrop"

export type TrustDecision = "allow" | "review" | "deny"

export type TrustInput = {
  wallet: string
  protocol: TrustProtocol
  reputationBand: number
  humanProof: boolean
  cohortMember: boolean
  credentialVerified: boolean
  expired: boolean
  proofLibrary: string
  proofId: string
}

export type TrustResult = {
  decision: TrustDecision
  trustScore: number
  band: number
  bandLabel: string
  policyVersion: string
  reasons: string[]
  summary: string
  wallet: string
  protocol: TrustProtocol
  proofId: string
  verifiedAt: string
  proofLibrary: string
  identityCommitment?: string
}

export type TrustPolicy = {
  id: string
  title: string
  description: string
  minTrustScore: number
  minBand: number
  requireHuman: boolean
  requireCredential: boolean
  reviewThreshold: number
}

export type SemaphoreProof = {
  wallet: string
  protocol: TrustProtocol
  policyVersion: string
  trustScore: number
  nullifier: string
  commitment: string
  root: string
  scope: string
  message: string
  scopeHash: string
  messageHash: string
  semaphoreProof?: SemaphoreProofType
}

export type OnChainDecision = {
  decision: number
  trustScore: bigint
  policyVersion: string
  proofId: string
}

export type SDKConfig = {
  apiBaseUrl: string
  chainId?: number
  contracts?: {
    trustVerifier?: string
    trustPolicy?: string
    trustGateway?: string
  }
}
