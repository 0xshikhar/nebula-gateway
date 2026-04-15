import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, verifyProof } from "@semaphore-protocol/proof"
import type { SemaphoreProof as SemaphoreProofType } from "@semaphore-protocol/proof"
import { keccak256, stringToHex } from "viem"
import type { TrustProtocol, SemaphoreProof as SDKSemaphoreProof, SDKConfig } from "../types/index.js"

export class SemaphoreClient {
  private apiBaseUrl: string

  constructor(config: SDKConfig) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "")
  }

  createIdentity(secret?: string): Identity {
    return new Identity(secret)
  }

  importIdentity(serialized: string): Identity {
    return Identity.import(serialized)
  }

  getIdentityCommitment(identity: Identity): string {
    return identity.commitment.toString()
  }

  async generateProof(params: {
    wallet: string
    protocol: TrustProtocol
    policyVersion: string
    trustScore: number
    identity: Identity
  }): Promise<SDKSemaphoreProof> {
    const groupResponse = await fetch(
      `${this.apiBaseUrl}/api/semaphore/group?protocol=${params.protocol}&policyVersion=${params.policyVersion}`,
    )

    if (!groupResponse.ok) {
      throw new Error(`Failed to get Semaphore group: ${groupResponse.status}`)
    }

    const groupData = await groupResponse.json()
    const scope = `nebula:${params.protocol}:${params.policyVersion}:access`
    const message = `nebula:${params.protocol}:${params.policyVersion}:trust:${params.trustScore}`

    const group = new Group()
    
    if (groupData.commitments && groupData.commitments.length > 0) {
      for (const commitment of groupData.commitments) {
        group.addMember(BigInt(commitment.toString()))
      }
    }

    group.addMember(params.identity.commitment)

    const scopeHash = keccak256(stringToHex(scope))
    const messageHash = keccak256(stringToHex(message))

    const proof = await generateProof(
      params.identity,
      group,
      messageHash,
      scopeHash,
      Math.max(16, group.depth),
    )

    const verified = await verifyProof(proof)
    if (!verified) {
      throw new Error("Generated proof failed to verify locally")
    }

    const nullifier = proof.nullifier.toString()

    return {
      wallet: params.wallet,
      protocol: params.protocol,
      policyVersion: params.policyVersion,
      trustScore: params.trustScore,
      nullifier,
      commitment: params.identity.commitment.toString(),
      root: group.root.toString(),
      groupRoot: group.root.toString(),
      groupDepth: group.depth,
      scope,
      message,
      scopeHash,
      messageHash,
      identityCommitment: params.identity.commitment.toString(),
      semaphoreProof: proof as SemaphoreProofType,
    }
  }

  async verifyProofLocally(proof: SemaphoreProofType): Promise<boolean> {
    return verifyProof(proof)
  }
}

export function createSemaphoreClient(config: SDKConfig): SemaphoreClient {
  return new SemaphoreClient(config)
}

// Re-export for convenience
export { Identity } from "@semaphore-protocol/identity"
export { Group } from "@semaphore-protocol/group"
export { generateProof, verifyProof } from "@semaphore-protocol/proof"
