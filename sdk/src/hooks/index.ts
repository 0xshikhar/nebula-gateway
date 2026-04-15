import { useState, useCallback } from "react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, verifyProof } from "@semaphore-protocol/proof"
import { keccak256, stringToHex } from "viem"
import { defaultProofLibrary } from "../trust-engine.js"
import type { TrustProtocol, TrustDecision, SemaphoreProof, SDKConfig } from "../types/index.js"

export const DEFAULT_API_URL = "https://nebulaid-gateway.vercel.app"

type TrustInput = {
  wallet: string
  protocol: TrustProtocol
  reputationBand: number
  humanProof: boolean
  cohortMember: boolean
  credentialVerified: boolean
  expired: boolean
  proofLibrary?: string
  proofId?: string
}

type TrustResult = {
  decision: TrustDecision
  trustScore: number
  band: number
  bandLabel: string
  policyVersion: string
  reasons: string[]
  summary: string
}

const PROTOCOL_PRESETS = {
  vault: {
    protocol: "vault" as TrustProtocol,
    reputationBand: 4,
    humanProof: true,
    cohortMember: true,
    credentialVerified: true,
    expired: false,
  },
  pool: {
    protocol: "pool" as TrustProtocol,
    reputationBand: 3,
    humanProof: true,
    cohortMember: true,
    credentialVerified: false,
    expired: false,
  },
  rewards: {
    protocol: "rewards" as TrustProtocol,
    reputationBand: 2,
    humanProof: true,
    cohortMember: true,
    credentialVerified: true,
    expired: false,
  },
  airdrop: {
    protocol: "airdrop" as TrustProtocol,
    reputationBand: 2,
    humanProof: true,
    cohortMember: false,
    credentialVerified: false,
    expired: false,
  },
}

export function useTrustScore(apiBaseUrl?: string) {
  const baseUrl = apiBaseUrl ?? DEFAULT_API_URL
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrustResult | null>(null)

  const verify = useCallback(
    async (input: TrustInput) => {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const response = await fetch(`${baseUrl}/api/trust/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            proofLibrary: input.proofLibrary ?? defaultProofLibrary,
            proofId: input.proofId ?? "",
          }),
        })

        if (!response.ok) {
          throw new Error(`Trust verification failed: ${response.status}`)
        }

        const data = await response.json()
        setResult(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl],
  )

  return {
    verify,
    isLoading,
    error,
    result,
    presets: PROTOCOL_PRESETS,
  }
}

export function useAuditTrail(apiBaseUrl?: string) {
  const baseUrl = apiBaseUrl ?? DEFAULT_API_URL
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    verificationEvents: unknown[]
    auditEvents: unknown[]
    proofEvents: unknown[]
    policyVersions: unknown[]
  } | null>(null)

  const refresh = useCallback(async (limit = 10) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${baseUrl}/api/audit?limit=${limit}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch audit trail: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [apiBaseUrl])

  return { refresh, isLoading, error, data }
}

export function useSemaphoreProof(apiBaseUrl?: string) {
  const baseUrl = apiBaseUrl ?? DEFAULT_API_URL
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proof, setProof] = useState<SemaphoreProof | null>(null)

  const generate = useCallback(
    async (params: {
      wallet: string
      protocol: TrustProtocol
      policyVersion: string
      trustScore: number
      identity: Identity
    }) => {
      setIsLoading(true)
      setError(null)
      setProof(null)

      try {
        const groupResponse = await fetch(
          `${apiBaseUrl}/api/semaphore/group?protocol=${params.protocol}&policyVersion=${params.policyVersion}`,
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

        const semaphoreProof = await generateProof(
          params.identity,
          group,
          messageHash,
          scopeHash,
          Math.max(16, group.depth),
        )

        const verified = await verifyProof(semaphoreProof)
        if (!verified) {
          throw new Error("Generated proof failed to verify locally")
        }

        const nullifier = semaphoreProof.nullifier.toString()

        const result: SemaphoreProof = {
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
          semaphoreProof,
        }

        setProof(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl],
  )

  const reset = useCallback(() => {
    setProof(null)
    setError(null)
  }, [])

  return { generate, isLoading, error, proof, reset }
}

export function createIdentity(wallet: string): Identity {
  if (typeof window === "undefined") {
    throw new Error("Identity can only be created in the browser")
  }

  const key = `nebula:semaphore:identity:${wallet.toLowerCase()}`
  const stored = window.localStorage.getItem(key)

  if (stored) {
    return Identity.import(stored)
  }

  const identity = new Identity()
  window.localStorage.setItem(key, identity.export())
  return identity
}

export function getOrCreateSemaphoreIdentity(wallet: string): Identity {
  return createIdentity(wallet)
}
