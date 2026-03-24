export type TrustProtocol = "vault" | "pool" | "rewards" | "airdrop"
export type TrustDecision = "allow" | "review" | "deny"
export type TrustProofLibrary = "browser-signature" | "semaphore" | "circom+snarkjs"

export interface TrustInput {
  wallet: string
  protocol: TrustProtocol
  reputationBand: number
  humanProof: boolean
  cohortMember: boolean
  credentialVerified: boolean
  expired: boolean
  proofLibrary?: TrustProofLibrary
  proofId?: string
}

export interface TrustResult {
  decision: TrustDecision
  trustScore: number
  bandLabel: string
  policyVersion: string
  proofLibrary: TrustProofLibrary
  reasons: string[]
  summary: string
}

export const defaultProofLibrary: TrustProofLibrary = "browser-signature"
export const policyVersion = "nebula-trust-v1"

export const protocolPresets: Array<{
  key: TrustProtocol
  title: string
  description: string
}> = [
  { key: "vault", title: "Vault join", description: "High-trust access to a DeFi vault" },
  { key: "pool", title: "Pool access", description: "Gated access to a premium liquidity pool" },
  { key: "rewards", title: "Reward claim", description: "Contributor or loyalty reward flow" },
  { key: "airdrop", title: "Airdrop claim", description: "Sybil-resistant campaign distribution" },
]

export function evaluateTrust(input: TrustInput): TrustResult {
  const proofLibrary = input.proofLibrary ?? defaultProofLibrary
  const normalizedBand = Math.max(0, Math.min(4, input.reputationBand))
  const baseScore =
    normalizedBand * 20 +
    (input.humanProof ? 25 : 0) +
    (input.cohortMember ? 15 : 0) +
    (input.credentialVerified ? 10 : 0)

  const bandLabel = `band-${normalizedBand}`

  if (!input.wallet) {
    return {
      decision: "deny",
      trustScore: 0,
      bandLabel,
      policyVersion,
      proofLibrary,
      reasons: ["Wallet address is required before verification."],
      summary: "Missing wallet address",
    }
  }

  if (input.expired) {
    return {
      decision: "deny",
      trustScore: Math.max(0, baseScore - 25),
      bandLabel,
      policyVersion,
      proofLibrary,
      reasons: [
        "Proof expired before verification.",
        "A fresh browser-generated proof is required.",
      ],
      summary: "Expired proof",
    }
  }

  const reasons: string[] = []

  if (input.humanProof) {
    reasons.push("Human proof verified.")
  } else {
    reasons.push("Human proof missing.")
  }

  if (normalizedBand >= 3) {
    reasons.push("Wallet is in an elevated reputation band.")
  } else if (normalizedBand >= 2) {
    reasons.push("Wallet is in a reviewable reputation band.")
  } else {
    reasons.push("Wallet reputation is below the preferred threshold.")
  }

  if (input.cohortMember) {
    reasons.push("Wallet belongs to an allowed cohort.")
  }

  if (input.credentialVerified) {
    reasons.push("Credential or contributor status is verified.")
  }

  const allowed =
    input.humanProof &&
    (
      (input.protocol === "vault" && normalizedBand >= 3 && (input.cohortMember || input.credentialVerified)) ||
      (input.protocol === "pool" && normalizedBand >= 3 && input.cohortMember) ||
      (input.protocol === "rewards" && input.cohortMember && normalizedBand >= 2) ||
      (input.protocol === "airdrop" && input.humanProof && input.cohortMember)
    )

  if (allowed) {
    return {
      decision: "allow",
      trustScore: Math.min(100, baseScore + 5),
      bandLabel,
      policyVersion,
      proofLibrary,
      reasons,
      summary: "Policy matched",
    }
  }

  if (baseScore >= 55) {
    reasons.push("Policy returned the request for review.")
    return {
      decision: "review",
      trustScore: baseScore,
      bandLabel,
      policyVersion,
      proofLibrary,
      reasons,
      summary: "Manual review recommended",
    }
  }

  return {
    decision: "deny",
    trustScore: baseScore,
    bandLabel,
    policyVersion,
    proofLibrary,
    reasons,
    summary: "Policy denied access",
  }
}
