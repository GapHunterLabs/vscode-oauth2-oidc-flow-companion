# Privacy Policy — OAuth2/OIDC Flow Companion

**Effective date:** 2026-09-07

OAuth2/OIDC Flow Companion is a Gap Hunter Labs extension for Visual
Studio Code. This policy is short because the extension's design
makes it short: there is nothing to disclose beyond what's below.

## What this extension collects

**Nothing.** OAuth2/OIDC Flow Companion does not collect, store,
transmit, or sell any data — no source code, no file contents, no
usage analytics, no telemetry, no crash reports, no personally
identifiable information.

## Network access

**None.** OAuth2/OIDC Flow Companion makes zero network calls during
normal operation. The `code_verifier`/`code_challenge` are generated
and the authorization URL is assembled entirely in-process; an ID
token you paste is decoded entirely in-process. Nothing is ever sent
anywhere, and no actual OAuth redirect or token exchange happens.

## Third parties

None. OAuth2/OIDC Flow Companion has no third-party SDKs, no
analytics libraries, no ad networks, no external dependencies that
phone home. The only runtime dependencies are the `vscode` extension
API and Node's own built-in `node:crypto` module.

## Changes to this policy

If this ever changes, this file will be updated and the change will
be noted in the extension's `CHANGELOG.md`.

## Contact

Questions about this policy: **gaphunterlabs@gmail.com**
