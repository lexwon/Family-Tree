import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFamilyIndex as buildEngineIndex,
  type FamilyData,
  type FamilyIndex,
} from "../src/relationshipEngine";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export const paths = {
  repoRoot,
  familyData: path.join(repoRoot, "data", "family.json"),
  mermaid: path.join(repoRoot, "data", "tree.mmd"),
  relationshipExplanations: path.join(repoRoot, "data", "relationship-explanations.json"),
};

export async function loadFamilyData(filePath = paths.familyData): Promise<FamilyData> {
  const familyData = JSON.parse(await readFile(filePath, "utf8"));
  validateFamilyData(familyData);
  return familyData as FamilyData;
}

export function validateFamilyData(data: any): void {
  if (data.schemaVersion !== 1) {
    throw new Error(`Unsupported schemaVersion: ${data.schemaVersion}`);
  }

  const requiredArrays: [string, any][] = [
    ["people", data.people],
    ["focusPersonIds", data.focusPersonIds],
    ["relationshipFacts.parentChild", data.relationshipFacts?.parentChild],
    ["relationshipFacts.partnerships", data.relationshipFacts?.partnerships],
  ];

  for (const [name, value] of requiredArrays) {
    if (!Array.isArray(value)) {
      throw new Error(`${name} must be an array`);
    }
  }

  const personIds = new Set<string>();
  for (const person of data.people) {
    if (!person.id || !person.displayName) {
      throw new Error("Each person must have id and displayName");
    }

    if (personIds.has(person.id)) {
      throw new Error(`Duplicate person id: ${person.id}`);
    }

    personIds.add(person.id);
  }

  for (const focusPersonId of data.focusPersonIds) {
    assertPersonExists(personIds, focusPersonId, "focusPersonIds");
  }

  for (const fact of data.relationshipFacts.parentChild) {
    assertPersonExists(personIds, fact.parentId, "parentChild.parentId");
    assertPersonExists(personIds, fact.childId, "parentChild.childId");
  }

  for (const fact of data.relationshipFacts.partnerships) {
    assertPersonExists(personIds, fact.person1Id, "partnerships.person1Id");
    assertPersonExists(personIds, fact.person2Id, "partnerships.person2Id");
  }
}

function assertPersonExists(personIds: Set<string>, personId: string, fieldName: string): void {
  if (!personIds.has(personId)) {
    throw new Error(`${fieldName} references unknown person id: ${personId}`);
  }
}

// Re-export buildFamilyIndex from relationshipEngine to keep scripts compatible
// while completely eliminating duplicate logic.
export function buildFamilyIndex(familyData: FamilyData): FamilyIndex {
  return buildEngineIndex(familyData);
}
