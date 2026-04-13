# NebulaID Gateway SDK

Integrate trust verification, Semaphore proofs, and on-chain enforcement into your dApp on HashKey Chain.

## Installation

```bash
npm install @nebulaid/gateway-sdk
# or
yarn add @nebulaid/gateway-sdk
```

## Quick Start

```typescript
import { createGatewayClient, HASHKEY_TESTNET, DEPLOYED_CONTRACTS } from "@nebulaid/gateway-sdk"

// Initialize the client
const gatewayClient = createGatewayClient({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  chainId: HASHKEY_TESTNET.id,
  contracts: DEPLOYED_CONTRACTS,
})

// Verify trust
const result = await gatewayClient.verify({
  wallet: "0x1234...",
  protocol: "vault",
  reputationBand: 4,
  humanProof: true,
  cohortMember: true,
  credentialVerified: true,
  expired: false,
  proofLibrary: "semaphore",
  proofId: "",
})

console.log(result.decision) // "allow" | "review" | "deny"
console.log(result.trustScore) // 0-100
console.log(result.bandLabel) // "Bronze" | "Silver" | "Gold" | "Platinum"
```

## Three Integration Surfaces

### 1. Gateway API Client

```typescript
import { createGatewayClient } from "@nebulaid/gateway-sdk/client"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
const client = createGatewayClient({ apiBaseUrl: apiUrl })

// Verify trust eligibility
const result = await client.verify({
  wallet: "0x...",
  protocol: "vault",
  // ... other signals
})

// Get on-chain trust score
const score = await client.getTrustScore("0x...")

// Fetch audit trail
const audit = await client.getAuditTrail()
```

### 2. React Hooks

```tsx
import { useTrustScore, useAuditTrail, useSemaphoreProof, createIdentity } from "@nebulaid/gateway-sdk/hooks"

function VaultAccess() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const { verify, isLoading, error, result, presets } = useTrustScore(apiUrl)
  const { generate, isLoading: isGenerating, proof } = useSemaphoreProof(apiUrl)

  const handleVerify = async () => {
    // Get or create Semaphore identity for this wallet
    const identity = createIdentity("0x1234...")
    
    // First verify trust
    const trustResult = await verify({
      wallet: "0x1234...",
      protocol: "vault",
      reputationBand: 3,
      humanProof: true,
      cohortMember: true,
      credentialVerified: true,
      expired: false,
    })

    // If allowed, generate Semaphore proof
    if (trustResult.decision === "allow") {
      const proofResult = await generate({
        wallet: "0x1234...",
        protocol: "vault",
        policyVersion: trustResult.policyVersion,
        trustScore: trustResult.trustScore,
        identity,
      })
      // Use proofResult.nullifier for on-chain registration
    }
  }

  if (result?.decision === "allow") {
    return <VaultComponent />
  }

  return <AccessDenied />
}
```

#### Hooks Available

| Hook | Purpose |
|------|---------|
| `useTrustScore(apiBaseUrl)` | Verify trust and get decision |
| `useAuditTrail(apiBaseUrl)` | Fetch verification/audit history |
| `useSemaphoreProof(apiBaseUrl)` | Generate Semaphore ZK proof |
| `createIdentity(wallet)` | Get or create persistent Semaphore identity |

### 3. Contract Bindings

```typescript
import { 
  trustVerifierAbi, 
  DEPLOYED_CONTRACTS,
  createUseNullifierData,
  HASHKEY_TESTNET 
} from "@nebulaid/gateway-sdk/contracts"
import { writeContract } from "wagmi"

// Register nullifier on-chain after proof verification
await writeContract({
  address: DEPLOYED_CONTRACTS.TrustVerifier,
  abi: trustVerifierAbi,
  functionName: "useNullifier",
  args: ["0x..."], // the nullifier from proof
})
```

### Complete Integration Example

```tsx
import { useAccount } from "wagmi"
import { useTrustScore, useSemaphoreProof, createIdentity } from "@nebulaid/gateway-sdk/hooks"
import { trustVerifierAbi, DEPLOYED_CONTRACTS } from "@nebulaid/gateway-sdk/contracts"

function MyComponent() {
  const { address } = useAccount()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const { verify, result } = useTrustScore(apiUrl)
  const { generate, proof } = useSemaphoreProof(apiUrl)

  const handleAccess = async () => {
    if (!address) return

    // 1. Get or create Semaphore identity
    const identity = createIdentity(address)

    // 2. Verify trust
    const trustResult = await verify({
      wallet: address,
      protocol: "vault",
      reputationBand: 4,
      humanProof: true,
      cohortMember: true,
      credentialVerified: true,
      expired: false,
    })

    if (trustResult.decision !== "allow") {
      console.log("Access denied:", trustResult.reasons)
      return
    }

    // 3. Generate Semaphore proof
    const proofResult = await generate({
      wallet: address,
      protocol: "vault",
      policyVersion: trustResult.policyVersion,
      trustScore: trustResult.trustScore,
      identity,
    })

    // 4. Register nullifier on-chain (using wagmi)
    await writeContract({
      address: DEPLOYED_CONTRACTS.TrustVerifier,
      abi: trustVerifierAbi,
      functionName: "useNullifier",
      args: [proofResult.nullifier as `0x${string}`],
    })

    console.log("Access granted! Proof ID:", proofResult.nullifier)
  }

  return (
    <button onClick={handleAccess}>
      {result?.decision === "allow" ? "Access Granted" : "Request Access"}
    </button>
  )
}
```

## Configuration

```typescript
const config: SDKConfig = {
  apiBaseUrl: "https://your-nebula-deployment.com",
  chainId: 133, // HashKey Testnet
  contracts: {
    trustVerifier: "0xC284Be07898768F0818aAeC84A0bD95Bc5275670",
    trustPolicy: "0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF",
    trustGateway: "0x6E83054913aA6C616257Dae2e87BC44F9260EDc6",
  },
}
```

## Pre-configured Constants

```typescript
import { HASHKEY_TESTNET, DEPLOYED_CONTRACTS } from "@nebulaid/gateway-sdk/contracts"

HASHKEY_TESTNET.id           // 133
HASHKEY_TESTNET.name         // "HashKey Chain Testnet"
HASHKEY_TESTNET.rpcUrl       // "https://testnet.hsk.xyz"
HASHKEY_TESTNET.explorerUrl  // "https://testnet.hsk.xyz"

DEPLOYED_CONTRACTS.TrustVerifier // HashKey testnet address
DEPLOYED_CONTRACTS.TrustPolicy
DEPLOYED_CONTRACTS.TrustGateway
```

## Supported Protocols

| Protocol | Use Case | Requirements |
|----------|----------|--------------|
| `vault` | Premium vault access | Band ≥ 4, human proof, cohort member |
| `pool` | Lending pool access | Band ≥ 3, human proof, cohort member |
| `rewards` | Reward program claims | Band ≥ 2, human proof, credential |
| `airdrop` | Sybil-resistant airdrops | Band ≥ 2, human proof |

## Types

```typescript
type TrustDecision = "allow" | "review" | "deny"

type TrustResult = {
  decision: TrustDecision
  trustScore: number      // 0-100
  band: number            // 0-4
  bandLabel: string       // "Bronze" | "Silver" | "Gold" | "Platinum"
  policyVersion: string  // e.g., "nebula-trust-v1"
  reasons: string[]       // Why this decision was made
  summary: string        // Human-readable summary
  verifiedAt: string     // ISO timestamp
  proofId: string        // Semaphore nullifier
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Your dApp                               │
├─────────────────────────────────────────────────────────────┤
│  GatewayClient      React Hooks         Contract Bindings   │
│       │                 │                    │              │
│       ▼                 ▼                    ▼              │
│  ┌─────────┐       ┌───────────┐        ┌─────────────┐   │
│  │  API    │       │  Trust    │        │  HashKey    │   │
│  │ Verify  │       │ Eval      │        │  Contracts  │   │
│  └────┬────┘       └─────┬─────┘        └──────┬──────┘   │
│       │                  │                     │          │
│       ▼                  ▼                     ▼          │
│  /api/trust/verify   Semaphore Proof     TrustVerifier      │
│  /api/audit          /api/semaphore/*   TrustGateway       │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT