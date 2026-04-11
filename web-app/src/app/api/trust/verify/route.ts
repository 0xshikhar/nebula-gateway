import { NextRequest, NextResponse } from "next/server"

import { evaluateTrust, type TrustInput } from "@/lib/nebula-trust"
import {
  persistAuditEvent,
  persistSemaphoreMember,
  persistVerificationEvent,
} from "@/lib/trust-audit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TrustInput>
    const identityCommitment = (body as { identityCommitment?: string }).identityCommitment

    if (!body.wallet || !body.protocol) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "wallet and protocol are required",
        },
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

    const memberRecord =
      result.decision === "allow" && identityCommitment
        ? await persistSemaphoreMember({
            wallet: body.wallet,
            protocol: body.protocol,
            policyVersion: result.policyVersion,
            commitment: identityCommitment,
            decision: result.decision,
            trustScore: result.trustScore,
            bandLabel: result.bandLabel,
            active: true,
          })
        : { record: null }

    const verificationEvent = await persistVerificationEvent({
      wallet: body.wallet,
      protocol: body.protocol,
      decision: result.decision,
      trustScore: result.trustScore,
      bandLabel: result.bandLabel,
      policyVersion: result.policyVersion,
      proofLibrary: result.proofLibrary,
      proofId: body.proofId ?? null,
      reasons: result.reasons,
    })

    const auditEvent = await persistAuditEvent({
      eventType: "trust.verify",
      wallet: body.wallet,
      protocol: body.protocol,
      payload: {
        decision: result.decision,
        trustScore: result.trustScore,
        bandLabel: result.bandLabel,
        policyVersion: result.policyVersion,
        proofId: body.proofId ?? null,
        proofMethod: result.proofLibrary,
        identityCommitment: identityCommitment ?? null,
      },
      verificationEventId: verificationEvent.record?.id ?? null,
    })

    return NextResponse.json({
      ...result,
      wallet: body.wallet,
      protocol: body.protocol,
      proofId: body.proofId ?? null,
      verifiedAt: new Date().toISOString(),
      identityCommitment: identityCommitment ?? null,
      auditStored: Boolean(verificationEvent.record || auditEvent.record || memberRecord.record),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: error instanceof Error ? error.message : "Unable to verify trust payload",
      },
      { status: 500 },
    )
  }
}
