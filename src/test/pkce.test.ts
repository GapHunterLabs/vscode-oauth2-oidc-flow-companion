import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCodeVerifier, computeCodeChallengeS256, buildAuthorizationUrl } from '../pkce';

test('generateCodeVerifier produces a URL-safe 43-character string (RFC 7636)', () => {
  const verifier = generateCodeVerifier();
  assert.equal(verifier.length, 43);
  assert.match(verifier, /^[A-Za-z0-9\-._~]+$/);
});

test('generateCodeVerifier produces a different value each call', () => {
  assert.notEqual(generateCodeVerifier(), generateCodeVerifier());
});

test('computeCodeChallengeS256 is deterministic for the same verifier', () => {
  const verifier = 'a'.repeat(43);
  assert.equal(computeCodeChallengeS256(verifier), computeCodeChallengeS256(verifier));
});

test('computeCodeChallengeS256 matches the known RFC 7636 appendix B test vector', () => {
  // RFC 7636 Appendix B's example code_verifier and its expected S256 code_challenge.
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(computeCodeChallengeS256(verifier), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('buildAuthorizationUrl assembles the required PKCE query params', () => {
  const url = buildAuthorizationUrl({
    authorizeEndpoint: 'https://accounts.example.com/oauth/authorize',
    clientId: 'my-client-id',
    redirectUri: 'http://localhost:3000/callback',
    scope: 'openid profile',
    state: 'xyz',
    codeChallenge: 'abc123',
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('response_type'), 'code');
  assert.equal(parsed.searchParams.get('client_id'), 'my-client-id');
  assert.equal(parsed.searchParams.get('redirect_uri'), 'http://localhost:3000/callback');
  assert.equal(parsed.searchParams.get('scope'), 'openid profile');
  assert.equal(parsed.searchParams.get('state'), 'xyz');
  assert.equal(parsed.searchParams.get('code_challenge'), 'abc123');
  assert.equal(parsed.searchParams.get('code_challenge_method'), 'S256');
});

test('buildAuthorizationUrl omits empty optional params', () => {
  const url = buildAuthorizationUrl({
    authorizeEndpoint: 'https://accounts.example.com/oauth/authorize',
    clientId: 'x',
    redirectUri: 'http://localhost/cb',
    scope: '',
    state: '',
    codeChallenge: 'abc',
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.has('scope'), false);
  assert.equal(parsed.searchParams.has('state'), false);
});

test('buildAuthorizationUrl throws for an invalid endpoint URL', () => {
  assert.throws(() =>
    buildAuthorizationUrl({
      authorizeEndpoint: 'not a url',
      clientId: 'x',
      redirectUri: 'http://localhost/cb',
      scope: '',
      state: '',
      codeChallenge: 'abc',
    }),
  );
});
