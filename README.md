# Nebula Gateway

<p align="center">
  <strong>The Privacy-Preserving Trust Layer for HashKey Chain</strong>
</p>

<p align="center">
  <a href="https://testnet-explorer.hsk.xyz/address/0xC284Be07898768F0818aAeC84A0bD95Bc5275670">
    <img src="https://img.shields.io/badge/Contract-0xC284Be07...675670-blue" alt="TrustVerifier" />
  </a>
  <a href="https://testnet-explorer.hsk.xyz/address/0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF">
    <img src="https://img.shields.io/badge/Policy-0x52EbCBf8...9bffF-blue" alt="TrustPolicy" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  <a href="https://discord.gg/nebulaid">
    <img src="https://img.shields.io/badge/Discord-Join-purple" alt="Discord" />
  </a>
</p>

---

## The Problem

Every DeFi protocol faces the same fundamental challenge: **How do you know if a wallet belongs to a real human worth trusting — without surveillance?**

The current options are broken:

- **KYC/AML** — Invasive, expensive, creates honeypots of identity data
- **Token-gating** — Easy to bypass with multi-wallets (sybil attacks)
- **Governance tokens** — Only prevents new users, not determined attackers
- **Manual review** — Doesn't scale, expensive, subjective
- **Centralized identity systems** — Creates honeypots, users lose privacy

The cost is measured in billions annually:
- Airdrops drained by sybils
- Vaults exploited by coordinated attackers
- Reward programs gamed by farmers

**HashKey Chain has no trust layer.** We're building it.

---

## What Is Nebula?

Nebula Gateway is a **privacy-preserving trust infrastructure layer** for HashKey Chain that enables protocols to verify:

- **Humanity** — Is this a real person, not a bot?
- **Reputation** — What's the trust band/score of this wallet?
- **Eligibility** — Does this wallet meet the access policy?
- **Cohort Membership** — Is this wallet part of an allowed group?

**Without ever seeing who the user is.**

### Core Principles

1. **Zero Identity Leakage** — Protocols never see wallet addresses, transaction history, or any identifying information
2. **Privacy by Default** — Users don't sacrifice anonymity to prove legitimacy
3. **Developer Experience** — One SDK install, one API call, 10 minutes to integrate
4. **Built for HashKey** — Every line of code optimized for the HashKey ecosystem

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER                                          │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │   Wallet    │───▶│  Browser SDK    │───▶│   Semaphore Proof Gen      │  │
│  │ Connection │    │  (RainbowKit)   │    │   (Zero-Knowledge)         │  │
│  └─────────────┘    └─────────────────┘    └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OFF-CHAIN LAYER                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ Trust Verify    │    │ Semaphore       │    │ Audit Trail             │  │
│  │ API            │    │ Verify API      │    │ (Prisma + Accelerate)   │  │
│  │ /api/trust/*   │    │ /api/semaphore*│    │ /api/audit             │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                       │                    │
│           ▼                       ▼                       ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    Policy Engine                                      │  │
│  │  • Trust Score Calculation (70% weight for signals)                     │  │
│  │  • Policy Evaluation (min score, band, human, credential checks)       │  │
│  │  • Signal Breakdown & Contributions                                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Proof + Nullifier
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ON-CHAIN LAYER (HashKey)                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ TrustVerifier  │    │ TrustPolicy    │    │ TrustGateway           │  │
│  │  • Scores      │    │  • Policy CRUD │    │  • Decisions           │  │
│  │  • Bands       │    │  • Evaluation  │    │  • Versioning         │  │
│  │  • Nullifiers  │    │  • Approvals    │    │  • Audit              │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

| Layer | Component | Purpose | Location |
|-------|-----------|---------|----------|
| Frontend | RainbowKit + Wagmi | Wallet connection on HashKey | `web-app/` |
| Frontend | Semaphore Proof Gen | Browser-based ZK proofs | `web-app/src/lib/nebula-semaphore.ts` |
| Frontend | Trust Engine | Policy evaluation logic | `web-app/src/lib/nebula-trust.ts` |
| API | Trust Verify API | Score + decision endpoint | `/api/trust/verify` |
| API | Semaphore Verify API | Proof verification | `/api/semaphore/verify` |
| API | Audit API | Verification history | `/api/audit` |
| Contracts | TrustVerifier | Score, bands, nullifiers | `contracts/src/TrustVerifier.sol` |
| Contracts | TrustPolicy | Policy CRUD, evaluation | `contracts/src/TrustPolicy.sol` |
| Contracts | TrustGateway | Decision recording | `contracts/src/TrustGateway.sol` |
| SDK | @nebulaid/gateway-sdk | Protocol integration | `sdk/` |

---

## How Verification Works

### The Flow

```
     USER                              NEBULA                          CHAIN
      │                                 │                              │
      │  1. Connect Wallet             │                              │
      │───────────────────────────────▶│                              │
      │                                 │                              │
      │  2. Request Access            │                              │
      │◀──────────────────────────────│                              │
      │                                 │                              │
      │  3. Generate ZK Proof        │                              │
      │  (Semaphore)               │                              │
      │  • Identity commitment       │                              │
      │  • Merkle tree (group)     │                              │
      │  • Scope (protocol)       │                              │
      │  • Message (score)      │                              │
      │                                 │                              │
      │  4. Submit Proof         │                              │
      │═══════════════════════════▶│                              │
      │                                 │                              │
      │                                 │ 5. Verify Proof            │
      │                                 │────────────────────────────▶│
      │                                 │                              │
      │                                 │◀────────────────────────────│
      │                                 │ (allow / review / deny)     │
      │                                 │                              │
      │                                 │ 6. Record Nullifier       │
      │                                 │────────────────────────────▶│
      │                                 │                              │
      │  7. Decision + Audit          │                              │
      │◀───────────────────────────────│                              │
      │                                 │                              │
```

### Detailed Steps

1. **User Connects Wallet** — Via RainbowKit on HashKey Chain
2. **Browser Generates ZK Proof** — Using Semaphore protocol:
   - Creates/loads Semaphore identity (stored in localStorage)
   - Builds merkle tree with group commitments
   - Generates proof that proves membership without revealing identity
   - Produces a nullifier for replay protection
3. **Policy Evaluation** — Off-chain:
   - Trust Engine evaluates input signals against policy
   - Returns `allow`, `review`, or `deny`
   - Calculates trust score and band
4. **On-Chain Registration**:
   - Nullifier recorded on `TrustVerifier.useNullifier()`
   - Decision stored on `TrustGateway.recordDecision()`
   - Transaction logged for audit trail

### Decision Logic

```
         Input Signals
    ┌──────────┬──────────┬──────────┬────────────┐
    │ Reputation│Human    │Cohort    │Credential │
    │ Band     │Proof   │Member   │Verified   │
    └────┬─────┴────┬─────┴────┬────┴──────┘
         │          │         │           │
         ▼          ▼         ▼           ▼
    ┌────────────────────────────────┐
    │      Policy Evaluation         │
    │  • minTrustScore: 35-70         │
    │  • minBand: 1-3              │
    │  • requireHuman: bool         │
    │  • requireCredential: bool    │
    └──────────────┬───────────────┘
                 │
     ┌──────────┼──────────┐
     │          │          │
     ▼          ▼          ▼
   ALLOW    REVIEW    DENY
   (100)   (60-99)  (0-59)
```

### Signal Weights

| Signal | Weight | Description |
|--------|--------|-------------|
| Human Proof | 25 | ZK proof that user is human |
| Reputation Band | 20×band | Wallet reputation tier |
| Cohort Member | 15 | Whitelist/group membership |
| Credential | 10 | Verified credential status |
| **MAX** | **100** | **Maximum trust score** |

---

## Trust Bands

| Band | Score Range | Label | Use Case |
|------|------------|-------|----------|
| 0 | 0-19 | None | New wallet, no history |
| 1 | 20-39 | Basic | Airdrop eligibility |
| 2 | 40-59 | Standard | Rewards, basic access |
| 3 | 60-79 | Premium | Vaults, pools |
| 4 | 80-100 | Elite | High-value operations |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Solidity 0.8.24 | Smart Contracts |
| **Framework** | Hardhat | Contract development & testing |
| **Wallet** | RainbowKit + Wagmi | Wallet connection |
| **Proof** | Semaphore 4.x | Zero-knowledge proofs |
| **Frontend** | Next.js 14 | Web application |
| **Styling** | Tailwind CSS | UI components |
| **Database** | Prisma + Accelerate | Audit trail |
| **API** | Next.js API Routes | REST endpoints |
| **Chain** | viem | EVM interactions |

---

## Contract Addresses (HashKey Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| **TrustVerifier** | `0xC284Be07898768F0818aAeC84A0bD95Bc5275670` | [View](https://testnet-explorer.hsk.xyz/address/0xC284Be07898768F0818aAeC84A0bD95Bc5275670) |
| **TrustPolicy** | `0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF` | [View](https://testnet-explorer.hsk.xyz/address/0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF) |
| **TrustGateway** | `0x6E83054913aA6C616257Dae2e87BC44F9260EDc6` | [View](https://testnet-explorer.hsk.xyz/address/0x6E83054913aA6C616257Dae2e87BC44F9260EDc6) |
| **TrustVault** | `0x6e7815385eefc8Dc5f3bc69fA71142E42ed0C285` | [View](https://testnet-explorer.hsk.xyz/address/0x6e7815385eefc8Dc5f3bc69fA71142E42ed0C285) |
| **TrustPool** | `0x148A1e47F39Aff9cFB799c5ed05C6a51dDf763BB` | [View](https://testnet-explorer.hsk.xyz/address/0x148A1e47F39Aff9cFB799c5ed05C6a51dDf763BB) |
| **TrustAirdrop** | `0x1D5F17Df84a00B7cA5275F484932dd54057bdC24` | [View](https://testnet-explorer.hsk.xyz/address/0x1D5F17Df84a00B7cA5275F484932dd54057bdC24) |
| **MockUSDC** | `0x9C32C13CEA7c0CCe7dd678CF2D9065442A91455B` | [View](https://testnet-explorer.hsk.xyz/address/0x9C32C13CEA7c0CCe7dd678CF2D9065442A91455B) |

---

## SDK Integration

### Install

```bash
npm install @nebulaid/gateway-sdk
```

### Quick Start

```typescript
import { createTrustClient } from '@nebulaid/gateway-sdk/client'
import { generateSemaphoreProof, verifyProof } from '@nebulaid/gateway-sdk'

// 1. Create client
const client = createTrustClient({
  rpcUrl: 'https://rpc.testnet.hsk.xyz',
  chainId: 133,
})

// 2. Get trust decision
const decision = await client.verify({
  wallet: '0x...',
  protocol: 'vault',
  policyVersion: 'nebula-trust-v1',
})

console.log(decision)
// { decision: 'allow', trustScore: 85, band: 4, ... }

// 3. Generate proof (browser-only)
const proof = await generateSemaphoreProof({
  wallet: '0x...',
  protocol: 'vault',
  trustScore: decision.trustScore,
  groupCommitments: ['0x...', '0x...'],
})

// 4. Verify on-chain
await client.useNullifier(proof.nullifier)
```

### API Reference

#### `client.verify(params)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `wallet` | `string` | User's wallet address |
| `protocol` | `Protocol` | One of: `vault`, `pool`, `rewards`, `airdrop` |
| `policyVersion` | `string` | Policy version (default: `nebula-trust-v1`) |

**Returns:**

```typescript
{
  decision: 'allow' | 'review' | 'deny'
  trustScore: number      // 0-100
  band: number         // 0-4
  bandLabel: string    // 'band-0' to 'band-4'
  policyId: string
  policy: PolicyProfile
  signalBreakdown: SignalBreakdown
  reasons: string[]
  summary: string
}
```

#### `client.useNullifier(nullifier)`

Registers a proof nullifier on-chain to prevent replay attacks.

---

## REST API Reference

### Trust Verify

**POST** `/api/trust/verify`

```bash
curl -X POST https://nebula.example.com/api/trust/verify \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x123...",
    "protocol": "vault",
    "reputationBand": 3,
    "humanProof": true,
    "cohortMember": true,
    "credentialVerified": false
  }'
```

**Response:**

```json
{
  "decision": "allow",
  "trustScore": 85,
  "band": 4,
  "bandLabel": "band-4",
  "policyVersion": "nebula-trust-v1",
  "policyId": "lending-pool-v1",
  "policy": { ... },
  "signalBreakdown": { ... },
  "reasons": ["Human proof verified.", "Wallet is in an elevated reputation band."],
  "summary": "Policy matched"
}
```

### Semaphore Verify

**POST** `/api/semaphore/verify`

Verifies a Semaphore proof bundle.

### Trust Score

**GET** `/api/trust/score?wallet=0x...`

Gets the trust score and band for a wallet.

### Audit

**GET** `/api/audit?wallet=0x...`

Gets the verification history for a wallet.

---

## Policy Catalog

| Protocol | Policy ID | minScore | minBand | requireHuman | requireCredential |
|----------|----------|----------|--------|-------------|-----------------|
| Vault | `lending-pool-v1` | 70 | 3 | ✓ | ✓ |
| Pool | `premium-pool-v1` | 60 | 3 | ✓ | ✗ |
| Rewards | `rewards-access-v1` | 45 | 2 | ✓ | ✓ |
| Airdrop | `airdrop-2026` | 35 | 1 | ✓ | ✗ |

---

## Smart Contracts

### TrustVerifier

```solidity
contract TrustVerifier is Ownable {
    struct TrustScore {
        uint256 score;
        uint256 band;
        uint256 timestamp;
        uint256 expiry;
    }

    mapping(address => TrustScore) public trustScores;
    mapping(bytes32 => bool) public usedNullifiers;

    function updateTrustScore(address user, uint256 score, uint256 band) external onlyOwner;
    function verify(address user, uint256 minBand) external view returns (bool);
    function getTrustScore(address user) external view returns (uint256 score, uint256 band, bool isValid);
    function getBand(uint256 score) public pure returns (uint256 band);
    function useNullifier(bytes32 nullifier) external;
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
}
```

### TrustPolicy

```solidity
contract TrustPolicy is Ownable {
    struct Policy {
        string name;
        uint256 minTrustScore;
        uint256 minBand;
        bool requireHuman;
        bool requireCredential;
        bool active;
    }

    mapping(bytes32 => Policy) public policies;
    mapping(address => mapping(bytes32 => bool)) public userPolicyApprovals;

    function createPolicy(bytes32 policyId, string memory name, ...) external onlyOwner;
    function evaluatePolicy(address user, bytes32 policyId, ...) external view returns (bool allowed, string[] memory reasons);
    function approveUser(address _user, bytes32 policyId, ...) external onlyOwner returns (bool allowed);
    function checkApproval(address user, bytes32 policyId) external view returns (bool);
}
```

### TrustGateway

```solidity
contract TrustGateway {
    struct Decision {
        uint8 decision;
        uint256 trustScore;
        string policyVersion;
        bytes32 proofId;
        uint256 timestamp;
    }

    function recordDecision(address wallet, uint8 decision, ...) external;
    function publishPolicy(string calldata newPolicyVersion) external;
    function lastDecision(address wallet) external view returns (...);
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- HashKey wallet (MetaMask, Rabby, or Rainbow)

### Local Development

```bash
# Clone the repository
git clone https://github.com/nebulaid/nebula-gateway.git
cd nebula-gateway

# Install dependencies
pnpm install

# Generate Prisma client
cd web-app && pnpm build:prisma

# Start local development
cd .. && pnpm dev
```

Visit `http://localhost:3000`

### Deploy to HashKey Testnet

```bash
cd contracts

# Deploy contracts
pnpm deploy:hashkeyTestnet

# Copy deployment addresses to web-app
cp deployments/*.json ../web-app/src/deployments/
```

### Run Tests

```bash
cd contracts
pnpm test
```

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Sybil attacks | ZK proof + nullifier |
|Replay attacks | On-chain nullifier registration |
| Identity leakage | Zero-knowledge proofs |
| Front-running | Commit-reveal pattern |
| Score manipulation | Owner-only updates |
| Policy tampering | Ownable contracts |

### Access Control

- `TrustVerifier.updateTrustScore()` — Owner only
- `TrustVerifier.setVerifier()` — Owner only
- `TrustPolicy.createPolicy()` — Owner only
- `TrustPolicy.approveUser()` — Owner only
- `TrustGateway.recordDecision()` — Anyone (trusted off-chain)

### Known Limitations

- Trust score is currently demo-scored (not connected to external AI)
- Policy CRUD is not exposed in the UI (owner-only via contracts)
- No pausable mechanism for emergency shutdown
- No rate limiting on API endpoints

---

## Directory Structure

```
nebula-gateway/
├── contracts/                    # Smart contracts
│   ├── src/
│   │   ├── TrustVerifier.sol   # Score & nullifier management
│   │   ├── TrustPolicy.sol     # Policy CRUD & evaluation
│   │   ├── TrustGateway.sol    # Decision recording
│   │   └── interfaces/
│   ├── test/                   # Contract tests
│   ├── scripts/                 # Deployment scripts
│   ├── hardhat.config.js
│   └── package.json
├── web-app/                     # Next.js application
│   ├── src/
│   │   ├── app/                # App router pages
│   │   │   ├── api/            # API routes
│   │   │   ├── demo/           # Demo page
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   └── token/         # Token demo
│   │   ├── lib/               # Core libraries
│   │   │   ├── nebula-trust.ts # Trust engine
│   │   │   ├── nebula-semaphore.ts # ZK proofs
│   │   │   └── nebula-contracts.ts # Contract bindings
│   │   └── deployments/       # Deployed addresses
│   ├── prisma/                 # Database schema
│   └── package.json
├── sdk/                        # Protocol SDK
│   ├── src/
│   │   ├── client.ts
│   │   ├── contracts.ts
│   │   └── hooks.ts
│   └── package.json
└── docs/                       # Documentation
    ├── core/
    └── research/
```

---

## Roadmap

### Phase 1 — MVP (Current)

- [x] TrustVerifier with scores and bands
- [x] TrustPolicy with policy CRUD
- [x] Semaphore proof flow
- [x] On-chain nullifier registration
- [x] API verification endpoints
- [x] Connect trust scoring to IDprotocol backend


### Phase 2 — Production

- [ ] Add pausable mechanism
- [ ] Build policy management dashboard
- [ ] Add rate limiting to API

### Phase 3 — Scale

- [ ] SDK package distribution
- [ ] Cross-chain trust aggregation
- [ ] Custom ZK circuits (beyond Semaphore)
- [ ] Token-gated NFT reputation

---

## Use Cases

### Airdrop Distribution

Protect your token distribution from sybils:

```solidity
function claim() external {
    // Check trust score
    trustVerifier.verify(msg.sender, 35); // minBand = 1
    // Process claim
}
```

### Vault Access

Gate DeFi vaults with high-trust requirements:

```solidity
function deposit() external {
    trustVerifier.verify(msg.sender, 60); // minBand = 3
    // Process deposit
}
```

### Premium Pools

Restrict liquidity pools to verified users:

```solidity
function addLiquidity() external {
    trustVerifier.verify(msg.sender, 70); // minBand = 3
    _mint(msg.sender, shares);
}
```

### Contributor Rewards

Verify cohort membership for reward claims:

```solidity
function claimRewards() external {
    require(policy.checkApproval(msg.sender, CONTRIB_POLICY_ID));
    _distribute(msg.sender, reward);
}
```

---

## Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md).

### Development Setup

```bash
# Install all dependencies
pnpm install -r

# Run tests
cd contracts && pnpm test

# Build SDK
cd sdk && pnpm build

# Lint
cd web-app && pnpm lint
```

---

## Support

- **Twitter**: [@nebulaid_xyz](https://twitter.com/nebulaid_xyz)
- **Email**: hello@nebulaid.xyz

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- [Semaphore](https://semaphore.appliedzkp.org/) — Zero-knowledge proofs
- [HashKey](https://hashkey.com/) — Blockchain infrastructure
- [OpenZeppelin](https://openzeppelin.com/) — Smart contract libraries
- [RainbowKit](https://www.rainbowkit.com/) — Wallet connection

---

## Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. This is experimental software and has not been audited for security. Always verify interactions on testnet before mainnet deployment.

---

<p align="center">
  <strong>Nebula Gateway — Verify humans. Not wallets. Not bots</strong>
</p>