import { NextResponse } from "next/server"

import { defaultProofLibrary, policyVersion, protocolPresets } from "@/lib/nebula-trust"

export async function GET() {
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
  })
}
