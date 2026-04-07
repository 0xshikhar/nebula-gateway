import { NextResponse } from "next/server"

import { defaultProofLibrary, policyVersion, protocolPresets } from "@/lib/nebula-trust"
import { persistAuditEvent, persistPolicyVersionSnapshot } from "@/lib/trust-audit"

export async function GET() {
  const policyEvent = await persistPolicyVersionSnapshot({
    version: policyVersion,
    source: "api-proof-prepare",
    decisionMode: "prepare",
  })

  const auditEvent = await persistAuditEvent({
    eventType: "proof.prepare",
    payload: {
      policyVersion,
      proofLibrary: defaultProofLibrary,
      protocolCount: protocolPresets.length,
    },
    policyVersionId: policyEvent.record?.id ?? null,
  })

  return NextResponse.json({
    policyVersion,
    proofLibrary: defaultProofLibrary,
    protocols: protocolPresets,
    steps: [
      "Connect wallet with Wagmi / RainbowKit",
      "Assemble browser proof inputs",
      "Verify via /api/trust/verify",
      "Consume allow / review / deny in the protocol app",
    ],
    auditStored: Boolean(policyEvent.record || auditEvent.record),
  })
}
