// Curriculum data loader using hackethon document/curriculum.json as the source of truth
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const curriculumPath = join(__dirname, "..", "hackethon document", "curriculum.json");

let curriculumData = null;

export function loadCurriculum() {
  if (curriculumData) return curriculumData;
  try {
    const raw = readFileSync(curriculumPath, "utf-8");
    curriculumData = JSON.parse(raw);
    return curriculumData;
  } catch (err) {
    console.error("Failed to load curriculum.json:", err);
    return { days: [], modules: [] };
  }
}

const DEFAULT_DAYS = [1, 3, 7, 10, 12, 16, 23, 28];

export function getDayData(dayNumber) {
  const data = loadCurriculum();
  return data.days.find((d) => d.day === Number(dayNumber)) || null;
}

export function getAdaptiveQuestion(candidate, questionIndex, difficulty = 5) {
  const missions = candidate?.missions || [];
  const targetMission = missions[questionIndex % missions.length] || null;

  if (targetMission && targetMission.day) {
    const dayData = getDayData(targetMission.day);
    const title = dayData?.title || targetMission.title || "AI Engineering Core";
    const tools = dayData?.tools?.slice(0, 3)?.join(", ") || "course tooling";
    const objective = dayData?.objectives?.[0] || "core objectives";

    return {
      day: targetMission.day,
      topic: title,
      question: `Looking at Day ${targetMission.day} (${title}): Walk me through how you implemented this module using ${tools}, how you addressed "${objective}", and the key trade-offs you evaluated.`,
    };
  }

  const fallbackDayNum = DEFAULT_DAYS[questionIndex % DEFAULT_DAYS.length];
  const dayData = getDayData(fallbackDayNum);

  if (dayData) {
    const tools = dayData.tools?.slice(0, 3)?.join(", ") || "core frameworks";
    return {
      day: dayData.day,
      topic: dayData.title,
      question: `Focusing on Day ${dayData.day} (${dayData.title}): Explain your practical approach when working with ${tools}, highlighting architecture decisions and trade-offs.`,
    };
  }

  return {
    day: 1,
    topic: "VS Code & Python Environment Setup",
    question: "How do you structure and activate an isolated Python virtual environment (.venv) in VS Code, and why is environment isolation critical when delivering production AI projects?",
  };
}
