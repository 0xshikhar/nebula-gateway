import type {
  TrustDecision,
  TrustInput,
  TrustPolicyProfile,
  TrustResult,
  TrustSignalBreakdown,
  TrustProtocol,
  TrustProofLibrary,
} from "./types/index.js"

export const defaultProofLibrary: TrustProofLibrary = "semaphore"
export const policyVersion = "nebula-trust-v1"

export const trustPolicyCatalog: Record<TrustProtocol, TrustPolicyProfile> = {
  vault: {
    id: "lending-pool-v1",
    version: policyVersion,
    protocol: "vault",
    title: "Vault access",
    description: "High-trust access to a DeFi vault with strict identity and cohesion checks.",
    minTrustScore: 70,
    minBand: 3,
    requireHuman: true,
    requireCredential: true,
    reviewThreshold: 60,
  },
  pool: {
    id: "premium-pool-v1",
    version: policyVersion,
    protocol: "pool",
    title: "Premium pool access",
    description: "Gate entry to a premium liquidity pool using strong reputation signals.",
    minTrustScore: 60,
    minBand: 3,
    requireHuman: true,
    requireCredential: false,
    reviewThreshold: 55,
  },
  rewards: {
    id: "rewards-access-v1",
    version: policyVersion,
    protocol: "rewards",
    title: "Reward claim",
    description: "Contributor rewards require a verified cohort signal and baseline trust.",
    minTrustScore: 45,
    minBand: 2,
    requireHuman: true,
    requireCredential: true,
    reviewThreshold: 50,
  },
  airdrop: {
    id: "airdrop-2026",
    version: policyVersion,
    protocol: "airdrop",
    title: "Airdrop claim",
    description: "Sybil-resistant distribution with human proof and cohort membership.",
    minTrustScore: 35,
    minBand: 1,
    requireHuman: true,
    requireCredential: false,
    reviewThreshold: 45,
  },
}

export const protocolPresets: Array<{
  key: TrustProtocol
  title: string
  description: string
  policyId: string
}> = [
  {
    key: "vault",
    title: trustPolicyCatalog.vault.title,
    description: trustPolicyCatalog.vault.description,
    policyId: trustPolicyCatalog.vault.id,
  },
  {
    key: "pool",
    title: trustPolicyCatalog.pool.title,
    description: trustPolicyCatalog.pool.description,
    policyId: trustPolicyCatalog.pool.id,
  },
  {
    key: "rewards",
    title: trustPolicyCatalog.rewards.title,
    description: trustPolicyCatalog.rewards.description,
    policyId: trustPolicyCatalog.rewards.id,
  },
  {
    key: "airdrop",
    title: trustPolicyCatalog.airdrop.title,
    description: trustPolicyCatalog.airdrop.description,
    policyId: trustPolicyCatalog.airdrop.id,
  },
]

export function getTrustPolicy(protocol: TrustProtocol): TrustPolicyProfile {
  return trustPolicyCatalog[protocol]
}

function buildSignalBreakdown(input: TrustInput, policy: TrustPolicyProfile): TrustSignalBreakdown {
  const normalizedBand = Math.max(0, Math.min(4, input.reputationBand))
  const contributions = [
    {
      key: "reputationBand" as const,
      label: "Reputation band",
      enabled: normalizedBand > 0,
      weight: 20,
      contribution: normalizedBand * 20,
    },
    {
      key: "humanProof" as const,
      label: "Human proof",
      enabled: input.humanProof,
      weight: 25,
      contribution: input.humanProof ? 25 : 0,
    },
    {
      key: "cohortMember" as const,
      label: "Cohort membership",
      enabled: input.cohortMember,
      weight: 15,
      contribution: input.cohortMember ? 15 : 0,
    },
    {
      key: "credentialVerified" as const,
      label: "Credential verification",
      enabled: input.credentialVerified,
      weight: 10,
      contribution: input.credentialVerified ? 10 : 0,
    },
  ]

  const trustScore = Math.min(100, contributions.reduce((total, item) => total + item.contribution, 0))

  const conditions = [
    {
      key: "wallet" as const,
      label: "Wallet present",
      passed: Boolean(input.wallet),
      reason: "Wallet address is required before verification.",
    },
    {
      key: "expired" as const,
      label: "Proof freshness",
      passed: !input.expired,
      reason: "Proof expired before verification.",
    },
    {
      key: "humanProof" as const,
      label: "Human proof",
      passed: !policy.requireHuman || input.humanProof,
      reason: "Human proof is required for this policy.",
    },
    {
      key: "credentialVerified" as const,
      label: "Credential status",
      passed: !policy.requireCredential || input.credentialVerified,
      reason: "Credential verification is required for this policy.",
    },
    {
      key: "reputationBand" as const,
      label: "Band threshold",
      passed: normalizedBand >= policy.minBand,
      reason: `Minimum band ${policy.minBand} is required.`,
    },
    {
      key: "trustScore" as const,
      label: "Score threshold",
      passed: trustScore >= policy.minTrustScore,
      reason: `Minimum trust score ${policy.minTrustScore} is required.`,
    },
    {
      key: "cohortMember" as const,
      label: "Cohort signal",
      passed: policy.protocol === "rewards" || policy.protocol === "airdrop" ? input.cohortMember : true,
      reason: "Cohort membership is required for this policy.",
    },
  ]

  return {
    normalizedBand,
    trustScore,
    maximumScore: 100,
    conditions,
    contributions,
  }
}

function collectFailureReasons(breakdown: TrustSignalBreakdown, policy: TrustPolicyProfile): string[] {
  const reasons: string[] = []

  if (!breakdown.conditions[0]?.passed) reasons.push("Wallet address is required before verification.")
  if (!breakdown.conditions[1]?.passed) reasons.push("Proof expired before verification.")
  if (!breakdown.conditions[2]?.passed) reasons.push("Human proof is required for this policy.")
  if (!breakdown.conditions[3]?.passed) reasons.push("Credential verification is required for this policy.")
  if (!breakdown.conditions[4]?.passed) reasons.push(`Minimum band ${policy.minBand} is required.`)
  if (!breakdown.conditions[5]?.passed) reasons.push(`Minimum trust score ${policy.minTrustScore} is required.`)
  if (!breakdown.conditions[6]?.passed) reasons.push("Cohort membership is required for this policy.")

  return reasons
}

export function evaluateTrust(input: TrustInput): TrustResult {
  const proofLibrary = input.proofLibrary ?? defaultProofLibrary
  const policy = getTrustPolicy(input.protocol)
  const breakdown = buildSignalBreakdown(input, policy)
  const bandLabel = `band-${breakdown.normalizedBand}`

  if (!input.wallet) {
    return {
      decision: "deny",
      trustScore: 0,
      bandLabel,
      policyVersion,
      policyId: policy.id,
      policy,
      proofLibrary,
      signalBreakdown: breakdown,
      reasons: ["Wallet address is required before verification."],
      summary: "Missing wallet address",
      wallet: input.wallet,
      protocol: input.protocol,
      proofId: input.proofId ?? "",
      verifiedAt: new Date().toISOString(),
      identityCommitment: input.identityCommitment,
    }
  }

  if (input.expired) {
    return {
      decision: "deny",
      trustScore: Math.max(0, breakdown.trustScore - 25),
      bandLabel,
      policyVersion,
      policyId: policy.id,
      policy,
      proofLibrary,
      signalBreakdown: breakdown,
      reasons: ["Proof expired before verification.", "A fresh browser-generated proof is required."],
      summary: "Expired proof",
      wallet: input.wallet,
      protocol: input.protocol,
      proofId: input.proofId ?? "",
      verifiedAt: new Date().toISOString(),
      identityCommitment: input.identityCommitment,
    }
  }

  const failureReasons = collectFailureReasons(breakdown, policy)
  const meetsPolicy = failureReasons.length === 0

  const reasons: string[] = [
    input.humanProof ? "Human proof verified." : "Human proof missing.",
    breakdown.normalizedBand >= 3
      ? "Wallet is in an elevated reputation band."
      : breakdown.normalizedBand >= 2
        ? "Wallet is in a reviewable reputation band."
        : "Wallet reputation is below the preferred threshold.",
  ]

  if (input.cohortMember) reasons.push("Wallet belongs to an allowed cohort.")
  if (input.credentialVerified) reasons.push("Credential or contributor status is verified.")

  if (meetsPolicy) {
    reasons.push(`Policy ${policy.id} matched for ${policy.title}.`)
    return {
      decision: "allow",
      trustScore: Math.min(100, breakdown.trustScore + 5),
      bandLabel,
      policyVersion,
      policyId: policy.id,
      policy,
      proofLibrary,
      signalBreakdown: breakdown,
      reasons,
      summary: "Policy matched",
      wallet: input.wallet,
      protocol: input.protocol,
      proofId: input.proofId ?? "",
      verifiedAt: new Date().toISOString(),
      identityCommitment: input.identityCommitment,
    }
  }

  const canReview = breakdown.trustScore >= policy.reviewThreshold && breakdown.conditions[0]?.passed && breakdown.conditions[1]?.passed

  if (canReview) {
    reasons.push("Policy returned the request for review.")
    reasons.push(...failureReasons)
    return {
      decision: "review",
      trustScore: breakdown.trustScore,
      bandLabel,
      policyVersion,
      policyId: policy.id,
      policy,
      proofLibrary,
      signalBreakdown: breakdown,
      reasons,
      summary: "Manual review recommended",
      wallet: input.wallet,
      protocol: input.protocol,
      proofId: input.proofId ?? "",
      verifiedAt: new Date().toISOString(),
      identityCommitment: input.identityCommitment,
    }
  }

  return {
    decision: "deny",
    trustScore: breakdown.trustScore,
    bandLabel,
    policyVersion,
    policyId: policy.id,
    policy,
    proofLibrary,
    signalBreakdown: breakdown,
    reasons: [...reasons, ...failureReasons],
    summary: "Policy denied access",
    wallet: input.wallet,
    protocol: input.protocol,
    proofId: input.proofId ?? "",
    verifiedAt: new Date().toISOString(),
    identityCommitment: input.identityCommitment,
  }
}
