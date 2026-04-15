import {
  Shield,
  Lock,
  Users,
  Globe,
  Zap,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Hexagon,
  Layers,
  Hash,
  Fingerprint,
  Database,
  Code2,
  Target,
  Gift,
  Wallet,
  BarChart3,
  Clock,
  ShieldCheck,
} from "lucide-react"

export const useCases = [
  {
    icon: Gift,
    title: "Airdrop Protection",
    description:
      "Verify human proof before token claims so bots and farm wallets do not drain the distribution.",
    metric: "90%+ blocked",
    tags: ["Privacy-first", "No KYC", "Anti-bot"],
    gradient: "from-orange-500/20 to-amber-500/20",
    border: "border-orange-500/20",
  },
  {
    icon: Wallet,
    title: "Vault Access",
    description:
      "Gate premium vaults and lending pools by trust band so only verified humans can enter.",
    metric: "140ms checks",
    tags: ["Trust bands", "HashKey", "Real-time"],
    gradient: "from-emerald-500/20 to-cyan-500/20",
    border: "border-emerald-500/20",
  },
  {
    icon: BarChart3,
    title: "Reward Programs",
    description:
      "Reward contributors and partners without exposing raw identity, wallet history, or private labels.",
    metric: "Zero identity leak",
    tags: ["Privacy-first", "Auditable", "Cohorts"],
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/20",
  },
  {
    icon: Target,
    title: "Cohort Gating",
    description:
      "Create exclusive groups for early supporters, contributors, or partners without tracking them.",
    metric: "Private membership",
    tags: ["ZK proof", "Access control", "No tracking"],
    gradient: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/20",
  },
]

export const features = [
  {
    icon: Fingerprint,
    title: "ZK-Proof Identity",
    description:
      "Semaphore proofs let users prove trustworthiness without revealing wallet addresses or identity.",
    tags: ["Privacy-first", "No KYC"],
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description:
      "Browser-generated proofs verify in 140ms through a stable API. No waiting, no complexity.",
    tags: ["140ms", "Serverless"],
  },
  {
    icon: Layers,
    title: "Policy Engine",
    description:
      "Customizable policies return allow, review, or deny. Build your own rules for reputation bands and eligibility.",
    tags: ["Customizable", "Granular"],
  },
  {
    icon: Database,
    title: "Audit Trail",
    description:
      "Every verification is logged with proof metadata, policy version, and decision reasons.",
    tags: ["Full history", "Compliance"],
  },
  {
    icon: Code2,
    title: "Drop-in SDK",
    description:
      "npm install @nebulaid/gateway-sdk. One API, one decision flow. Integrate in 10 minutes, not weeks.",
    tags: ["TypeScript", "React"],
  },
  {
    icon: Globe,
    title: "HashKey Native",
    description:
      "Built for HashKey Chain from day one. Deployed on testnet with live contract integration.",
    tags: ["Deployed", "Live"],
  },
]

export const steps = [
  {
    number: "01",
    title: "npm install",
    description: "Install the SDK in your project",
    code: "npm install @nebulaid/gateway-sdk",
  },
  {
    number: "02",
    title: "Initialize Client",
    description: "Set up the trust client with your config",
    code: `import { createTrustClient, HASHKEY_TESTNET, DEPLOYED_CONTRACTS, defaultProofLibrary } from "@nebulaid/gateway-sdk"

const trustClient = createTrustClient({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  chainId: HASHKEY_TESTNET.id,
  contracts: DEPLOYED_CONTRACTS,
  proofLibrary: defaultProofLibrary,
})`,
  },
  {
    number: "03",
    title: "Verify Trust",
    description: "One API call returns allow, review, or deny",
    code: `const result = await trustClient.verify({
  wallet: "0x1234...",
  protocol: "vault",
  reputationBand: 4,
  humanProof: true,
  cohortMember: true,
  credentialVerified: true,
  expired: false,
})

console.log(result.decision) // "allow" | "review" | "deny"`,
  },
  {
    number: "04",
    title: "On-Chain Enforcement",
    description: "Register nullifier to prevent replay attacks",
    code: `await writeContract({
  address: DEPLOYED_CONTRACTS.TrustVerifier,
  abi: trustVerifierAbi,
  functionName: "useNullifier",
  args: [normalizeBytes32(proof.nullifier)],
})`,
  },
]

export const protocols = [
  { 
    name: "Vault", 
    status: "Premium vaults", 
    requirements: "Band 4+, Human, Cohort",
    color: "bg-emerald-500",
  },
  { 
    name: "Pool", 
    status: "Lending pools", 
    requirements: "Band 3+, Human",
    color: "bg-cyan-500",
  },
  { 
    name: "Airdrop", 
    status: "Token claims", 
    requirements: "Band 2+, Human",
    color: "bg-orange-500",
  },
  { 
    name: "Rewards", 
    status: "Programs", 
    requirements: "Band 2+, Credential",
    color: "bg-purple-500",
  },
]

export const stats = [
  { label: "Verification time", value: "140ms", icon: Clock },
  { label: "Sybil blocked", value: "90%+", icon: ShieldCheck },
  { label: "Wallet addresses", value: "0 exposed", icon: Lock },
  { label: "Integration time", value: "10 min", icon: Zap },
]

export const codeHighlight = `const result = await trustClient.verify({
  wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f89fE1",
  protocol: "vault",
  reputationBand: 4,
  humanProof: true,
  cohortMember: true,
  credentialVerified: true,
  expired: false,
  proofLibrary: defaultProofLibrary,
})

console.log(result.decision)   // "allow" | "review" | "deny"
console.log(result.trustScore) // 0-100
console.log(result.bandLabel)  // "Bronze" | "Silver" | "Gold" | "Platinum"`

export const trustDecisionExample = {
  decision: "allow",
  trustScore: 92,
  band: 4,
  bandLabel: "Platinum",
  policyVersion: "nebula-trust-v1",
  reasons: [
    "Reputation band meets vault requirements",
    "Human proof verified",
    "Cohort member in good standing",
    "No expired credentials",
  ],
  summary: "User qualifies for premium vault access",
  verifiedAt: new Date().toISOString(),
  proofId: "0x7f9...",
}
