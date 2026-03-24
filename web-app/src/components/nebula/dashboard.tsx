"use client"

import { useMemo, useState } from "react"
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
  trustDecisionLabels,
} from "@/lib/nebula-contracts"
import { hashkeyTestnet } from "@/lib/customChain"

type DashboardResult = ReturnType<typeof evaluateTrust> & {
  wallet: string
  protocol: TrustProtocol
  proofId: string
  verifiedAt: string
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

  const currentPreset = useMemo(
    () => protocolPresets.find((preset) => preset.key === state.protocol) ?? protocolPresets[0],
    [state.protocol],
  )

  const preview = useMemo(() => {
    return evaluateTrust({
      ...state,
      wallet: address ?? state.wallet,
      proofLibrary: defaultProofLibrary,
    })
  }, [address, state])

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
                  Trust contract: {hasNebulaTrustGate ? "configured" : "unset"}
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Contract address</p>
                <p className="mt-2 font-mono text-sm">{nebulaTrustGateAddress}</p>
                <p className="mt-1 text-xs text-slate-500">Policy registry: {nebulaPolicyRegistryAddress}</p>
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
                  <p className="mt-3 text-sm text-slate-400">No decision loaded yet or contract not configured.</p>
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
    </div>
  )
}
