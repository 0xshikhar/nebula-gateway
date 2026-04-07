import latestDeployment from "@/deployments/latest.json"

import type { Address } from "viem"

type DeploymentContracts = Partial<Record<
  "TrustVerifier" | "TrustPolicy" | "TrustGateway" | "TrustVault" | "TrustPool" | "TrustAirdrop" | "MockUSDC",
  string
>>

const zeroAddress = "0x0000000000000000000000000000000000000000" as const
const deploymentContracts = (latestDeployment.contracts ?? {}) as DeploymentContracts

function resolveAddress(envValue: string | undefined, contractName: keyof DeploymentContracts): Address {
  return (envValue ?? deploymentContracts[contractName] ?? zeroAddress) as Address
}

export const nebulaTrustGateAddress = resolveAddress(
  process.env.NEXT_PUBLIC_NEBULA_TRUST_GATE_ADDRESS,
  "TrustGateway",
)

export const nebulaPolicyRegistryAddress = resolveAddress(
  process.env.NEXT_PUBLIC_NEBULA_POLICY_REGISTRY_ADDRESS,
  "TrustPolicy",
)

export const nebulaTrustVerifierAddress = resolveAddress(
  process.env.NEXT_PUBLIC_NEBULA_TRUST_VERIFIER_ADDRESS,
  "TrustVerifier",
)

export const hasNebulaTrustGate = nebulaTrustGateAddress !== zeroAddress
export const hasNebulaPolicyRegistry = nebulaPolicyRegistryAddress !== zeroAddress
export const hasNebulaTrustVerifier = nebulaTrustVerifierAddress !== zeroAddress

export const nebulaTrustGateAbi = [
  {
    type: "function",
    name: "policyVersion",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decisionCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lastDecision",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [
      { name: "decision", type: "uint8" },
      { name: "trustScore", type: "uint256" },
      { name: "policyVersion", type: "string" },
      { name: "proofId", type: "bytes32" },
    ],
  },
  {
    type: "function",
    name: "recordDecision",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "decision", type: "uint8" },
      { name: "trustScore", type: "uint256" },
      { name: "proofId", type: "bytes32" },
      { name: "policyVersion", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "publishPolicy",
    stateMutability: "nonpayable",
    inputs: [{ name: "policyVersion", type: "string" }],
    outputs: [],
  },
] as const

export const trustVerifierAbi = [
  {
    type: "function",
    name: "updateTrustScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "score", type: "uint256" },
      { name: "band", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getTrustScore",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "score", type: "uint256" },
      { name: "band", type: "uint256" },
      { name: "isValid", type: "bool" },
    ],
  },
] as const

export const trustPolicyAbi = [
  {
    type: "function",
    name: "getPolicy",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "bytes32" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "minTrustScore", type: "uint256" },
      { name: "minBand", type: "uint256" },
      { name: "requireHuman", type: "bool" },
      { name: "requireCredential", type: "bool" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "listPolicies",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
] as const

export const trustDecisionLabels: Record<number, "allow" | "review" | "deny"> = {
  0: "deny",
  1: "review",
  2: "allow",
}
