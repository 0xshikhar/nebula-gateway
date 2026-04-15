export { TrustClient, createTrustClient, GatewayClient, createGatewayClient, SemaphoreClient, createSemaphoreClient, DEFAULT_API_URL } from "./client/index.js"
export { useTrustScore, useAuditTrail, useSemaphoreProof, createIdentity, getOrCreateSemaphoreIdentity } from "./hooks/index.js"
export {
  evaluateTrust,
  getTrustPolicy,
  protocolPresets,
  trustPolicyCatalog,
  defaultProofLibrary,
  policyVersion,
} from "./trust-engine.js"
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
  TrustProofLibrary,
  TrustInput,
  TrustResult,
  TrustScoreResult,
  TrustAuditTrail,
  TrustPolicy,
  TrustPolicyProfile,
  TrustSignalBreakdown,
  TrustGateCondition,
  TrustSignalContribution,
  SemaphoreProof,
  OnChainDecision,
  SDKConfig,
} from "./types/index.js"
