import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCandidateData, normalizeCandidateList } from './candidateData.js';

test('normalizes imported candidate data into the shape used by the UI', () => {
  const result = normalizeCandidateData({
    member: {
      candidateId: 'CAND-100',
      name: 'Mina Chen',
      jobRole: 'ML Engineer',
      yearsExperience: 6,
      education: 'MS AI',
      status: 'COMPLETED',
    },
    missions: [
      { day: 1, title: 'Setup', passed: true, skipped: false, attempts: 1 },
      { day: 2, title: 'Data', passed: false, skipped: false, attempts: 4 },
    ],
    signals: { commitDays: 12, missionsCompleted: 2, missionsFirstTry: 1 },
  });

  assert.equal(result.candidateId, 'CAND-100');
  assert.equal(result.name, 'Mina Chen');
  assert.equal(result.jobRole, 'ML Engineer');
  assert.equal(result.readinessScore, 42);
  assert.deepEqual(result.weakTopics, ['Data']);
  assert.deepEqual(result.strengths, ['Setup']);
  assert.equal(result.missions.length, 2);
  assert.equal(result.signals.commitDays, 12);
});

test('normalizes candidate list keeping valid candidates', () => {
  const list = normalizeCandidateList([
    { member: { candidateId: 'CAND-901', name: 'Real Candidate', jobRole: 'ML Engineer' } },
  ]);
  assert.deepEqual(list.map((c) => c.candidateId), ['CAND-901']);
});
