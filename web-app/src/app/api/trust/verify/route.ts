import { NextRequest, NextResponse } from "next/server"
import { SiweMessage } from "siwe"

import { evaluateTrust, type TrustInput } from "@/lib/nebula-trust"
import {
  persistAuditEvent,
  persistProofEvent,
  persistVerificationEvent,
} from "@/lib/trust-audit"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TrustInput>
    const proof = (body as { proof?: { message?: string; signature?: string } }).proof

    if (!body.wallet || !body.protocol) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "wallet and protocol are required",
        },
        { status: 400 },
      )
    }

    if (!proof?.message || !proof?.signature) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "browser proof message and signature are required",
        },
        { status: 400 },
      )
    }

    const siweMessage = new SiweMessage(proof.message)
    const verification = await siweMessage.verify({ signature: proof.signature })

    if (!verification.success) {
      return NextResponse.json(
        {
          error: "invalid_proof",
          message: "browser proof signature is invalid",
        },
        { status: 401 },
      )
    }

    if (verification.data.address.toLowerCase() !== body.wallet.toLowerCase()) {
      return NextResponse.json(
        {
          error: "invalid_proof",
          message: "proof wallet does not match the request wallet",
        },
        { status: 401 },
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

    const proofEvent = await persistProofEvent({
      wallet: body.wallet,
      protocol: body.protocol,
      proofId: body.proofId ?? null,
      proofLibrary: result.proofLibrary,
      issuedAt: proof.issuedAt,
      verifiedAt: new Date().toISOString(),
      status: result.decision === "allow" ? "verified" : "rejected",
      metadata: {
        proofMethod: "browser-signature",
        signatureVerified: true,
        walletMatch: true,
      },
    })

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
      proofEventId: proofEvent.record?.id ?? null,
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
        proofMethod: "browser-signature",
      },
      verificationEventId: verificationEvent.record?.id ?? null,
    })

    return NextResponse.json({
      ...result,
      wallet: body.wallet,
      protocol: body.protocol,
      proofId: body.proofId ?? null,
      proofMethod: "browser-signature",
      verifiedAt: new Date().toISOString(),
      auditStored: Boolean(verificationEvent.record || auditEvent.record),
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
