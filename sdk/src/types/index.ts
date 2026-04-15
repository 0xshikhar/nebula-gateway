import type { SemaphoreProof as SemaphoreProofType } from "@semaphore-protocol/proof"

export type TrustProtocol = "vault" | "pool" | "rewards" | "airdrop"

export type TrustDecision = "allow" | "review" | "deny"

export type TrustProofLibrary = "browser-signature" | "semaphore" | "circom+snarkjs"

export type TrustInput = {
  wallet: string
  protocol: TrustProtocol
  reputationBand: number
  humanProof: boolean
  cohortMember: boolean
  credentialVerified: boolean
  expired: boolean
  proofLibrary?: TrustProofLibrary
  proofId?: string
  identityCommitment?: string
}

export type TrustPolicyProfile = {
  id: string
  version: string
  protocol: TrustProtocol
  title: string
  description: string
  minTrustScore: number
  minBand: number
  requireHuman: boolean
  requireCredential: boolean
  reviewThreshold: number
}

export type TrustSignalContribution = {
  key: "reputationBand" | "humanProof" | "cohortMember" | "credentialVerified"
  label: string
  enabled: boolean
  weight: number
  contribution: number
}

export type TrustGateCondition = {
  key: "wallet" | "expired" | "humanProof" | "cohortMember" | "credentialVerified" | "reputationBand" | "trustScore"
  label: string
  passed: boolean
  reason: string
}

export type TrustSignalBreakdown = {
  normalizedBand: number
  trustScore: number
  maximumScore: number
  conditions: TrustGateCondition[]
  contributions: TrustSignalContribution[]
}

export type TrustResult = {
  decision: TrustDecision
  trustScore: number
  bandLabel: string
  policyVersion: string
  policyId: string
  policy: TrustPolicyProfile
  proofLibrary: TrustProofLibrary
  signalBreakdown: TrustSignalBreakdown
  reasons: string[]
  summary: string
  wallet: string
  protocol: TrustProtocol
  proofId: string
  verifiedAt: string
  identityCommitment?: string
}

export type TrustScoreResult = {
  wallet: string
  protocol: TrustProtocol
  trustScore: number
  bandLabel: string
  proofLibrary: TrustProofLibrary
  policyVersion: string
  summary: string
  auditStored?: boolean
}

export type TrustAuditTrail = {
  verificationEvents: unknown[]
  auditEvents: unknown[]
  proofEvents: unknown[]
  policyVersions: unknown[]
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
  groupRoot?: string
  groupDepth?: number
  scope: string
  message: string
  scopeHash: string
  messageHash: string
  identityCommitment?: string
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
