import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export const paths = {
  repoRoot,
  familyData: path.join(repoRoot, "data", "family.json"),
  mermaid: path.join(repoRoot, "data", "tree.mmd"),
  relationshipExplanations: path.join(repoRoot, "data", "relationship-explanations.json"),
};

export async function loadFamilyData(filePath = paths.familyData) {
  const familyData = JSON.parse(await readFile(filePath, "utf8"));
  validateFamilyData(familyData);
  return familyData;
}

export function validateFamilyData(data) {
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

export function buildFamilyIndex(familyData) {
  const peopleById = new Map(familyData.people.map((person) => [person.id, person]));
  const parentIdsByChildId = new Map();
  const childIdsByParentId = new Map();
  const partnerIdsByPersonId = new Map();

  for (const { parentId, childId } of familyData.relationshipFacts.parentChild) {
    addToSetMap(parentIdsByChildId, childId, parentId);
    addToSetMap(childIdsByParentId, parentId, childId);
  }

  for (const { person1Id, person2Id } of familyData.relationshipFacts.partnerships) {
    addToSetMap(partnerIdsByPersonId, person1Id, person2Id);
    addToSetMap(partnerIdsByPersonId, person2Id, person1Id);
  }

  return {
    peopleById,
    parentIdsByChildId,
    childIdsByParentId,
    partnerIdsByPersonId,
    person: (personId) => peopleById.get(personId),
    parentsOf: (personId) => sortedIds(parentIdsByChildId.get(personId), peopleById),
    childrenOf: (personId) => sortedIds(childIdsByParentId.get(personId), peopleById),
    partnersOf: (personId) => sortedIds(partnerIdsByPersonId.get(personId), peopleById),
    areSiblings: (person1Id, person2Id) => {
      if (person1Id === person2Id) {
        return false;
      }

      const person1Parents = parentIdsByChildId.get(person1Id) ?? new Set();
      const person2Parents = parentIdsByChildId.get(person2Id) ?? new Set();
      return [...person1Parents].some((parentId) => person2Parents.has(parentId));
    },
  };
}

function assertPersonExists(personIds, personId, fieldName) {
  if (!personIds.has(personId)) {
    throw new Error(`${fieldName} references unknown person id: ${personId}`);
  }
}

function addToSetMap(map, key, value) {
  if (!map.has(key)) {
    map.set(key, new Set());
  }

  map.get(key).add(value);
}

function sortedIds(ids, peopleById) {
  return [...(ids ?? [])].sort((leftId, rightId) =>
    peopleById.get(leftId).displayName.localeCompare(peopleById.get(rightId).displayName),
  );
}
