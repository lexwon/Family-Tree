import { writeFile } from "node:fs/promises";
import { loadFamilyData, paths } from "./family-data";
import { type Person } from "../src/relationshipEngine";

const familyData = await loadFamilyData();

const lines = [
  "%% This file is generated from data/family.json.",
  "%% Regenerate it with: pnpm generate:mermaid",
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
await writeFile(paths.mermaid, mermaid, "utf8");

function formatPersonLabel(person: Person): string {
  const labelParts = [person.displayName];

  if (person.birthYear) {
    labelParts.push(`Born ${person.birthYear}`);
  }

  return labelParts.map(escapeMermaidLabel).join("<br/>");
}

function escapeMermaidLabel(value: string | number): string {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
