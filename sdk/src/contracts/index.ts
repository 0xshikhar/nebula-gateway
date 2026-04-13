import { keccak256, stringToHex, encodeFunctionData, decodeFunctionResult, toHex } from "viem"
import type { Address } from "viem"

export const trustVerifierAbi = [
  {
    type: "constructor",
    inputs: [{ name: "_owner", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  { type: "error", name: "ExpiredTrustScore", inputs: [] },
  {
    type: "error",
    name: "InsufficientTrust",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "required", type: "uint256", internalType: "uint256" },
      { name: "actual", type: "uint256", internalType: "uint256" },
    ],
  },
  { type: "error", name: "InvalidProof", inputs: [] },
  { type: "error", name: "OwnableInvalidOwner", inputs: [{ name: "owner", type: "address", internalType: "address" }] },
  { type: "error", name: "OwnableUnauthorizedAccount", inputs: [{ name: "account", type: "address", internalType: "address" }] },
  {
    type: "function",
    name: "BAND_THRESHOLD_1",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "BAND_THRESHOLD_2",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "BAND_THRESHOLD_3",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "BAND_THRESHOLD_4",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SCORE_EXPIRY",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SCORE_MAX",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkTrust",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "requiredScore", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBand",
    inputs: [{ name: "score", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getTrustScore",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "score", type: "uint256", internalType: "uint256" },
      { name: "band", type: "uint256", internalType: "uint256" },
      { name: "isValid", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isNullifierUsed",
    inputs: [{ name: "nullifier", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "trustScores",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [
      { name: "score", type: "uint256", internalType: "uint256" },
      { name: "band", type: "uint256", internalType: "uint256" },
      { name: "updatedAt", type: "uint256", internalType: "uint256" },
      { name: "expiresAt", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateTrustScore",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "score", type: "uint256", internalType: "uint256" },
      { name: "band", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "useNullifier",
    inputs: [{ name: "nullifier", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "usedNullifiers",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verify",
    inputs: [
      { name: "proof", type: "tuple", internalType: "struct ITrustGateway.Proof", components: [
        { name: "a", type: "uint256[2]", internalType: "uint256[2]" },
        { name: "b", type: "uint256[2][2]", internalType: "uint256[2][2]" },
        { name: "c", type: "uint256[2]", internalType: "uint256[2]" },
      ]},
      { name: "root", type: "uint256", internalType: "uint256" },
      { name: "leaf", type: "uint256", internalType: "uint256" },
      { name: "nullifierHash", type: "uint256", internalType: "uint256" },
      { name: "soundness", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const

export const trustPolicyAbi = [
  {
    type: "constructor",
    inputs: [{ name: "_owner", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  { type: "error", name: "PolicyAlreadyExists", inputs: [] },
  { type: "error", name: "PolicyNotFound", inputs: [] },
  { type: "error", name: "OwnableInvalidOwner", inputs: [{ name: "owner", type: "address", internalType: "address" }] },
  { type: "error", name: "OwnableUnauthorizedAccount", inputs: [{ name: "account", type: "address", internalType: "address" }] },
  {
    type: "function",
    name: "createPolicy",
    inputs: [
      { name: "policyId", type: "bytes32", internalType: "bytes32" },
      { name: "name", type: "string", internalType: "string" },
      { name: "minTrustScore", type: "uint256", internalType: "uint256" },
      { name: "minBand", type: "uint256", internalType: "uint256" },
      { name: "requireHuman", type: "bool", internalType: "bool" },
      { name: "requireCredential", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deletePolicy",
    inputs: [{ name: "policyId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPolicy",
    inputs: [{ name: "policyId", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "minTrustScore", type: "uint256", internalType: "uint256" },
      { name: "minBand", type: "uint256", internalType: "uint256" },
      { name: "requireHuman", type: "bool", internalType: "bool" },
      { name: "requireCredential", type: "bool", internalType: "bool" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "listPolicies",
    inputs: [],
    outputs: [{ name: "", type: "bytes32[]", internalType: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "policies",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "minTrustScore", type: "uint256", internalType: "uint256" },
      { name: "minBand", type: "uint256", internalType: "uint256" },
      { name: "requireHuman", type: "bool", internalType: "bool" },
      { name: "requireCredential", type: "bool", internalType: "bool" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updatePolicy",
    inputs: [
      { name: "policyId", type: "bytes32", internalType: "bytes32" },
      { name: "name", type: "string", internalType: "string" },
      { name: "minTrustScore", type: "uint256", internalType: "uint256" },
      { name: "minBand", type: "uint256", internalType: "uint256" },
      { name: "requireHuman", type: "bool", internalType: "bool" },
      { name: "requireCredential", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const

export const trustGatewayAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_verifier", type: "address", internalType: "address" },
      { name: "_policy", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "error", name: "InvalidDecision", inputs: [] },
  {
    type: "function",
    name: "decisionCount",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDecisionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lastDecision",
    inputs: [{ name: "wallet", type: "address", internalType: "address" }],
    outputs: [
      { name: "decision", type: "uint8", internalType: "uint8" },
      { name: "trustScore", type: "uint256", internalType: "uint256" },
      { name: "policyVersion", type: "string", internalType: "string" },
      { name: "proofId", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "policyVersion",
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "publishPolicy",
    inputs: [{ name: "_policyVersion", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "recordDecision",
    inputs: [
      { name: "wallet", type: "address", internalType: "address" },
      { name: "decision", type: "uint8", internalType: "uint8" },
      { name: "trustScore", type: "uint256", internalType: "uint256" },
      { name: "proofId", type: "bytes32", internalType: "bytes32" },
      { name: "policyVersion", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const

export const mockUsdcAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_name", type: "string", internalType: "string" },
      { name: "_symbol", type: "string", internalType: "string" },
      { name: "_decimals", type: "uint8", internalType: "uint8" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "error", name: "OwnableInvalidOwner", inputs: [{ name: "owner", type: "address", internalType: "address" }] },
  { type: "error", name: "OwnableUnauthorizedAccount", inputs: [{ name: "account", type: "address", internalType: "address" }] },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const

export const HASHKEY_TESTNET = {
  id: 133,
  name: "HashKey Chain Testnet",
  rpcUrl: "https://testnet.hsk.xyz",
  explorerUrl: "https://testnet.hsk.xyz",
} as const

export const DEPLOYED_CONTRACTS = {
  TrustVerifier: "0xC284Be07898768F0818aAeC84A0bD95Bc5275670",
  TrustPolicy: "0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF",
  TrustGateway: "0x6E83054913aA6C616257Dae2e87BC44F9260EDc6",
  TrustVault: "0x6e7815385eefc8Dc5f3bc69fA71142E42ed0C285",
  TrustPool: "0x148A1e47F39Aff9cFB799c5ed05C6a51dDf763BB",
  TrustAirdrop: "0x1D5F17Df84a00B7cA5275F484932dd54057bdC24",
  MockUSDC: "0x9C32C13CEA7c0CCe7dd678CF2D9065442A91455B",
} as const

export function normalizeBytes32(value: string | bigint | number) {
  return toHex(BigInt(value), { size: 32 })
}

export function createUseNullifierData(nullifier: string | bigint | number) {
  return encodeFunctionData({
    abi: trustVerifierAbi,
    functionName: "useNullifier",
    args: [normalizeBytes32(nullifier)],
  })
}

export function createRecordDecisionData(params: {
  wallet: Address
  decision: number
  trustScore: bigint
  proofId: string
  policyVersion: string
}) {
  const proofIdBytes = keccak256(stringToHex(params.proofId))
  return encodeFunctionData({
    abi: trustGatewayAbi,
    functionName: "recordDecision",
    args: [params.wallet, params.decision, params.trustScore, proofIdBytes, params.policyVersion],
  })
}

export function createGetTrustScoreData(wallet: Address) {
  return encodeFunctionData({
    abi: trustVerifierAbi,
    functionName: "getTrustScore",
    args: [wallet],
  })
}

export function parseTrustScoreResult(result: `0x${string}`): { score: bigint; band: bigint; isValid: boolean } {
  const decoded = decodeFunctionResult({
    abi: trustVerifierAbi,
    functionName: "getTrustScore",
    data: result,
  }) as [bigint, bigint, boolean]
  return {
    score: decoded[0],
    band: decoded[1],
    isValid: decoded[2],
  }
}
