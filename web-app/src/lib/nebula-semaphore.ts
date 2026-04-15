import { keccak256, stringToHex, toHex } from "viem"

import type { TrustProtocol } from "@/lib/nebula-trust"

// Local type definition to avoid importing from @semaphore-protocol/proof at module level
// (that package uses indexedDB which causes SSR errors)
type SemaphoreProof = {
  merkleTreeRoot: bigint | string
  merkleTreeDepth: number
  nullifier: bigint | string
  message: bigint | string
  scope: bigint | string
  points: unknown
  trapdoor?: bigint | string
  proof?: unknown
}

// Dynamic imports for browser-only semaphore libraries (they use indexedDB)
async function importGroup() {
  const { Group } = await import("@semaphore-protocol/group")
  return Group
}

async function importIdentity() {
  const { Identity } = await import("@semaphore-protocol/identity")
  return Identity
}

export type SemaphoreProofBundle = {
  identityCommitment: string
  scope: string
  message: string
  scopeHash: string
  messageHash: string
  groupRoot: string
  groupDepth: number
  proof: SemaphoreProof
}

const identityKeyPrefix = "nebula:semaphore:identity:"

function getIdentityStorageKey(wallet: string) {
  return `${identityKeyPrefix}${wallet.toLowerCase()}`
}

export function getSemaphoreScope(protocol: TrustProtocol, policyVersion: string) {
  return `nebula:${protocol}:${policyVersion}:access`
}

export function getSemaphoreMessage(protocol: TrustProtocol, policyVersion: string, trustScore: number) {
  return `nebula:${protocol}:${policyVersion}:trust:${trustScore}`
}

function toBytes32(value: string) {
  return keccak256(stringToHex(value))
}

export async function getOrCreateSemaphoreIdentity(wallet: string) {
  if (typeof window === "undefined") {
    throw new Error("Semaphore identities can only be created in the browser")
  }

  const Identity = await importIdentity()
  const key = getIdentityStorageKey(wallet)
  const storedIdentity = window.localStorage.getItem(key)

  if (storedIdentity) {
    return Identity.import(storedIdentity)
  }

  const identity = new Identity()
  window.localStorage.setItem(key, identity.export())
  return identity
}

export function getSemaphoreDemoCommitments(protocol: TrustProtocol, policyVersion: string): string[] {
  return [
    keccak256(stringToHex(`nebula:${protocol}:${policyVersion}:demo:1`)),
    keccak256(stringToHex(`nebula:${protocol}:${policyVersion}:demo:2`)),
  ]
}

export function toSemaphoreBytes32(value: string | bigint | number) {
  return toHex(BigInt(value), { size: 32 })
}

export async function buildSemaphoreGroup(commitments: Array<string | bigint>) {
  const Group = await importGroup()
  const members = Array.from(
    new Set(commitments.map((commitment) => commitment.toString()).filter(Boolean)),
  )

  return new Group(members)
}

export async function generateSemaphoreProofBundle(input: {
  wallet: string
  protocol: TrustProtocol
  policyVersion: string
  trustScore: number
  groupCommitments: Array<string | bigint>
}): Promise<SemaphoreProofBundle> {
  const { generateProof } = await import("@semaphore-protocol/proof")
  const identity = await getOrCreateSemaphoreIdentity(input.wallet)
  const group = await buildSemaphoreGroup([identity.commitment, ...input.groupCommitments])
  const scope = getSemaphoreScope(input.protocol, input.policyVersion)
  const message = getSemaphoreMessage(input.protocol, input.policyVersion, input.trustScore)
  const scopeHash = toBytes32(scope)
  const messageHash = toBytes32(message)

  console.info("[semaphore] proof generation start", {
    wallet: input.wallet,
    protocol: input.protocol,
    policyVersion: input.policyVersion,
    trustScore: input.trustScore,
    groupSize: group.size,
    groupDepth: group.depth,
    scopeHash,
    messageHash,
  })

  const proof = await generateProof(identity, group, messageHash, scopeHash, Math.max(16, group.depth))

  console.info("[semaphore] proof generation complete", {
    identityCommitment: identity.commitment.toString(),
    groupRoot: group.root.toString(),
    nullifier: proof.nullifier,
    trapdoor: proof.trapdoor,
  })

  return {
    identityCommitment: identity.commitment.toString(),
    scope,
    message,
    scopeHash,
    messageHash,
    groupRoot: group.root.toString(),
    groupDepth: group.depth,
    proof: proof as SemaphoreProof,
  }
}

export async function verifySemaphoreProofBundle(proof: SemaphoreProof) {
  // Import verifyProof dynamically to avoid SSR issues with indexedDB
  const { verifyProof } = await import("@semaphore-protocol/proof")
  console.info("[semaphore] proof verification start", {
    merkleTreeRoot: proof.merkleTreeRoot?.toString?.() ?? String(proof.merkleTreeRoot),
    nullifier: proof.nullifier,
  })

  // @ts-ignore - Types don't match exactly but the runtime behavior is correct
  const verified = await verifyProof(proof)

  console.info("[semaphore] proof verification complete", {
    verified,
    nullifier: proof.nullifier,
  })

  return verified
}
