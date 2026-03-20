import { NextRequest, NextResponse } from "next/server"

import { evaluateTrust, type TrustInput } from "@/lib/nebula-trust"

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<TrustInput>

  if (!body.wallet || !body.protocol) {
    return NextResponse.json(
      { error: "invalid_request", message: "wallet and protocol are required" },
      { status: 400 },
    )
  }

  const result = evaluateTrust({
    wallet: body.wallet,
    protocol: body.protocol,
    reputationBand: body.reputationBand ?? 0,
    humanProof: Boolean(body.humanProof),
    cohortMember: Boolean(body.cohortMember),
    credentialVerified: Boolean(body.credentialVerified),
    expired: Boolean(body.expired),
    proofLibrary: body.proofLibrary,
    proofId: body.proofId,
  })

  return NextResponse.json({
    wallet: body.wallet,
    protocol: body.protocol,
    trustScore: result.trustScore,
    bandLabel: result.bandLabel,
    proofLibrary: result.proofLibrary,
    policyVersion: result.policyVersion,
    summary: result.summary,
  })
}
