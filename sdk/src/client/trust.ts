import type { SDKConfig, TrustAuditTrail, TrustInput, TrustResult, TrustScoreResult } from "../types/index.js"

export const DEFAULT_API_URL = "https://nebulaid-gateway.vercel.app"

function normalizeInput(input: TrustInput): TrustInput {
  return {
    ...input,
    proofLibrary: input.proofLibrary ?? "semaphore",
    proofId: input.proofId ?? "",
  }
}

export class TrustClient {
  private apiBaseUrl: string

  constructor(config: SDKConfig) {
    this.apiBaseUrl = (config.apiBaseUrl ?? DEFAULT_API_URL).replace(/\/$/, "")
  }

  async verify(input: TrustInput): Promise<TrustResult> {
    const response = await fetch(`${this.apiBaseUrl}/api/trust/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizeInput(input)),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? `Trust verification failed: ${response.status}`)
    }

    return response.json()
  }

  async score(input: TrustInput): Promise<TrustScoreResult> {
    const response = await fetch(`${this.apiBaseUrl}/api/trust/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizeInput(input)),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? `Trust scoring failed: ${response.status}`)
    }

    return response.json()
  }

  async getTrustScore(input: TrustInput): Promise<TrustScoreResult> {
    return this.score(input)
  }

  async getAuditTrail(limit = 10): Promise<TrustAuditTrail> {
    const response = await fetch(`${this.apiBaseUrl}/api/audit?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to get audit trail: ${response.status}`)
    }

    return response.json()
  }
}

export function createTrustClient(config: SDKConfig): TrustClient {
  return new TrustClient({
    ...config,
    apiBaseUrl: config.apiBaseUrl ?? DEFAULT_API_URL,
  })
}

export { TrustClient as GatewayClient }
export { createTrustClient as createGatewayClient }
