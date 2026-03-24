import type { Address } from "viem"

export const nebulaTrustGateAddress = (process.env.NEXT_PUBLIC_NEBULA_TRUST_GATE_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address

export const nebulaPolicyRegistryAddress = (process.env.NEXT_PUBLIC_NEBULA_POLICY_REGISTRY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address

export const hasNebulaTrustGate = nebulaTrustGateAddress !== "0x0000000000000000000000000000000000000000"

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

export const trustDecisionLabels: Record<number, "allow" | "review" | "deny"> = {
  0: "deny",
  1: "review",
  2: "allow",
}
