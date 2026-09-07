import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeIdToken, JwtDecodeError } from '../jwtDecode';

function makeToken(header: object, payload: object): string {
  const enc = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${enc(header)}.${enc(payload)}.sig`;
}

test('decodeIdToken decodes header and payload', () => {
  const token = makeToken({ alg: 'RS256' }, { sub: 'user-123', email: 'a@example.com' });
  const result = decodeIdToken(token);
  assert.equal(result.header.alg, 'RS256');
  assert.equal(result.payload.sub, 'user-123');
  assert.equal(result.payload.email, 'a@example.com');
});

test('decodeIdToken throws on the wrong number of parts', () => {
  assert.throws(() => decodeIdToken('only.two'), JwtDecodeError);
});

test('decodeIdToken throws on invalid JSON in a segment', () => {
  const notJson = Buffer.from('not json').toString('base64url');
  assert.throws(() => decodeIdToken(`${notJson}.${notJson}.sig`), JwtDecodeError);
});
