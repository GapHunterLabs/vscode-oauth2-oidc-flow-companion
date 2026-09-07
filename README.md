# OAuth2/OIDC Flow Companion (VS Code)

Builds and decodes OAuth2 authorization-code + PKCE flows — generates
`code_verifier`/`code_challenge`, assembles the authorization URL,
decodes an ID token. No data leaves your editor.

**v0.1, new niche.** Not a port from the Gap Hunter Labs IntelliJ-
family catalog. Evidence, same pattern as Webhook Signature
Companion: multiple standalone web testers (`AuthAction OAuth Flow
Tester`, `AuthTester`, `oidc-tester`, `OAuth 2.0 Playground`) solve
this exact problem, none inside VS Code — even though the
authorization-code + PKCE flow is something any backend/frontend dev
debugs regularly.

## What it does

**Command: `OAuth2/OIDC Flow Companion: Open`** — opens a panel with
two tools:

1. **Build an authorization URL** — generate a real RFC 7636
   `code_verifier` (43 random URL-safe characters) and its S256
   `code_challenge`, then assemble a full authorization URL from your
   endpoint/client_id/redirect_uri/scope/state.
2. **Decode an ID token** — paste a JWT ID token, see its header and
   payload claims.

Uses Node's built-in `node:crypto` for both the random verifier and
the SHA-256 challenge — no third-party crypto/OAuth library. The
`computeCodeChallengeS256` implementation is verified against RFC
7636's own Appendix B test vector, not just internal consistency.

**v0.1 scope, honestly noted:** this tool builds the authorization
request and decodes a token you already have — it doesn't perform the
actual browser redirect/callback or exchange a code for a token
(that needs a real client secret and a network call, out of scope for
a zero-network local tool).

## Privacy

See [PRIVACY.md](PRIVACY.md) — zero network calls. Everything you
type or generate stays in-memory in the panel and is never written to
disk or sent anywhere.

## Development

```bash
npm install
npm run compile   # or: npm run watch
npm test
```

To build an installable package without publishing:

```bash
npx @vscode/vsce package
```

## License

Apache License 2.0 — see [LICENSE](LICENSE).
