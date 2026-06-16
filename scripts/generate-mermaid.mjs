import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const familyDataPath = path.join(repoRoot, "data", "family.json");
const mermaidPath = path.join(repoRoot, "data", "tree.mmd");

const familyData = JSON.parse(await readFile(familyDataPath, "utf8"));

validateFamilyData(familyData);

const lines = [
  "%% This file is generated from data/family.json.",
  "%% Regenerate it with: node scripts/generate-mermaid.mjs",
  "flowchart TD",
  "",
  "    subgraph people[\"People\"]",
  ...familyData.people.map((person) => `        ${person.id}["${formatPersonLabel(person)}"]`),
  "    end",
  "",
  ...familyData.relationshipFacts.partnerships.map(
    (fact) => `    ${fact.person1Id} ---|"partnership"| ${fact.person2Id}`,
  ),
  ...familyData.relationshipFacts.parentChild.map(
    (fact) => `    ${fact.parentId} -->|"parent-child"| ${fact.childId}`,
  ),
  "",
];

const mermaid = `${lines.join("\n")}\n`;
await writeFile(mermaidPath, mermaid, "utf8");

function validateFamilyData(data) {
  if (data.schemaVersion !== 1) {
    throw new Error(`Unsupported schemaVersion: ${data.schemaVersion}`);
  }

  const requiredArrays = [
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

  const personIds = new Set();
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

function assertPersonExists(personIds, personId, fieldName) {
  if (!personIds.has(personId)) {
    throw new Error(`${fieldName} references unknown person id: ${personId}`);
  }
}

function formatPersonLabel(person) {
  const labelParts = [person.displayName];

  if (person.birthYear) {
    labelParts.push(`Born ${person.birthYear}`);
  }

  return labelParts.map(escapeMermaidLabel).join("<br/>");
}

function escapeMermaidLabel(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
