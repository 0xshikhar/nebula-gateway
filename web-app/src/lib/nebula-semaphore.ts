import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, verifyProof } from "@semaphore-protocol/proof"
import type { SemaphoreProof } from "@semaphore-protocol/proof"
import { keccak256, stringToHex } from "viem"

import type { TrustProtocol } from "@/lib/nebula-trust"

export type SemaphoreProofBundle = {
  identityCommitment: string
  scope: string
  message: string
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

export function getOrCreateSemaphoreIdentity(wallet: string): Identity {
  if (typeof window === "undefined") {
    throw new Error("Semaphore identities can only be created in the browser")
  }

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

export function buildSemaphoreGroup(commitments: Array<string | bigint>) {
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
  const identity = getOrCreateSemaphoreIdentity(input.wallet)
  const group = buildSemaphoreGroup([identity.commitment, ...input.groupCommitments])
  const scope = getSemaphoreScope(input.protocol, input.policyVersion)
  const message = getSemaphoreMessage(input.protocol, input.policyVersion, input.trustScore)
  const proof = await generateProof(identity, group, message, scope, Math.max(16, group.depth))

  return {
    identityCommitment: identity.commitment.toString(),
    scope,
    message,
    groupRoot: group.root.toString(),
    groupDepth: group.depth,
    proof,
  }
}

export async function verifySemaphoreProofBundle(proof: SemaphoreProof) {
  return verifyProof(proof)
}
