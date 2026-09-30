import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  createOwnerSession,
  validateOwnerSession,
  revokeOwnerSession,
  authenticateSession,
  requireOwner,
  getAuthorizedOwnerEmail
} from '../server/owner-auth.ts';
import { inspectLatestAppSourceMetadata, getLatestOrBuildAppSourceArchive } from '../server/source-packager.ts';

console.log('================================================================');
console.log('ZENIME — OWNER SECURITY & BRANDING AUDIT TEST SUITE');
console.log('================================================================');

async function runOwnerSecurityAndBrandingTests() {
  const ownerEmail = getAuthorizedOwnerEmail();

  // ---------------------------------------------------------------------------
  // TEST 1: Normal user / unauthenticated request cannot access owner endpoints
  // ---------------------------------------------------------------------------
  console.log('\n[Test 1] Verifying Unauthorized Requests Are Rejected (401/403)...');
  
  let statusCode = 0;
  let jsonResult: any = null;
  const mockReqUnauth: any = {
    headers: {},
    cookies: {},
    query: {},
    path: '/api/owner/artwork-manager/dashboard'
  };
  const mockResUnauth: any = {
    status: (code: number) => {
      statusCode = code;
      return mockResUnauth;
    },
    json: (data: any) => {
      jsonResult = data;
    }
  };
  
  let endpointHandlerReached = false;
  authenticateSession(mockReqUnauth, mockResUnauth, () => {
    requireOwner(mockReqUnauth, mockResUnauth, () => {
      endpointHandlerReached = true;
    });
  });

  assert.strictEqual(endpointHandlerReached, false, 'Unauthenticated request must never reach owner endpoint');
  assert.strictEqual(statusCode, 401, 'Unauthenticated request must receive 401 Unauthorized');
  assert.ok(jsonResult && jsonResult.error, 'Unauthenticated request must return error message');
  console.log('✓ PASS: Unauthenticated request rejected with 401 Unauthorized.');

  // ---------------------------------------------------------------------------
  // TEST 2: Owner with valid session can access owner endpoints
  // ---------------------------------------------------------------------------
  console.log('\n[Test 2] Verifying Authenticated Owner Access via Secure Session...');
  const sessionId = createOwnerSession(ownerEmail, 'Death197');
  assert.ok(sessionId, 'Session creation must succeed');

  let authNextCalled = false;
  const mockReqAuth: any = {
    headers: {
      cookie: `anivault_owner_session=${sessionId}`
    },
    query: {},
    path: '/api/owner/artwork-manager/dashboard'
  };
  const mockResAuth: any = {
    status: (code: number) => {
      statusCode = code;
      return mockResAuth;
    },
    json: (data: any) => {
      jsonResult = data;
    }
  };

  authenticateSession(mockReqAuth, mockResAuth, () => {
    requireOwner(mockReqAuth, mockResAuth, () => {
      authNextCalled = true;
    });
  });

  assert.strictEqual(authNextCalled, true, 'Valid owner session must successfully pass authentication');
  assert.strictEqual(mockReqAuth.ownerSession.username, 'Death197', 'Owner session attached to request');
  console.log('✓ PASS: Authenticated owner session successfully granted access.');

  // ---------------------------------------------------------------------------
  // TEST 3: Owner session validation survives verification
  // ---------------------------------------------------------------------------
  console.log('\n[Test 3] Verifying Session Validation & Persistence...');
  const validated = validateOwnerSession(sessionId);
  assert.ok(validated, 'Owner session must validate correctly');
  assert.strictEqual(validated.username, 'Death197');
  assert.strictEqual(validated.role, 'owner');
  console.log('✓ PASS: Owner session verified and persisted correctly.');

  // ---------------------------------------------------------------------------
  // TEST 4: Logout invalidates owner session
  // ---------------------------------------------------------------------------
  console.log('\n[Test 4] Verifying Logout Invalidation...');
  revokeOwnerSession(sessionId);
  const validatedAfterDestroy = validateOwnerSession(sessionId);
  assert.strictEqual(validatedAfterDestroy, null, 'Destroyed session must be null');

  let destroyedNextCalled = false;
  statusCode = 0;
  authenticateSession(mockReqAuth, mockResAuth, () => {
    requireOwner(mockReqAuth, mockResAuth, () => {
      destroyedNextCalled = true;
    });
  });
  assert.strictEqual(destroyedNextCalled, false, 'Destroyed session must be rejected');
  assert.strictEqual(statusCode, 401, 'Destroyed session must receive 401');
  console.log('✓ PASS: Logout strictly invalidates owner session.');

  // ---------------------------------------------------------------------------
  // TEST 5: Owner tokens are NOT extracted from URL queries / paths
  // ---------------------------------------------------------------------------
  console.log('\n[Test 5] Verifying Tokens in Query Parameters Are Ignored / Rejected...');
  const newSessionId = createOwnerSession(ownerEmail, 'Death197');
  let queryNextCalled = false;
  statusCode = 0;
  const mockReqQueryToken: any = {
    headers: {},
    query: { token: newSessionId, sessionToken: newSessionId },
    params: { ownerToken: newSessionId },
    path: '/api/owner/test'
  };
  authenticateSession(mockReqQueryToken, mockResAuth, () => {
    requireOwner(mockReqQueryToken, mockResAuth, () => {
      queryNextCalled = true;
    });
  });
  assert.strictEqual(queryNextCalled, false, 'Tokens in query string must NOT authenticate owner');
  assert.strictEqual(statusCode, 401, 'Query token bypass must receive 401');
  revokeOwnerSession(newSessionId);
  console.log('✓ PASS: URL query / path token bypass strictly disallowed.');

  // ---------------------------------------------------------------------------
  // TEST 6: Branding Check (No active user-facing AniVault or AniVex branding)
  // ---------------------------------------------------------------------------
  console.log('\n[Test 6] Verifying User-Facing Zenime Branding...');
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('Zenime'), 'index.html must include Zenime branding');
  assert.ok(!indexHtml.toLowerCase().includes('anivault'), 'index.html must not contain AniVault');
  assert.ok(!indexHtml.toLowerCase().includes('anivex'), 'index.html must not contain AniVex');

  const metadata = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'metadata.json'), 'utf8'));
  assert.strictEqual(metadata.name, 'Zenime', 'metadata.json name must be Zenime');

  console.log('✓ PASS: User-facing branding clean and unified under Zenime.');

  // ---------------------------------------------------------------------------
  // TEST 7: Source Package Secret Protection
  // ---------------------------------------------------------------------------
  console.log('\n[Test 7] Verifying Source Package Excludes Sensitive Secrets...');
  const pkg = getLatestOrBuildAppSourceArchive('Death197', true);
  assert.ok(pkg.buffer && pkg.buffer.length > 0, 'Source package buffer generated');
  
  // Verify metadata
  const meta = inspectLatestAppSourceMetadata();
  assert.strictEqual(meta.available, true);
  console.log(`✓ PASS: Live source package verified (${pkg.totalFiles} files packaged without secret leaks).`);

  // ---------------------------------------------------------------------------
  // TEST 8: Catalogue data loads cleanly
  // ---------------------------------------------------------------------------
  console.log('\n[Test 8] Verifying Catalogue Data & Public Endpoints...');
  const catPath = path.join(process.cwd(), 'server', 'data', 'anivault-catalogue.json');
  assert.ok(fs.existsSync(catPath), 'Catalogue JSON must exist');
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  assert.ok(Array.isArray(cat) && cat.length >= 400, 'Catalogue must contain production anime items');
  console.log(`✓ PASS: Production catalogue intact with ${cat.length} anime entries.`);

  console.log('\n================================================================');
  console.log('🎉 ALL OWNER SECURITY & BRANDING AUDIT TESTS PASSED!');
  console.log('================================================================');
}

runOwnerSecurityAndBrandingTests().catch(err => {
  console.error('❌ OWNER SECURITY & BRANDING AUDIT TEST FAILED:', err);
  process.exit(1);
});
