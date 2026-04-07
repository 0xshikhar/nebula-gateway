# Nebula Trust Gateway Contracts

Smart contracts for Nebula Trust Gateway — protocol-level trust verification on HashKey Chain.

## Contracts

| Contract | Purpose |
|----------|---------|
| `TrustVerifier.sol` | Stores and verifies trust scores for wallets |
| `TrustPolicy.sol` | Manages trust policies for protocols |
| `TrustGateway.sol` | Records trust decisions and policy versions for the app |
| `TrustAccessControl.sol` | Access control modifiers for DeFi protocols |
| `interfaces/ITrustGateway.sol` | Shared interfaces |

## Architecture

```
┌─────────────────────────────────────────────┐
│          DeFi Protocol                      │
│  (Vault / Pool / Airdrop)                  │
│         │                                │
│         ▼                                │
│  TrustAccessControl (modifier)             │
│         │                                │
│         ▼                                │
│  TrustPolicy (policy rules)                │
│         │                                │
│         ▼                                │
│  TrustVerifier (score storage)             │
└─────────────────────────────────────────────┘
```

## Contract Details

### TrustVerifier

Stores trust scores with expiry. Used by access-controlled contracts.

```solidity
TrustVerifier verifier = TrustVerifier(0x...);

// Update a user's trust score
verifier.updateTrustScore(user, 85, 4);

// Check if user meets minimum band
verifier.verify(user, 3);  // reverts if fails

// Get current score
(uint256 score, uint256 band, bool isValid) = verifier.getTrustScore(user);
```

### TrustPolicy

Defines trust policies for different protocols.

```solidity
TrustPolicy policy = TrustPolicy(0x...);

// Create a policy
policy.createPolicy(
    keccak256("lending-pool-v1"),
    "Lending Pool Access",
    50,   // min score
    2,     // min band
    true,   // require human
    false   // require credential
);

// Evaluate a user against policy
(bool allowed, string[] memory reasons) = policy.evaluatePolicy(
    user,
    keccak256("lending-pool-v1"),
    85,  // user score
    4,   // user band
    true, // is human
    false // has credential
);
```

### TrustAccessControl

Base contract for access-controlled DeFi protocols.

```solidity
contract MyVault is TrustAccessControl {
    function getRequiredBand() internal view override returns (uint256) {
        return 3;
    }

    function deposit() external payable onlyTrusted(msg.sender) {
        // Deposit logic
    }
}
```

## DeFi Use Cases

| Protocol | Contract | Min Band |
|----------|----------|----------|
| Basic vault | `TrustVault` | 2 |
| Premium pool | `TrustPool` | 3 |
| Airdrop | `TrustAirdrop` | 1 |

## Deployment

### HashKey Chain Testnet

```bash
# Compile
npx hardhat compile

# Deploy
npx hardhat run scripts/deploy.js --network hashkeyTestnet
```

### Hardhat Config

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: { version: "0.8.24" },
  networks: {
    hashkeyTestnet: {
      url: "https://testnet.hsk.xyz",
      chainId: 133,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

## Integration

### API-First (Recommended)

1. Protocol signs up at Nebula dashboard
2. Gets API key and policy config
3. Calls API for verification
4. On approval, calls contract

### Contract-Only

1. Protocol deploys TrustAccessControl contracts
2. Sets verifier/policy addresses
3. User verification happens on-chain

### Hybrid

1. API generates trust scores off-chain
2. Scores synced to TrustVerifier
3. Contract checks on-chain

## Events

### TrustVerifier
- `TrustScoreUpdated(address user, uint256 score, uint256 band)`

### TrustPolicy
- `PolicyCreated(bytes32 policyId, string name, ...)`
- `PolicyUpdated(bytes32 policyId)`
- `UserApproved(address user, bytes32 policyId, ...)`
- `UserDenied(address user, bytes32 policyId, string reason)`

## Errors

| Error | Description |
|-------|-------------|
| `InvalidProof` | ZK proof verification failed |
| `PolicyNotFound` | Policy doesn't exist |
| `ExpiredTrustScore` | Score has expired |
| `InsufficientTrust` | User doesn't meet requirements |
| `AccessDenied` | Access control check failed |
| `TrustVerificationFailed` | Trust requirements not met |
