-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "NFTid" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "source" TEXT,
    "protocol" TEXT,
    "decisionMode" TEXT,
    "minTrustScore" INTEGER,
    "minBand" INTEGER,
    "requireHuman" BOOLEAN NOT NULL DEFAULT false,
    "requireCredential" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreSnapshot" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "bandLabel" TEXT NOT NULL,
    "signalSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofEvent" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "proofId" TEXT,
    "proofLibrary" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "bandLabel" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "proofLibrary" TEXT NOT NULL,
    "proofId" TEXT,
    "reasons" JSONB NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofEventId" TEXT,
    "policyVersionId" TEXT,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "wallet" TEXT,
    "protocol" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationEventId" TEXT,
    "policyVersionId" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVersion_policyKey_key" ON "PolicyVersion"("policyKey");

-- CreateIndex
CREATE INDEX "TrustScoreSnapshot_wallet_protocol_idx" ON "TrustScoreSnapshot"("wallet", "protocol");

-- CreateIndex
CREATE INDEX "TrustScoreSnapshot_createdAt_idx" ON "TrustScoreSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProofEvent_proofId_key" ON "ProofEvent"("proofId");

-- CreateIndex
CREATE INDEX "ProofEvent_wallet_protocol_idx" ON "ProofEvent"("wallet", "protocol");

-- CreateIndex
CREATE INDEX "ProofEvent_status_createdAt_idx" ON "ProofEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationEvent_wallet_protocol_idx" ON "VerificationEvent"("wallet", "protocol");

-- CreateIndex
CREATE INDEX "VerificationEvent_policyVersion_idx" ON "VerificationEvent"("policyVersion");

-- CreateIndex
CREATE INDEX "VerificationEvent_verifiedAt_idx" ON "VerificationEvent"("verifiedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_createdAt_idx" ON "AuditEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_proofEventId_fkey" FOREIGN KEY ("proofEventId") REFERENCES "ProofEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_verificationEventId_fkey" FOREIGN KEY ("verificationEventId") REFERENCES "VerificationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
