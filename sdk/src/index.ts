export { GatewayClient, createGatewayClient, SemaphoreClient, createSemaphoreClient } from "./client/index.js"
export { useTrustScore, useAuditTrail, useSemaphoreProof, createIdentity } from "./hooks/index.js"
export {
  trustVerifierAbi,
  trustPolicyAbi,
  trustGatewayAbi,
  mockUsdcAbi,
  HASHKEY_TESTNET,
  DEPLOYED_CONTRACTS,
  normalizeBytes32,
  createUseNullifierData,
  createRecordDecisionData,
  createGetTrustScoreData,
  parseTrustScoreResult,
} from "./contracts/index.js"
export type {
  TrustProtocol,
  TrustDecision,
  TrustInput,
  TrustResult,
  TrustPolicy,
  SemaphoreProof,
  OnChainDecision,
  SDKConfig,
} from "./types/index.js"
