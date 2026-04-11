import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getSemaphoreDemoCommitments, getSemaphoreScope, buildSemaphoreGroup } from "@/lib/nebula-semaphore"
import { policyVersion as defaultPolicyVersion, type TrustProtocol } from "@/lib/nebula-trust"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const protocol = searchParams.get("protocol") as TrustProtocol | null
  const policyVersion = searchParams.get("policyVersion") ?? defaultPolicyVersion

  if (!protocol) {
    return NextResponse.json(
      { error: "invalid_request", message: "protocol is required" },
      { status: 400 },
    )
  }

  try {
    const members = await prisma.semaphoreMember
      .findMany({
        where: {
          protocol,
          policyVersion,
          active: true,
        },
        orderBy: { createdAt: "asc" },
        select: {
          commitment: true,
          wallet: true,
          decision: true,
          trustScore: true,
          bandLabel: true,
        },
      })
      .catch((error) => {
        console.warn("[semaphore/group] falling back to demo commitments", error)
        return []
      })

    const commitments = Array.from(
      new Set([
        ...getSemaphoreDemoCommitments(protocol, policyVersion),
        ...members.map((member) => member.commitment),
      ]),
    )

    const group = buildSemaphoreGroup(commitments)

    return NextResponse.json({
      protocol,
      policyVersion,
      scope: getSemaphoreScope(protocol, policyVersion),
      root: group.root.toString(),
      depth: group.depth,
      size: group.size,
      commitments,
      members,
      source: members.length > 0 ? "database" : "demo",
    })
  } catch (error) {
    const demoCommitments = getSemaphoreDemoCommitments(protocol, policyVersion)
    const group = buildSemaphoreGroup(demoCommitments)

    return NextResponse.json(
      {
        protocol,
        policyVersion,
        scope: getSemaphoreScope(protocol, policyVersion),
        root: group.root.toString(),
        depth: group.depth,
        size: group.size,
        commitments: demoCommitments,
        members: [],
        source: "demo-fallback",
        warning: error instanceof Error ? error.message : "Unable to load semaphore group",
      },
      { status: 200 },
    )
  }
}
