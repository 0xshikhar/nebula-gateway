// Server-only semaphore utilities
// These functions run on the server and can safely import @semaphore-protocol/group

import { Group } from "@semaphore-protocol/group"
import { keccak256, stringToHex } from "viem"

import type { TrustProtocol } from "@/lib/nebula-trust"

export function getSemaphoreScope(protocol: TrustProtocol, policyVersion: string) {
  return `nebula:${protocol}:${policyVersion}:access`
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
