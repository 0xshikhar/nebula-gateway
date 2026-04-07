# Nebula Trust Gateway

Protocol-facing identity infrastructure for HashKey Chain.

Nebula Trust Gateway is a trust layer for DeFi protocols that verifies whether a wallet should be allowed,
reviewed, or denied without exposing raw identity data.

## What this app contains

- `Next.js` app router frontend
- `Wagmi` + `RainbowKit` wallet connection
- `HashKey Chain Testnet` config
- `Trust verification` API routes
- `Browser-based` proof simulation console
- `Tailwind` and shadcn/ui styling

## Product flow

1. User connects a wallet.
2. User selects a protocol preset.
3. Browser generates a trust payload.
4. API returns `allow`, `review`, or `deny`.
5. The protocol consumes the decision.

## Key inputs

- RPC: `https://testnet.hsk.xyz`
- Explorer: `https://testnet-explorer.hsk.xyz`
- Default proof library: `Semaphore`
- Deployment target: `Vercel`

## Development

```bash
pnpm install
pnpm dev
```

## Notes

The starter auth and Prisma pieces remain available in the repo, but the Nebula Trust Gateway starts from the new
trust console on the home page.
