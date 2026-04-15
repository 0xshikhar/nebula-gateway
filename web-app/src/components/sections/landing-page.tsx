"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Code2,
  Copy,
  ExternalLink,
  Hexagon,
  Lock,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RevealSection, StaggerContainer, StaggerItem } from "@/components/motion"
import { features, protocols, steps, stats, useCases } from "@/lib/data"

const installCommand = "npm install @nebulaid/gateway-sdk"

const verifySnippet = `import { createTrustClient, HASHKEY_TESTNET, defaultProofLibrary } from "@nebulaid/gateway-sdk"

const client = createTrustClient({
  chainId: HASHKEY_TESTNET.id,
  proofLibrary: defaultProofLibrary,
})

const result = await client.verify({
  wallet: "0x1234...",
  protocol: "vault",
  reputationBand: 4,
  humanProof: true,
})`

const verifyResponse = `{
  decision: "allow",
  trustScore: 92,
  bandLabel: "Platinum",
  policyVersion: "nebula-trust-v1",
  reasons: [
    "Reputation band meets vault requirements",
    "Human proof verified",
    "Cohort member in good standing",
    "No expired credentials"
  ]
}`

const challengeCards = [
  {
    title: "KYC",
    copy: "Works, but it destroys privacy and excludes users who should not need to reveal identity.",
    accent: "from-orange-500/20 to-amber-500/10",
  },
  {
    title: "Gitcoin Passport",
    copy: "Useful, but incomplete and not designed as a protocol-level trust primitive.",
    accent: "from-cyan-500/20 to-sky-500/10",
  },
  {
    title: "Manual review",
    copy: "Too slow for a live DeFi flow and impossible to scale when claims spike.",
    accent: "from-rose-500/20 to-red-500/10",
  },
  {
    title: "Token gating",
    copy: "Easy to bypass with multiple wallets and impossible to trust on its own.",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
]

function TrustHeroPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050913]/95 shadow-2xl shadow-emerald-950/20 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Live SDK preview</p>
          <p className="mt-0.5 text-xs text-white/70">Real request and response.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] text-emerald-100">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          140ms
        </div>
      </div>

      <Tabs defaultValue="request" className="p-3">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-white/5 bg-white/[0.03] p-1">
          <TabsTrigger
            value="request"
            className="rounded-lg px-3 py-1.5 text-xs text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Request
          </TabsTrigger>
          <TabsTrigger
            value="response"
            className="rounded-lg px-3 py-1.5 text-xs text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Response
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="mt-3">
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">createTrustClient</p>
                <p className="mt-0.5 text-xs text-white/70">Canonical SDK call.</p>
              </div>
              <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100 text-[10px]">
                SDK
              </Badge>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-5 text-slate-300">
              {verifySnippet}
            </pre>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">Privacy-first</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">No KYC</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">HashKey testnet</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="response" className="mt-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/60">Decision</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">92</p>
                </div>
                <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/15 text-emerald-50 text-[10px]">
                  allow
                </Badge>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
              </div>
              <p className="mt-2 text-xs text-emerald-100/70">Trust score, band label, and reasons.</p>

              <ul className="mt-3 space-y-1.5">
                {[
                  "Reputation band meets vault requirements",
                  "Human proof verified",
                  "Cohort member in good standing",
                  "No expired credentials",
                ].map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-xs text-slate-200/90">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">API response</p>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-5 text-slate-300">
                {verifyResponse}
              </pre>
              <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <ClipboardCopy className="h-3 w-3 text-emerald-300" />
                  Replay protection via `useNullifier(bytes32)`.
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/60">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-slate-300/80 md:text-lg">
        {description}
      </p>
    </div>
  )
}

export default function LandingPage() {
  const [copied, setCopied] = useState(false)

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_46%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.12),_transparent_42%)]" />
        <div className="absolute left-[8%] top-10 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-[2%] top-[28%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <section className="relative z-10 px-4 pt-14 md:pt-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-12">
          <div className="space-y-8 lg:pt-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm text-emerald-100">HashKey testnet live</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="space-y-5"
            >
              <h1 className="max-w-lg text-balance text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl lg:text-6xl">
                Verify humans, not wallets.
              </h1>
              <p className="max-w-md text-pretty text-base leading-7 text-slate-300/80 md:text-lg">
                The privacy-preserving trust layer for DeFi. One SDK install, one verification call, zero wallet addresses exposed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-lg shadow-black/10">
                <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <Terminal className="h-4 w-4 text-emerald-300" />
                  <code className="font-mono text-xs text-slate-100">{installCommand}</code>
                </div>
                <Button
                  type="button"
                  onClick={copyInstall}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-white px-6 text-slate-950 hover:bg-emerald-100">
                  <Link href="/demo">
                    Open Demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/[0.06]"
                >
                  <a href="https://www.npmjs.com/package/@nebulaid/gateway-sdk" target="_blank" rel="noreferrer">
                    View on NPM
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="grid gap-3 sm:grid-cols-3"
            >
              {[
                { icon: Zap, label: "Verification", value: "140ms" },
                { icon: Lock, label: "Addresses exposed", value: "0" },
                { icon: ShieldCheck, label: "Sybils blocked", value: "90%+" },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/40">
                      <Icon className="h-4 w-4 text-emerald-300" />
                      {item.label}
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
                  </div>
                )
              })}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.12 }}
            className="relative lg:pt-4"
          >
            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-r from-emerald-400/15 via-cyan-400/10 to-transparent blur-3xl" />
            <TrustHeroPanel />
          </motion.div>
        </div>
      </section>

      <section id="proof" className="relative z-10 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/60">Proof</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">
                    The landing page should prove the product with specifics.
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-300/70">
                  These metrics are intentionally concrete, because the story only works if the page can be
                  tested by reading it.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                {stats.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/10 bg-black/20 p-5 transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/40">
                        <Icon className="h-4 w-4 text-emerald-300" />
                        {item.label}
                      </div>
                      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section id="problem" className="relative z-10 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <SectionHeading
              eyebrow="The Problem"
              title="Every DeFi protocol has a sybil problem."
              description="Airdrops get farmed, vaults get drained, and reward programs get gamed. The solution cannot be KYC-only because the privacy tradeoff is too high."
            />
          </RevealSection>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <StaggerContainer staggerDelay={0.08} className="grid gap-4 sm:grid-cols-2">
              {challengeCards.map((card, index) => (
                <StaggerItem key={card.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${card.accent} p-6`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_48%)]" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-semibold text-white">
                        0{index + 1}
                      </div>
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-white/70">
                        Broken
                      </Badge>
                    </div>
                    <h3 className="relative mt-6 text-xl font-semibold tracking-tight text-white">{card.title}</h3>
                    <p className="relative mt-3 max-w-sm text-sm leading-6 text-slate-200/80">{card.copy}</p>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <RevealSection delay={0.08}>
              <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/[0.06] p-7 md:p-8">
                <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
                  What Nebula Gateway adds
                </Badge>
                <h3 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white">
                  Privacy-preserving trust verification for DeFi.
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/80 md:text-base">
                  Users prove eligibility with a Semaphore proof, protocols get a clear allow/review/deny
                  decision, and the on-chain nullifier prevents replay without exposing identity.
                </p>

                <div className="mt-8 grid gap-3">
                  {[
                    "One SDK install",
                    "One verification call",
                    "One on-chain nullifier",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      <section id="use-cases" className="relative z-10 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <SectionHeading
              eyebrow="Use Cases"
              title="Built for the places where sybils actually hurt."
              description="The same trust layer works across airdrops, vaults, rewards, and cohort-based access because the product speaks in policies, not wallets."
            />
          </RevealSection>

          <StaggerContainer staggerDelay={0.08} className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {useCases.map((useCase) => {
              const Icon = useCase.icon
              return (
                <StaggerItem key={useCase.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`relative overflow-hidden rounded-[28px] border ${useCase.border} bg-gradient-to-br ${useCase.gradient} p-6`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_45%)]" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-white/80">
                        {useCase.metric}
                      </Badge>
                    </div>
                    <h3 className="relative mt-6 text-xl font-semibold tracking-tight text-white">{useCase.title}</h3>
                    <p className="relative mt-3 text-sm leading-6 text-slate-200/82">{useCase.description}</p>
                    <div className="relative mt-5 flex flex-wrap gap-2">
                      {useCase.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      <section id="sdk" className="relative z-10 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <SectionHeading
              eyebrow="How It Works"
              title="Code-first integration from install to nullifier."
              description="The steps are intentionally close to the published SDK so a protocol engineer can read the page and know the integration path immediately."
            />
          </RevealSection>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {steps.map((step, index) => (
              <RevealSection key={step.number} delay={0.06 * index}>
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center gap-4 border-b border-white/5 px-5 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 font-mono text-sm text-emerald-100">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white">{step.title}</h3>
                      <p className="text-sm text-slate-300/70">{step.description}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <pre className="overflow-x-auto rounded-[22px] border border-white/5 bg-black/30 p-4 font-mono text-[13px] leading-6 text-slate-300">
                      {step.code}
                    </pre>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <SectionHeading
              eyebrow="Features"
              title="Designed like a product, not a slide deck."
              description="Each feature card carries a concrete claim and supporting tags, so the page reads like a serious SDK landing page instead of generic startup copy."
            />
          </RevealSection>

          <StaggerContainer staggerDelay={0.07} className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <StaggerItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                          <Icon className="h-4 w-4 text-emerald-300" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-white">{feature.title}</h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Nebula Gateway</p>
                        </div>
                      </div>
                      <Code2 className="h-4 w-4 text-white/30" />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-300/76">{feature.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/68"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      <section id="protocols" className="relative z-10 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/60">Policy presets</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">
                    Built for common DeFi access patterns.
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-300/70">
                  Vaults, pools, airdrops, and rewards all want the same thing: trust signals without identity
                  leakage.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {protocols.map((protocol) => (
                  <div
                    key={protocol.name}
                    className="flex items-center justify-between rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${protocol.color}`} />
                      <div>
                        <p className="font-medium text-white">{protocol.name}</p>
                        <p className="text-sm text-slate-300/65">{protocol.status}</p>
                      </div>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-white/45">{protocol.requirements}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-cyan-400/10 p-8 md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_60%)]" />
              <div className="relative text-center">
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/60">CTA</p>
                <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                  Ship privacy-preserving trust in ten minutes.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-slate-300/78 md:text-lg">
                  Install the SDK, call verify, and register the nullifier. That is the integration story the page
                  should make obvious.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-white px-6 text-slate-950 hover:bg-emerald-100">
                    <Link href="/demo">
                      Open the demo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/[0.06]"
                  >
                    <a href="https://www.npmjs.com/package/@nebulaid/gateway-sdk" target="_blank" rel="noreferrer">
                      View NPM package
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  <code className="font-mono">{installCommand}</code>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
              <Hexagon className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Nebula Gateway</p>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">HashKey Chain</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/55">
            <a href="#use-cases" className="transition-colors hover:text-white">
              Use cases
            </a>
            <a href="#sdk" className="transition-colors hover:text-white">
              SDK
            </a>
            <a href="https://www.npmjs.com/package/@nebulaid/gateway-sdk" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
              NPM
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
