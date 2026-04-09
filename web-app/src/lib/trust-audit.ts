import { prisma } from "@/lib/prisma"

type PersistResult<T> = {
  ok: boolean
  record: T | null
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

async function persist<T>(label: string, action: () => Promise<T>): Promise<PersistResult<T>> {
  if (!hasDatabaseUrl) {
    return { ok: false, record: null }
  }

  try {
    return { ok: true, record: await action() }
  } catch (error) {
    console.error(`[trust-audit] ${label} failed`, error)
    return { ok: false, record: null }
  }
}

export async function persistPolicyVersionSnapshot(input: {
  version: string
  source?: string
  protocol?: string
  decisionMode?: string
  minTrustScore?: number
  minBand?: number
  requireHuman?: boolean
  requireCredential?: boolean
  active?: boolean
}) {
  const policyKey = input.protocol ? `${input.protocol}:${input.version}` : input.version

  return persist("policyVersion", () =>
    prisma.policyVersion.upsert({
      where: { policyKey },
      update: {
        policyKey,
        source: input.source,
        protocol: input.protocol,
        decisionMode: input.decisionMode,
        minTrustScore: input.minTrustScore,
        minBand: input.minBand,
        requireHuman: input.requireHuman ?? false,
        requireCredential: input.requireCredential ?? false,
        active: input.active ?? true,
      },
      create: {
        policyKey,
        version: input.version,
        source: input.source,
        protocol: input.protocol,
        decisionMode: input.decisionMode,
        minTrustScore: input.minTrustScore,
        minBand: input.minBand,
        requireHuman: input.requireHuman ?? false,
        requireCredential: input.requireCredential ?? false,
        active: input.active ?? true,
      },
    }),
  )
}

export async function persistProofEvent(input: {
  wallet: string
  protocol: string
  proofId?: string | null
  proofLibrary: string
  issuedAt?: string
  verifiedAt?: string
  status: string
  metadata?: Record<string, unknown>
}) {
  return persist("proofEvent", async () => {
    const payload = {
      wallet: input.wallet,
      protocol: input.protocol,
      proofLibrary: input.proofLibrary,
      issuedAt: input.issuedAt ? new Date(input.issuedAt) : null,
      verifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : null,
      status: input.status,
      metadata: input.metadata ?? {},
    }

    if (input.proofId) {
      return prisma.proofEvent.upsert({
        where: { proofId: input.proofId },
        update: payload,
        create: {
          ...payload,
          proofId: input.proofId,
        },
      })
    }

    return prisma.proofEvent.create({
      data: {
        ...payload,
        proofId: null,
      },
    })
  })
}

export async function persistTrustScoreSnapshot(input: {
  wallet: string
  protocol: string
  score: number
  bandLabel: string
  signalSummary?: Record<string, unknown>
}) {
  return persist("trustScoreSnapshot", () =>
    prisma.trustScoreSnapshot.create({
      data: {
        wallet: input.wallet,
        protocol: input.protocol,
        score: input.score,
        bandLabel: input.bandLabel,
        signalSummary: input.signalSummary ?? {},
      },
    }),
  )
}

export async function persistVerificationEvent(input: {
  wallet: string
  protocol: string
  decision: string
  trustScore: number
  bandLabel: string
  policyVersion: string
  proofLibrary: string
  proofId?: string | null
  reasons: string[]
  proofEventId?: string | null
  policyVersionId?: string | null
}) {
  return persist("verificationEvent", () =>
    prisma.verificationEvent.create({
      data: {
        wallet: input.wallet,
        protocol: input.protocol,
        decision: input.decision,
        trustScore: input.trustScore,
        bandLabel: input.bandLabel,
        policyVersion: input.policyVersion,
        proofLibrary: input.proofLibrary,
        proofId: input.proofId ?? null,
        reasons: input.reasons,
        proofEventId: input.proofEventId ?? null,
        policyVersionId: input.policyVersionId ?? null,
      },
    }),
  )
}

export async function persistAuditEvent(input: {
  eventType: string
  wallet?: string
  protocol?: string
  payload: Record<string, unknown>
  verificationEventId?: string | null
  policyVersionId?: string | null
}) {
  return persist("auditEvent", () =>
    prisma.auditEvent.create({
      data: {
        eventType: input.eventType,
        wallet: input.wallet ?? null,
        protocol: input.protocol ?? null,
        payload: input.payload,
        verificationEventId: input.verificationEventId ?? null,
        policyVersionId: input.policyVersionId ?? null,
      },
    }),
  )
}
