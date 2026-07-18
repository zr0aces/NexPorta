import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DocumentAuthenticator } from '../authenticator.js';

test('DocumentAuthenticator uses passed password', () => {
  const auth = new DocumentAuthenticator('my-secret');
  assert.ok(auth.verify('my-secret'));
  assert.ok(!auth.verify('wrong'));
  assert.ok(!auth.verify(''));
  assert.ok(!auth.verify(null));
});

test('DocumentAuthenticator falls back to random password if none passed', () => {
  const auth = new DocumentAuthenticator();
  assert.ok(auth.apiPassword);
  assert.equal(auth.apiPassword.length, 32); // 16 bytes hex
});
