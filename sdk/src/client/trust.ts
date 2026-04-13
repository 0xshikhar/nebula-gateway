import type { TrustInput, TrustResult, SDKConfig } from "../types/index.js"

export class GatewayClient {
  private apiBaseUrl: string

  constructor(config: SDKConfig) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "")
  }

  async verify(input: TrustInput): Promise<TrustResult> {
    const response = await fetch(`${this.apiBaseUrl}/api/trust/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? `Trust verification failed: ${response.status}`)
    }

    return response.json()
  }

  async getTrustScore(wallet: string): Promise<{ score: number; band: number; isValid: boolean }> {
    const response = await fetch(`${this.apiBaseUrl}/api/trust/score?wallet=${wallet}`)

    if (!response.ok) {
      throw new Error(`Failed to get trust score: ${response.status}`)
    }

    return response.json()
  }

  async getAuditTrail(limit = 10): Promise<{
    verificationEvents: unknown[]
    auditEvents: unknown[]
    proofEvents: unknown[]
    policyVersions: unknown[]
  }> {
    const response = await fetch(`${this.apiBaseUrl}/api/audit?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to get audit trail: ${response.status}`)
    }

    return response.json()
  }
}

export function createGatewayClient(config: SDKConfig): GatewayClient {
  return new GatewayClient(config)
}