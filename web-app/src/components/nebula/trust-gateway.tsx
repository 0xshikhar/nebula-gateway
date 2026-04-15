"use client"

import { useMemo, useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Banknote,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Shield,
  Sparkles,
  Users,
  Loader2,
  AlertCircle,
  WifiOff,
  Unplug,
} from "lucide-react"
import TechStack from "./tech-stack"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { hashkeyTestnet } from "@/lib/customChain"
import {
  defaultProofLibrary,
  evaluateTrust,
  protocolPresets,
  type TrustDecision,
  type TrustInput,
  type TrustProtocol,
} from "@/lib/nebula-trust"
import { nebulaTrustVerifierAddress, trustVerifierAbi } from "@/lib/nebula-contracts"
import {
  generateSemaphoreProofBundle,
  getOrCreateSemaphoreIdentity,
  verifySemaphoreProofBundle,
  toSemaphoreBytes32,
} from "@/lib/nebula-semaphore"

type ResultState = ReturnType<typeof evaluateTrust> & {
  wallet: string
  protocol: TrustProtocol
  proofId: string
  verifiedAt: string
}

const initialState: TrustInput = {
  wallet: "",
  protocol: "vault",
  reputationBand: 3,
  humanProof: true,
  cohortMember: true,
  credentialVerified: true,
  expired: false,
  proofLibrary: defaultProofLibrary,
  proofId: "",
}

const decisionStyles: Record<TrustDecision, string> = {
  allow: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
  review: "border-amber-400/20 bg-amber-400/10 text-amber-50",
  deny: "border-rose-400/20 bg-rose-400/10 text-rose-50",
}

const EXPLORER_BASE_URL = "https://testnet-explorer.hsk.xyz"

export function TrustGateway() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const [form, setForm] = useState<TrustInput>(initialState)
  const [result, setResult] = useState<ResultState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [proofPreview, setProofPreview] = useState<{ proofId: string; issuedAt: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [nullifierTxHash, setNullifierTxHash] = useState<string | null>(null)
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: nullifierTxHash as `0x${string}` | undefined,
    query: {
      enabled: Boolean(nullifierTxHash),
    },
  })
  const nullifierTxUrl = nullifierTxHash ? `${EXPLORER_BASE_URL}/tx/${nullifierTxHash}` : null

  const connectedWallet = address || form.wallet

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!connectedWallet) {
      errors.wallet = "Please connect your wallet first"
    }

    if (chainId !== hashkeyTestnet.id && chainId !== 0) {
      errors.chain = `Please switch to ${hashkeyTestnet.name}`
    }

    if (form.reputationBand < 0 || form.reputationBand > 4) {
      errors.band = "Band must be between 0 and 4"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const recommendedProtocol = useMemo(
    () => protocolPresets.find((item) => item.key === form.protocol) ?? protocolPresets[0],
    [form.protocol],
  )

  const updateForm = (patch: Partial<TrustInput>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const applyPreset = (protocol: TrustProtocol) => {
    const presets: Record<TrustProtocol, Partial<TrustInput>> = {
      vault: { protocol, reputationBand: 4, humanProof: true, cohortMember: true, credentialVerified: true, expired: false },
      pool: { protocol, reputationBand: 3, humanProof: true, cohortMember: true, credentialVerified: false, expired: false },
      rewards: { protocol, reputationBand: 2, humanProof: true, cohortMember: true, credentialVerified: true, expired: false },
      airdrop: { protocol, reputationBand: 2, humanProof: true, cohortMember: false, credentialVerified: false, expired: false },
    }

    const next = { ...initialState, ...presets[protocol], wallet: address ?? "", protocol }
    setForm(next)
    setResult(null)
  }

  const runVerification = async () => {
    setError(null)
    setValidationErrors({})
    setIsLoading(true)
    setResult(null)
    setProofPreview(null)
    setNullifierTxHash(null)
    console.info("[semaphore] trust-gateway verification started", {
      wallet: connectedWallet,
      protocol: form.protocol,
      chainId,
    })

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      if (!connectedWallet) {
        throw new Error("Connect a wallet before generating a proof")
      }

      if (chainId !== hashkeyTestnet.id) {
        await switchChainAsync?.({ chainId: hashkeyTestnet.id })
      }

      const identity = await getOrCreateSemaphoreIdentity(connectedWallet)

      const response = await fetch("/api/trust/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          wallet: connectedWallet,
          proofLibrary: defaultProofLibrary,
          identityCommitment: identity.commitment.toString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Trust verification failed")
      }

      const data = (await response.json()) as ResultState
      setResult(data)
      console.info("[semaphore] trust decision received", {
        wallet: connectedWallet,
        protocol: form.protocol,
        decision: data.decision,
        trustScore: data.trustScore,
        policyVersion: data.policyVersion,
        proofId: data.proofId,
      })

      if (data.decision !== "allow") {
        setProofPreview(null)
        console.info("[semaphore] proof generation skipped because decision was not allow", {
          wallet: connectedWallet,
          decision: data.decision,
        })
        return
      }

      const groupResponse = await fetch(
        `/api/semaphore/group?protocol=${encodeURIComponent(form.protocol)}&policyVersion=${encodeURIComponent(
          data.policyVersion,
        )}`,
      )

      if (!groupResponse.ok) {
        throw new Error("Unable to load Semaphore group")
      }

      const groupPayload = (await groupResponse.json()) as {
        commitments: Array<string | bigint>
        policyVersion: string
        protocol: TrustProtocol
        scope: string
        root: string
        depth: number
        source?: string
      }

      console.info("[semaphore] group loaded", {
        wallet: connectedWallet,
        protocol: form.protocol,
        policyVersion: data.policyVersion,
        source: groupPayload.source ?? "unknown",
        depth: groupPayload.depth,
        commitmentCount: groupPayload.commitments.length,
        root: groupPayload.root,
      })

      const proofBundle = await generateSemaphoreProofBundle({
        wallet: connectedWallet,
        protocol: form.protocol,
        policyVersion: data.policyVersion,
        trustScore: data.trustScore,
        groupCommitments: groupPayload.commitments,
      })

      const localVerification = await verifySemaphoreProofBundle(proofBundle.proof)

      if (!localVerification) {
        throw new Error("Semaphore proof failed local verification")
      }

      console.info("[semaphore] local proof verification passed", {
        wallet: connectedWallet,
        protocol: form.protocol,
        nullifier: proofBundle.proof.nullifier,
        scopeHash: proofBundle.scopeHash,
        messageHash: proofBundle.messageHash,
      })

      const proofResponse = await fetch("/api/semaphore/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: connectedWallet,
          protocol: form.protocol,
          policyVersion: data.policyVersion,
          scope: proofBundle.scope,
          message: proofBundle.message,
          proof: proofBundle.proof,
        }),
      })

      if (!proofResponse.ok) {
        throw new Error("Semaphore proof verification failed")
      }

      console.info("[semaphore] proof stored successfully", {
        wallet: connectedWallet,
        protocol: form.protocol,
        nullifier: proofBundle.proof.nullifier,
      })

      updateForm({ proofId: String(proofBundle.proof.nullifier) })
      setProofPreview({
        proofId: String(proofBundle.proof.nullifier),
        issuedAt: new Date().toISOString(),
      })

      setResult((current) =>
        current
          ? {
              ...current,
              proofId: String(proofBundle.proof.nullifier),
            }
          : current,
      )

      if (nebulaTrustVerifierAddress !== "0x0000000000000000000000000000000000000000") {
        try {
          const nullifierBytes32 = toSemaphoreBytes32(proofBundle.proof.nullifier)
          const tx = await writeContractAsync({
            address: nebulaTrustVerifierAddress,
            abi: trustVerifierAbi,
            functionName: "useNullifier",
            args: [nullifierBytes32],
          })
          setNullifierTxHash(tx)
          console.info("[semaphore] nullifier registered on-chain", {
            wallet: connectedWallet,
            nullifier: proofBundle.proof.nullifier,
            nullifierBytes32,
            txHash: tx,
          })
        } catch (nullifierError) {
          console.warn("Unable to register nullifier (non-critical)", nullifierError)
        }
      }
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(message)
      console.error("[semaphore] trust-gateway verification failed", {
        wallet: connectedWallet,
        protocol: form.protocol,
        error: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden">
      <section className="border-b border-white/10 bg-[#050816]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="rounded-full border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-emerald-100">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Nebula Gateway for HashKey Chain
              </Badge>
              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Proof-aware trust for DeFi protocols, without exposing identity.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-300 md:text-lg">
                Start the Nebula Gateway on top of the existing Wagmi, Viem, Tailwind, and RainbowKit app.
                Users connect a wallet, generate a Semaphore proof, and protocols receive a simple
                `allow`, `review`, or `deny` decision.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={runVerification}
                  disabled={!connectedWallet || isLoading || isSwitchingChain}
                  className="rounded-full bg-white px-6 text-slate-950 hover:bg-emerald-100"
                >
                  {isSwitchingChain ? "Switching to HashKey..." : isLoading ? "Generating Semaphore proof..." : "Run trust verification"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
                  onClick={() => applyPreset("vault")}
                >
                  Load vault preset
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  HashKey RPC: https://testnet-explorer.hsk.xyz
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Indexer: Blockscout
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Proof: Semaphore
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Deployment: Vercel
                </Badge>
              </div>
            </div>

            <Card className="border-white/10 bg-white/[0.04] text-white shadow-2xl shadow-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Protocol trust snapshot</CardTitle>
                <CardDescription className="text-slate-300">
                  The product starts here: one request, one policy engine, one decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Connected wallet</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {connectedWallet || "Connect a wallet to begin"}
                      </p>
                    </div>
                    <ConnectButton showBalance={false} />
                  </div>
                  {isConnected && chainId !== hashkeyTestnet.id && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-amber-200" />
                      <span className="text-sm text-amber-200">
                        Wrong network.{" "}
                        <button
                          onClick={() => switchChainAsync?.({ chainId: hashkeyTestnet.id })}
                          className="underline underline-offset-2 hover:text-amber-100"
                        >
                          Switch to {hashkeyTestnet.name}
                        </button>
                      </span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-rose-200" />
                      <span className="text-sm text-rose-200">{error}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Protocol action</Label>
                      <p className="mt-1 text-sm text-slate-400">{recommendedProtocol.description}</p>
                    </div>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-white">{recommendedProtocol.title}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {protocolPresets.map((preset) => (
                      <Button
                        key={preset.key}
                        variant={form.protocol === preset.key ? "default" : "outline"}
                        className={cn(
                          "rounded-2xl",
                          form.protocol === preset.key
                            ? "bg-white text-slate-950 hover:bg-slate-100"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                        )}
                        onClick={() => applyPreset(preset.key)}
                      >
                        {preset.title}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-slate-300">Reputation band</Label>
                    <span className="text-sm text-slate-200">Band {form.reputationBand}</span>
                  </div>
                  {validationErrors.band && (
                    <p className="mb-2 text-xs text-rose-200">{validationErrors.band}</p>
                  )}
                  <Slider
                    value={[form.reputationBand]}
                    min={0}
                    max={4}
                    step={1}
                    onValueChange={(value) => updateForm({ reputationBand: value[0] ?? 0 })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Human proof",
                      key: "humanProof",
                      icon: Shield,
                    },
                    {
                      label: "Cohort member",
                      key: "cohortMember",
                      icon: Users,
                    },
                    {
                      label: "Credential verified",
                      key: "credentialVerified",
                      icon: BadgeCheck,
                    },
                    {
                      label: "Expired proof",
                      key: "expired",
                      icon: Clock3,
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    const checked = Boolean(form[item.key as keyof TrustInput])

                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-emerald-200" />
                          <Label className="text-sm text-slate-200">{item.label}</Label>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={(value) => updateForm({ [item.key]: value } as Partial<TrustInput>)}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={runVerification}
                    disabled={isLoading || isSwitchingChain}
                    className="flex-1 rounded-2xl bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  >
                    {isSwitchingChain ? "Switching to HashKey..." : isLoading ? "Generating Semaphore proof..." : "Generate proof + verify"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {proofPreview ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Latest proof</p>
                    <div className="mt-2 space-y-1 font-mono text-xs">
                      <p>proofId: {proofPreview.proofId}</p>
                      <p>issuedAt: {proofPreview.issuedAt}</p>
                      <p>chainId: {chainId}</p>
                    </div>
                  </div>
                ) : null}

                {(nullifierTxHash || isConfirming || isConfirmed) && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">On-chain registration</p>
                    <div className="mt-2 space-y-2">
                      {isConfirming && (
                        <p className="text-xs text-emerald-300">Confirming transaction on HashKey testnet...</p>
                      )}
                      {isConfirmed && (
                        <p className="text-xs text-emerald-300">Transaction confirmed!</p>
                      )}
                      {nullifierTxHash && (
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={nullifierTxUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-emerald-300 hover:underline"
                          >
                            View transaction on Blockscout ↗
                          </a>
                          <a
                            href={`${EXPLORER_BASE_URL}/address/${nebulaTrustVerifierAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-emerald-300 hover:underline"
                          >
                            View contract on Blockscout ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(result || proofPreview || nullifierTxHash) && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Verification trail</p>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">1. Trust API</p>
                          <p className="text-xs text-slate-400">
                            {result
                              ? `Decision ${result.decision} for ${result.protocol} using policy ${result.policyVersion}.`
                              : "Waiting for trust evaluation."}
                          </p>
                        </div>
                        {result ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> : <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />}
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">2. Semaphore proof</p>
                          <p className="text-xs text-slate-400">
                            {proofPreview
                              ? `Generated proof ${proofPreview.proofId} and stored it through /api/semaphore/verify.`
                              : "Waiting for proof generation."}
                          </p>
                        </div>
                        {proofPreview ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                        ) : (
                          <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">3. Nullifier transaction</p>
                          <p className="text-xs text-slate-400">
                            {nullifierTxHash
                              ? `Registered on-chain as ${nullifierTxHash}.`
                              : "No on-chain transaction yet."}
                          </p>
                          {nullifierTxUrl ? (
                            <a
                              href={nullifierTxUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline"
                            >
                              Open transaction in Blockscout ↗
                            </a>
                          ) : null}
                        </div>
                        {nullifierTxHash ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                        ) : (
                          <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <TechStack result={result} />
    </div>
  )
}
