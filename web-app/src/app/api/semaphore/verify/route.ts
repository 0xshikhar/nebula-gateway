import { NextRequest, NextResponse } from "next/server"

import { verifySemaphoreProofBundle } from "@/lib/nebula-semaphore"
import { persistAuditEvent, persistSemaphoreProofEvent } from "@/lib/trust-audit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      wallet?: string
      protocol?: string
      policyVersion?: string
      scope?: string
      message?: string
      proof?: Record<string, unknown> & { nullifier?: string; merkleTreeRoot?: string; merkleTreeDepth?: number }
    }

    if (!body.wallet || !body.protocol || !body.policyVersion || !body.scope || !body.message || !body.proof) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "wallet, protocol, policyVersion, scope, message, and proof are required",
        },
        { status: 400 },
      )
    }

    const verified = await verifySemaphoreProofBundle(body.proof as never)

    if (!verified) {
      return NextResponse.json(
        {
          error: "invalid_proof",
          message: "Semaphore proof verification failed",
        },
        { status: 401 },
      )
    }

    const proofEvent = await persistSemaphoreProofEvent({
      wallet: body.wallet,
      protocol: body.protocol,
      policyVersion: body.policyVersion,
      scope: body.scope,
      message: body.message,
      nullifier: String(body.proof.nullifier),
      merkleRoot: String(body.proof.merkleTreeRoot),
      merkleDepth: Number(body.proof.merkleTreeDepth ?? 0),
      proof: body.proof,
    })

    const auditEvent = await persistAuditEvent({
      eventType: "semaphore.verify",
      wallet: body.wallet,
      protocol: body.protocol,
      payload: {
        policyVersion: body.policyVersion,
        scope: body.scope,
        nullifier: String(body.proof.nullifier),
        merkleRoot: String(body.proof.merkleTreeRoot),
      },
    })

    return NextResponse.json({
      verified: true,
      nullifier: String(body.proof.nullifier),
      auditStored: Boolean(proofEvent.record || auditEvent.record),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: error instanceof Error ? error.message : "Unable to verify semaphore proof",
      },
      { status: 500 },
    )
  }
}
