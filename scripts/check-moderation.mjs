import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import dotenv from 'dotenv';
import pg from 'pg';

// Deliberately restricted to local development; never mutate the production database.
const config = dotenv.parse(fs.readFileSync('.env'));
const databaseUrl = config.DATABASE_URL;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(databaseUrl).hostname), 'Use a local test database');
const origin = 'http://127.0.0.1:4317';
const client = new pg.Client({ connectionString: databaseUrl });
const nickname = `test-${randomUUID().slice(0, 12)}`;
const createdIds = [];

async function snapshot() {
  const response = await fetch(`${origin}/api/submissions`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.notEqual(data.databaseReady, false);
  return data;
}

async function create(isPublic) {
  const response = await fetch(`${origin}/api/submissions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, wish: 'Moderation regression test', designKey: 'lotus', isPublic }),
  });
  assert.equal(response.status, 201);
  const { submission } = await response.json();
  createdIds.push(submission.id);
  return submission;
}

async function setStatus(id, status) {
  await client.query('UPDATE "Submission" SET status = $1 WHERE id = $2 AND nickname = $3', [status, id, nickname]);
}

await client.connect();
try {
  const baseline = await snapshot();
  const pending = await create(true);
  const privateWish = await create(false);
  const hidden = await create(true);
  await setStatus(privateWish.id, 'APPROVED');
  await setStatus(hidden.id, 'HIDDEN');
  const beforeApproval = await snapshot();
  assert.equal(beforeApproval.count, baseline.count, 'Pending, hidden and private wishes must not affect the count');
  for (const list of [beforeApproval.submissions, beforeApproval.riverKrathongs]) {
    assert.ok(list.every(item => !createdIds.includes(item.id)), 'Unapproved or nonpublic boats must not be returned');
  }
  assert.equal((await fetch(`${origin}/wish/${pending.shareToken}`)).status, 404);
  await setStatus(pending.id, 'APPROVED');
  const afterApproval = await snapshot();
  assert.equal(afterApproval.count, baseline.count + 1);
  assert.ok(afterApproval.riverKrathongs.some(item => item.id === pending.id));
  assert.ok(afterApproval.submissions.some(item => item.id === pending.id));
  assert.equal((await fetch(`${origin}/wish/${pending.shareToken}`)).status, 200);
  await setStatus(pending.id, 'HIDDEN');
  const afterHide = await snapshot();
  assert.equal(afterHide.count, baseline.count);
  assert.ok(afterHide.riverKrathongs.every(item => item.id !== pending.id));
  assert.equal((await fetch(`${origin}/wish/${pending.shareToken}`)).status, 404);
  console.log('PASS: pending, private and hidden excluded; approval publishes; hiding removes; count and share links enforce moderation.');
} finally {
  await client.query('DELETE FROM "Submission" WHERE id = ANY($1::text[]) AND nickname = $2', [createdIds, nickname]);
  await client.end();
}
