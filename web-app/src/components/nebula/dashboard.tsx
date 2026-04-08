"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSignMessage,
} from "wagmi"
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Code2,
  Shield,
  Sparkles,
  Users,
} from "lucide-react"
import { keccak256, stringToHex } from "viem"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { createBrowserProof } from "@/lib/nebula-proof"
import {
  defaultProofLibrary,
  evaluateTrust,
  getTrustPolicy,
  protocolPresets,
  type TrustDecision,
  type TrustInput,
  type TrustProtocol,
} from "@/lib/nebula-trust"
import {
  hasNebulaTrustGate,
  nebulaPolicyRegistryAddress,
  nebulaTrustGateAbi,
  nebulaTrustGateAddress,
  nebulaTrustVerifierAddress,
  trustDecisionLabels,
  trustPolicyAbi,
  trustVerifierAbi,
} from "@/lib/nebula-contracts"
import { hashkeyTestnet } from "@/lib/customChain"

type DashboardResult = ReturnType<typeof evaluateTrust> & {
  wallet: string
  protocol: TrustProtocol
  proofId: string
  verifiedAt: string
}

type AuditRecord = {
  id: string
  wallet?: string | null
  protocol?: string | null
  decision?: string | null
  trustScore?: number | null
  bandLabel?: string | null
  policyVersion?: string | null
  proofLibrary?: string | null
  proofId?: string | null
  eventType?: string | null
  status?: string | null
  createdAt?: string | null
  verifiedAt?: string | null
  payload?: Record<string, unknown> | null
  reasons?: unknown
  version?: string | null
  active?: boolean | null
  source?: string | null
}

type AuditFeed = {
  verificationEvents: AuditRecord[]
  auditEvents: AuditRecord[]
  proofEvents: AuditRecord[]
  policyVersions: AuditRecord[]
}

const initialState: TrustInput = {
  wallet: "",
  protocol: "vault",
  reputationBand: 4,
  humanProof: true,
  cohortMember: true,
  credentialVerified: true,
  expired: false,
  proofLibrary: defaultProofLibrary,
  proofId: "",
}

const decisionLabels: Record<TrustDecision, string> = {
  allow: "allow",
  review: "review",
  deny: "deny",
}

const decisionStyles: Record<TrustDecision, string> = {
  allow: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
  review: "border-amber-400/20 bg-amber-400/10 text-amber-50",
  deny: "border-rose-400/20 bg-rose-400/10 text-rose-50",
}

export function NebulaDashboard() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const { signMessageAsync } = useSignMessage()
  const { writeContract, data: txHash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const [state, setState] = useState<TrustInput>({
    ...initialState,
    wallet: address ?? "",
  })
  const [result, setResult] = useState<DashboardResult | null>(null)
  const [policyNotes, setPolicyNotes] = useState(
    "Default Nebula policy: human proof required, reputation band >= 3 for vault/pool, cohort membership required for rewards and airdrops.",
  )
  const [proofMeta, setProofMeta] = useState<{ proofId: string; issuedAt: string } | null>(null)
  const [browserProofMessage, setBrowserProofMessage] = useState<string>("")
  const [isGeneratingProof, setIsGeneratingProof] = useState(false)
  const [auditFeed, setAuditFeed] = useState<AuditFeed | null>(null)
  const [isAuditLoading, setIsAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  const currentPreset = useMemo(
    () => protocolPresets.find((preset) => preset.key === state.protocol) ?? protocolPresets[0],
    [state.protocol],
  )

  const currentPolicy = useMemo(() => getTrustPolicy(state.protocol), [state.protocol])
  const selectedPolicyId = useMemo(() => keccak256(stringToHex(currentPolicy.id)), [currentPolicy.id])

  const preview = useMemo(() => {
    return evaluateTrust({
      ...state,
      wallet: address ?? state.wallet,
      proofLibrary: defaultProofLibrary,
    })
  }, [address, state])

  const loadAuditFeed = useCallback(async () => {
    setIsAuditLoading(true)
    setAuditError(null)

    try {
      const response = await fetch("/api/audit?limit=8")

      if (!response.ok) {
        throw new Error("Unable to load audit trail")
      }

      const data = (await response.json()) as AuditFeed
      setAuditFeed(data)
    } catch (error) {
      setAuditFeed(null)
      setAuditError(error instanceof Error ? error.message : "Unable to load audit trail")
    } finally {
      setIsAuditLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAuditFeed()
  }, [loadAuditFeed])

  const lastDecisionTuple = useReadContract({
    address: nebulaTrustGateAddress,
    abi: nebulaTrustGateAbi,
    functionName: "lastDecision",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: hasNebulaTrustGate && Boolean(address),
    },
  })

  const policyVersionRead = useReadContract({
    address: nebulaTrustGateAddress,
    abi: nebulaTrustGateAbi,
    functionName: "policyVersion",
    query: {
      enabled: hasNebulaTrustGate,
    },
  })

  const decisionCountRead = useReadContract({
    address: nebulaTrustGateAddress,
    abi: nebulaTrustGateAbi,
    functionName: "decisionCount",
    query: {
      enabled: hasNebulaTrustGate,
    },
  })

  const trustScoreRead = useReadContract({
    address: nebulaTrustVerifierAddress,
    abi: trustVerifierAbi,
    functionName: "getTrustScore",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: Boolean(address) && nebulaTrustVerifierAddress !== "0x0000000000000000000000000000000000000000",
    },
  })

  const policyRead = useReadContract({
    address: nebulaPolicyRegistryAddress,
    abi: trustPolicyAbi,
    functionName: "getPolicy",
    args: [selectedPolicyId],
    query: {
      enabled: nebulaPolicyRegistryAddress !== "0x0000000000000000000000000000000000000000",
    },
  })

  const runBrowserProof = async () => {
    if (!address) return

    setIsGeneratingProof(true)
    try {
      if (chainId !== hashkeyTestnet.id) {
        await switchChainAsync?.({ chainId: hashkeyTestnet.id })
      }

      const proof = createBrowserProof({
        address,
        chainId: hashkeyTestnet.id,
        protocol: state.protocol,
        trustBand: state.reputationBand,
      })

      const signature = await signMessageAsync({ message: proof.message })
      setBrowserProofMessage(proof.message)
      setProofMeta({ proofId: proof.proofId, issuedAt: proof.issuedAt })

      const response = await fetch("/api/trust/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...state,
          wallet: address,
          proofLibrary: defaultProofLibrary,
          proofId: proof.proofId,
          proof: {
            message: proof.message,
            signature,
            nonce: proof.nonce,
            issuedAt: proof.issuedAt,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Unable to verify browser proof")
      }

      const data = (await response.json()) as DashboardResult
      setResult(data)
      void loadAuditFeed()
    } catch (error) {
      console.error(error)
    } finally {
      setIsGeneratingProof(false)
    }
  }

  const writeDecisionToChain = async () => {
    if (!result || !address || !hasNebulaTrustGate) return

    const proofIdBytes32 = keccak256(stringToHex(result.proofId))
    const decisionCode = result.decision === "deny" ? 0 : result.decision === "review" ? 1 : 2

    writeContract({
      address: nebulaTrustGateAddress,
      abi: nebulaTrustGateAbi,
      functionName: "recordDecision",
      args: [address, decisionCode, BigInt(result.trustScore), proofIdBytes32, result.policyVersion],
    })
  }

  const publishPolicyVersion = async () => {
    if (!hasNebulaTrustGate) return
    writeContract({
      address: nebulaTrustGateAddress,
      abi: nebulaTrustGateAbi,
      functionName: "publishPolicy",
      args: [policyNotes.trim() || "nebula-trust-v1"],
    })
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <Badge className="rounded-full border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-emerald-100">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Nebula dashboard
              </Badge>
              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                Policy control, browser proof generation, and HashKey Chain writes in one place.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-300 md:text-lg">
                This page is for protocol operators. It previews the decision engine, generates a signed browser proof,
                and writes the decision to HashKey testnet when a contract address is configured.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={runBrowserProof}
                  disabled={!address || isSwitchingChain || isGeneratingProof}
                  className="rounded-full bg-white px-6 text-slate-950 hover:bg-emerald-100"
                >
                  {isSwitchingChain
                    ? "Switching to HashKey..."
                    : isGeneratingProof
                      ? "Generating browser proof..."
                      : "Generate browser proof"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={writeDecisionToChain}
                  disabled={!result || !hasNebulaTrustGate || isWriting || isConfirming || isGeneratingProof}
                  className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
                >
                  {isWriting || isConfirming ? "Writing to chain..." : "Record decision on-chain"}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  HashKey RPC: https://testnet.hsk.xyz
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Explorer: Blockscout
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Chain ID: {hashkeyTestnet.id}
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Trust gateway: {hasNebulaTrustGate ? "configured" : "unset"}
                </Badge>
              </div>
            </div>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Current policy preview</CardTitle>
                <CardDescription className="text-slate-300">
                  Adjust the policy before sending a proof or chain write.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Protocol action</Label>
                      <p className="mt-1 text-sm text-slate-400">{currentPreset.description}</p>
                    </div>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-white">{currentPreset.title}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {protocolPresets.map((preset) => (
                      <Button
                        key={preset.key}
                        variant={state.protocol === preset.key ? "default" : "outline"}
                        className={cn(
                          "rounded-2xl",
                          state.protocol === preset.key
                            ? "bg-white text-slate-950 hover:bg-slate-100"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                        )}
                        onClick={() => setState((current) => ({ ...current, protocol: preset.key }))}
                      >
                        {preset.title}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-slate-300">Reputation band</Label>
                    <span className="text-sm text-slate-200">Band {state.reputationBand}</span>
                  </div>
                  <Slider
                    value={[state.reputationBand]}
                    min={0}
                    max={4}
                    step={1}
                    onValueChange={(value) =>
                      setState((current) => ({ ...current, reputationBand: value[0] ?? 0 }))
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "humanProof", label: "Human proof", icon: Shield },
                    { key: "cohortMember", label: "Cohort member", icon: Users },
                    { key: "credentialVerified", label: "Credential verified", icon: BadgeCheck },
                    { key: "expired", label: "Expired proof", icon: Clock3 },
                  ].map((item) => {
                    const Icon = item.icon
                    const checked = Boolean(state[item.key as keyof TrustInput])

                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-emerald-200" />
                          <Label className="text-sm text-slate-200">{item.label}</Label>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={(value) => setState((current) => ({ ...current, [item.key]: value } as TrustInput))}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policy notes</p>
                  <Textarea
                    className="mt-3 min-h-28 border-white/10 bg-slate-950/80 text-white"
                    value={policyNotes}
                    onChange={(event) => setPolicyNotes(event.target.value)}
                  />
                </div>

                <Separator className="bg-white/10" />

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Preview decision</p>
                      <h3 className="mt-1 text-2xl font-semibold capitalize">{preview.decision}</h3>
                    </div>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-white">{preview.bandLabel}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{preview.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policy</p>
                      <p className="mt-2 text-sm font-semibold text-white">{preview.policy.title}</p>
                      <p className="mt-2 text-xs text-slate-300">ID: {preview.policy.id}</p>
                      <p className="mt-1 text-xs text-slate-300">Version: {preview.policyVersion}</p>
                      <p className="mt-1 text-xs text-slate-300">Min score: {preview.policy.minTrustScore}</p>
                      <p className="mt-1 text-xs text-slate-300">Min band: {preview.policy.minBand}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Signal score</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{preview.signalBreakdown.trustScore}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        Review threshold: {preview.policy.reviewThreshold}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Human proof: {preview.policy.requireHuman ? "required" : "optional"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Credential: {preview.policy.requireCredential ? "required" : "optional"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Signal breakdown</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {preview.signalBreakdown.contributions.map((item) => (
                        <div key={item.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-300">{item.label}</span>
                            <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] text-slate-200">
                              {item.enabled ? "on" : "off"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-white">{item.contribution} / {item.weight}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {preview.signalBreakdown.conditions.map((condition) => (
                        <div
                          key={condition.key}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                        >
                          <div>
                            <p className="text-xs text-slate-300">{condition.label}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{condition.reason}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-white/10",
                              condition.passed
                                ? "bg-emerald-400/10 text-emerald-100"
                                : "bg-rose-400/10 text-rose-100",
                            )}
                          >
                            {condition.passed ? "pass" : "block"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#08101f]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Chain state</CardTitle>
              <CardDescription className="text-slate-300">
                Live reads from the Nebula trust gate contract on HashKey testnet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Gateway contract address</p>
                <p className="mt-2 font-mono text-sm">{nebulaTrustGateAddress}</p>
                <p className="mt-1 text-xs text-slate-500">Policy registry: {nebulaPolicyRegistryAddress}</p>
                <p className="mt-1 text-xs text-slate-500">Verifier: {nebulaTrustVerifierAddress}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policy version</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {typeof policyVersionRead.data === "string" ? policyVersionRead.data : "not loaded"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Decision count</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {typeof decisionCountRead.data === "bigint" ? decisionCountRead.data.toString() : "0"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">On-chain trust score</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {trustScoreRead.data ? `${trustScoreRead.data[0].toString()} / band ${trustScoreRead.data[1].toString()}` : "not loaded"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected policy</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {policyRead.data ? policyRead.data[0] : "not loaded"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Latest on-chain decision</p>
                {lastDecisionTuple.data ? (
                  <div className="mt-3 space-y-1 text-sm text-slate-200">
                    <p>decision: {trustDecisionLabels[lastDecisionTuple.data[0] as number] ?? lastDecisionTuple.data[0]}</p>
                    <p>trustScore: {lastDecisionTuple.data[1].toString()}</p>
                    <p>policyVersion: {lastDecisionTuple.data[2]}</p>
                    <p>proofId: {lastDecisionTuple.data[3]}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No decision loaded yet or gateway not configured.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={runBrowserProof}
                  disabled={!address || isSwitchingChain || isGeneratingProof}
                  className="rounded-full bg-white px-6 text-slate-950 hover:bg-emerald-100"
                >
                  {isSwitchingChain
                    ? "Switching to HashKey..."
                    : isGeneratingProof
                      ? "Generating browser proof..."
                      : "Generate browser proof"}
                </Button>
                <Button
                  onClick={publishPolicyVersion}
                  disabled={!hasNebulaTrustGate || isWriting || isConfirming}
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
                >
                  Publish policy on-chain
                </Button>
              </div>

              {(isWriting || isConfirming || isConfirmed) && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                  {isWriting || isConfirming ? "Writing transaction to HashKey testnet..." : "Transaction confirmed on-chain."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Proof and decision payload</CardTitle>
              <CardDescription className="text-slate-300">
                The dashboard produces a browser proof, evaluates it, and prepares a write payload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  <div className={cn("rounded-2xl border p-4", decisionStyles[result.decision])}>
                    <div className="flex items-center gap-3">
                      {result.decision === "allow" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                      ) : result.decision === "review" ? (
                        <Clock3 className="h-5 w-5 text-amber-200" />
                      ) : (
                        <CircleDashed className="h-5 w-5 text-rose-200" />
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] opacity-75">Decision</p>
                        <h3 className="text-3xl font-semibold capitalize">{result.decision}</h3>
                      </div>
                      <Badge className="ml-auto rounded-full border-white/10 bg-white/10 text-white">
                        {result.bandLabel}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trust score</p>
                        <p className="mt-2 text-3xl font-semibold">{result.trustScore}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policy</p>
                        <p className="mt-2 font-mono text-sm">{result.policyVersion}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reasons</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {result.reasons.map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Browser proof payload</p>
                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <p>proofId: {result.proofId}</p>
                      <p>wallet: {result.wallet}</p>
                      <p>verifiedAt: {result.verifiedAt}</p>
                      <p>proofLibrary: {result.proofLibrary}</p>
                      {proofMeta ? (
                        <>
                          <p>browserProofId: {proofMeta.proofId}</p>
                          <p>issuedAt: {proofMeta.issuedAt}</p>
                        </>
                      ) : null}
                    </div>
                    <Separator className="my-4 bg-white/10" />
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Proof message</p>
                    <pre className="mt-3 max-h-40 overflow-auto rounded-2xl bg-black/30 p-4 text-[11px] text-slate-200">
{browserProofMessage || "Generate a browser proof to inspect the SIWE message."}
                    </pre>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Write payload</p>
                    <pre className="mt-3 overflow-auto rounded-2xl bg-black/30 p-4 text-[11px] text-slate-200">
{JSON.stringify(
  {
    wallet: result.wallet,
    decision: decisionLabels[result.decision],
    trustScore: result.trustScore,
    proofId: result.proofId,
    policyVersion: result.policyVersion,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Generate a browser proof to see the policy evaluation and on-chain payload.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#050816]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operator trail</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Audit history and persistence preview</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Recent verification, proof, policy, and audit records are persisted when a database is configured.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 px-4 text-white hover:bg-white/10"
              onClick={() => void loadAuditFeed()}
              disabled={isAuditLoading}
            >
              {isAuditLoading ? "Refreshing..." : "Refresh audit trail"}
            </Button>
          </div>

          {auditError ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
              {auditError}
            </div>
          ) : null}

          {auditFeed ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="text-xl">Verification events</CardTitle>
                  <CardDescription className="text-slate-300">
                    Latest trust decisions returned by the API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditFeed.verificationEvents.length > 0 ? (
                    auditFeed.verificationEvents.map((event) => {
                      const decision = (event.decision ?? "deny") as TrustDecision
                      const reasons = Array.isArray(event.reasons) ? event.reasons : []

                      return (
                        <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-xs text-slate-400">{event.wallet ?? "unknown wallet"}</p>
                              <p className="mt-1 text-sm text-slate-200">{event.protocol ?? "unknown protocol"}</p>
                            </div>
                            <Badge className={cn("rounded-full", decisionStyles[decision])}>{decision}</Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                            <p>score: {event.trustScore ?? "n/a"}</p>
                            <p>band: {event.bandLabel ?? "n/a"}</p>
                            <p>policy: {event.policyVersion ?? "n/a"}</p>
                            <p>proof: {event.proofId ?? "n/a"}</p>
                          </div>
                          <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                            {event.verifiedAt ? new Date(event.verifiedAt).toLocaleString() : "no timestamp"}
                          </p>
                          {reasons.length > 0 ? (
                            <ul className="mt-3 space-y-1 text-xs text-slate-300">
                              {reasons.slice(0, 3).map((reason) => (
                                <li key={String(reason)} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                                  <span>{String(reason)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-slate-400">No verification events yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="text-xl">Proof and policy records</CardTitle>
                  <CardDescription className="text-slate-300">
                    Proof submissions, policy snapshots, and append-only audit entries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Proof events</p>
                    <div className="mt-3 space-y-3">
                      {auditFeed.proofEvents.length > 0 ? auditFeed.proofEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                          <p className="font-mono text-slate-200">{event.proofId ?? "no proof id"}</p>
                          <p className="mt-1">{event.protocol ?? "unknown protocol"} · {event.status ?? "unknown status"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString() : "no timestamp"}
                          </p>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-400">No proof records yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policy versions</p>
                    <div className="mt-3 space-y-3">
                      {auditFeed.policyVersions.length > 0 ? auditFeed.policyVersions.slice(0, 3).map((policy) => (
                        <div key={policy.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                          <p className="font-semibold text-slate-100">{policy.version ?? "unknown version"}</p>
                          <p className="mt-1">{policy.source ?? "unknown source"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            active: {policy.active ? "yes" : "no"} · updated {policy.updatedAt ? new Date(policy.updatedAt).toLocaleString() : "n/a"}
                          </p>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-400">No policy snapshots yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Audit entries</p>
                    <div className="mt-3 space-y-3">
                      {auditFeed.auditEvents.length > 0 ? auditFeed.auditEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                          <p className="font-semibold text-slate-100">{event.eventType ?? "unknown event"}</p>
                          <p className="mt-1">{event.protocol ?? "general"} · {event.wallet ?? "no wallet"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString() : "no timestamp"}
                          </p>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-400">No audit entries yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
              {isAuditLoading ? "Loading audit trail..." : "Audit trail unavailable or not yet recorded."}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
