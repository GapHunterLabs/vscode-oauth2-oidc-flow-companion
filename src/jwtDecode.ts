/**
 * Manual copy of vscode-jwt-companion's decode logic, adapted for
 * decoding an OIDC ID token specifically -- same deliberate
 * "kept in sync by hand across independent projects" trade-off
 * already used twice elsewhere in this workstream (SecretDetector.ts
 * in secret-scanner-cli / config-secrets-file-companion).
 */

export interface JwtDecodeResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export class JwtDecodeError extends Error {}

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(paddingNeeded), 'base64').toString('utf8');
}

function decodeJsonSegment(segment: string, segmentName: string): Record<string, unknown> {
  let text: string;
  try {
    text = base64UrlDecode(segment);
  } catch {
    throw new JwtDecodeError(`${segmentName} is not valid base64url.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new JwtDecodeError(`${segmentName} is not valid JSON once decoded.`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new JwtDecodeError(`${segmentName} did not decode to a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

export function decodeIdToken(token: string): JwtDecodeResult {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new JwtDecodeError(`Expected exactly 3 dot-separated parts (header.payload.signature), got ${parts.length}.`);
  }
  return { header: decodeJsonSegment(parts[0], 'Header'), payload: decodeJsonSegment(parts[1], 'Payload') };
}
