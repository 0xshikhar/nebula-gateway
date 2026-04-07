import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") ?? "20")

  try {
    const [verificationEvents, auditEvents, proofEvents, policyVersions] = await Promise.all([
      prisma.verificationEvent.findMany({
        take: Math.min(Math.max(limit, 1), 50),
        orderBy: { verifiedAt: "desc" },
      }),
      prisma.auditEvent.findMany({
        take: Math.min(Math.max(limit, 1), 50),
        orderBy: { createdAt: "desc" },
      }),
      prisma.proofEvent.findMany({
        take: Math.min(Math.max(limit, 1), 50),
        orderBy: { createdAt: "desc" },
      }),
      prisma.policyVersion.findMany({
        take: Math.min(Math.max(limit, 1), 50),
        orderBy: { updatedAt: "desc" },
      }),
    ])

    return NextResponse.json({
      verificationEvents,
      auditEvents,
      proofEvents,
      policyVersions,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "audit_unavailable",
        message: error instanceof Error ? error.message : "Unable to load audit trail",
      },
      { status: 500 },
    )
  }
}
