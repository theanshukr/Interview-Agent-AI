const COHORT = 'ai-eng-v1';

function normalizeMission(mission) {
  const day = Number(mission?.day) || 0;
  const title = String(mission?.title || '').trim();
  const passed = !!mission?.passed;
  const skipped = !!mission?.skipped;
  const attempts = Number(mission?.attempts) || 0;

  return {
    day,
    title,
    passed: skipped ? false : passed,
    skipped,
    attempts,
  };
}

function normalizeSignals(signals = {}, completedCount, firstTryCount) {
  const commitDays = Number(signals?.commitDays) || 0;
  const missionsCompleted = Number(signals?.missionsCompleted) || completedCount;
  const missionsFirstTry = Number(signals?.missionsFirstTry) || firstTryCount;

  return {
    commitDays,
    missionsCompleted,
    missionsFirstTry,
  };
}

export function normalizeCandidateData(raw) {
  const source = Array.isArray(raw) ? raw[0] : raw;
  const member = source?.member || source || {};
  const missions = (source?.missions || member?.missions || [])
    .map(normalizeMission)
    .filter((mission) => mission.title || mission.day);

  const completed = missions.filter((mission) => !mission.skipped && mission.passed).length;
  const weakTopics = [...new Set(
    missions.filter((mission) => !mission.skipped && (mission.attempts >= 4 || mission.passed === false)).map((mission) => mission.title)
  )].filter(Boolean);
  const strengths = [...new Set(
    missions.filter((mission) => !mission.skipped && mission.passed && mission.attempts <= 1).map((mission) => mission.title)
  )].filter(Boolean);
  const firstTryCount = missions.filter((mission) => !mission.skipped && mission.attempts <= 1).length;
  const firstTryRate = completed > 0 ? firstTryCount / completed : 0.5;
  const readinessScore = Math.round(Math.min(100, Math.max(0, (completed / 31) * 60 + firstTryRate * 40)));

  return {
    candidateId: String(member?.candidateId || member?.id || source?.candidateId || '').trim(),
    name: String(member?.name || source?.name || '').trim(),
    jobRole: String(member?.jobRole || source?.jobRole || '').trim(),
    currentPosition: String(member?.currentPosition || member?.jobRole || source?.currentPosition || source?.jobRole || '').trim(),
    yearsExperience: Number(member?.yearsExperience ?? source?.yearsExperience ?? 0) || 0,
    education: String(member?.education || source?.education || '').trim(),
    status: String(member?.status || source?.status || 'COMPLETED').trim(),
    cohort: String(member?.cohort || source?.cohort || COHORT).trim(),
    readinessScore,
    weakTopics,
    strengths,
    missions,
    signals: normalizeSignals(source?.signals || member?.signals || {}, completed, firstTryCount),
  };
}

export function normalizeCandidateList(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(normalizeCandidateData)
    .filter((candidate) => candidate.candidateId && candidate.name);
}
