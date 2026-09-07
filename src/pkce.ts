/**
 * Pure logic -- no `vscode` dependency. New niche (not a port from
 * the Kotlin catalog). Evidence: same pattern as Webhook Signature
 * Companion -- multiple standalone web testers (AuthAction OAuth Flow
 * Tester, AuthTester, oidc-tester, OAuth 2.0 Playground) solve this
 * exact problem, none of them inside VS Code, even though the
 * authorization-code + PKCE flow (RFC 7636) is something any backend/
 * frontend dev debugs regularly. Uses Node's built-in `node:crypto` --
 * no third-party crypto/OAuth library.
 */

import { randomBytes, createHash } from 'node:crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** RFC 7636 code_verifier: a cryptographically random string using
 * only the unreserved URL character set [A-Za-z0-9-._~], 43-128
 * characters. base64url-encoding 32 random bytes yields a 43-character
 * string in exactly that character set. */
export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

/** RFC 7636 S256 code_challenge: base64url(SHA-256(code_verifier)),
 * no padding. */
export function computeCodeChallengeS256(codeVerifier: string): string {
  return base64UrlEncode(createHash('sha256').update(codeVerifier, 'ascii').digest());
}

export interface AuthorizationUrlParams {
  authorizeEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
}

export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const url = new URL(params.authorizeEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  if (params.scope) url.searchParams.set('scope', params.scope);
  if (params.state) url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}
