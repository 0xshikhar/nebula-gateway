import { NextRequest, NextResponse } from "next/server"

import { evaluateTrust, type TrustInput } from "@/lib/nebula-trust"
import {
  persistAuditEvent,
  persistPolicyVersionSnapshot,
  persistTrustScoreSnapshot,
} from "@/lib/trust-audit"

export const dynamic = "force-dynamic"

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

  const scoreEvent = await persistTrustScoreSnapshot({
    wallet: body.wallet,
    protocol: body.protocol,
    score: result.trustScore,
    bandLabel: result.bandLabel,
    signalSummary: {
      humanProof: Boolean(body.humanProof),
      cohortMember: Boolean(body.cohortMember),
      credentialVerified: Boolean(body.credentialVerified),
      expired: Boolean(body.expired),
      proofLibrary: result.proofLibrary,
    },
  })

  const policyEvent = await persistPolicyVersionSnapshot({
    version: result.policyVersion,
    source: "api-trust-score",
    protocol: body.protocol,
    decisionMode: result.decision,
  })

  const auditEvent = await persistAuditEvent({
    eventType: "trust.score",
    wallet: body.wallet,
    protocol: body.protocol,
    payload: {
      trustScore: result.trustScore,
      bandLabel: result.bandLabel,
      decision: result.decision,
      policyVersion: result.policyVersion,
    },
    policyVersionId: policyEvent.record?.id ?? null,
  })

  return NextResponse.json({
    wallet: body.wallet,
    protocol: body.protocol,
    trustScore: result.trustScore,
    bandLabel: result.bandLabel,
    proofLibrary: result.proofLibrary,
    policyVersion: result.policyVersion,
    summary: result.summary,
    auditStored: Boolean(scoreEvent.record || auditEvent.record),
  })
}
