import { writeFile } from "node:fs/promises";
import { buildFamilyIndex, loadFamilyData, paths } from "./family-data.mjs";

const familyData = await loadFamilyData();
const family = buildFamilyIndex(familyData);
const requestedFocusPersonIds = process.argv.slice(2);
const focusPersonIds =
  requestedFocusPersonIds.length > 0 ? requestedFocusPersonIds : familyData.focusPersonIds;

for (const focusPersonId of focusPersonIds) {
  if (!familyData.focusPersonIds.includes(focusPersonId)) {
    throw new Error(
      `${focusPersonId} is not a supported Focus Person. Use one of: ${familyData.focusPersonIds.join(", ")}`,
    );
  }
}

const relationshipExplanations = {
  generatedFrom: "data/family.json",
  focusPeople: focusPersonIds.map((focusPersonId) => buildFocusView(focusPersonId)),
};

await writeFile(
  paths.relationshipExplanations,
  `${JSON.stringify(relationshipExplanations, null, 2)}\n`,
  "utf8",
);

function buildFocusView(focusPersonId) {
  const focusPerson = family.person(focusPersonId);
  const parents = family.parentsOf(focusPersonId);
  const siblings = findSiblings(focusPersonId);
  const cousinFamilies = findCousinFamilies(focusPersonId);

  return {
    focusPersonId,
    focusPersonName: focusPerson.displayName,
    immediateFamily: [
      ...parents.map((parentId) =>
        explanation(parentId, "parent", `${name(parentId)} is one of ${name(focusPersonId)}'s parents.`),
      ),
      ...siblings.map((siblingId) =>
        explanation(
          siblingId,
          "sibling",
          `${name(siblingId)} is ${name(focusPersonId)}'s sibling because they share a parent.`,
        ),
      ),
    ],
    cousinFamilies,
  };
}

function findSiblings(personId) {
  const siblingIds = new Set();

  for (const parentId of family.parentsOf(personId)) {
    for (const childId of family.childrenOf(parentId)) {
      if (childId !== personId) {
        siblingIds.add(childId);
      }
    }
  }

  return sortPersonIds(siblingIds);
}

function findCousinFamilies(focusPersonId) {
  const cousinFamiliesByCousinParentId = new Map();

  for (const focusParentId of family.parentsOf(focusPersonId)) {
    for (const cousinParentId of findSiblings(focusParentId)) {
      const cousinIds = family
        .childrenOf(cousinParentId)
        .filter((childId) => childId !== focusPersonId && !family.areSiblings(childId, focusPersonId));

      if (cousinIds.length === 0) {
        continue;
      }

      const partnerIds = family.partnersOf(cousinParentId);
      const cousinParentIds = sortPersonIds(new Set([cousinParentId, ...partnerIds]));
      const existing = cousinFamiliesByCousinParentId.get(cousinParentId);
      const cousinFamily = existing ?? {
        throughFocusParentId: focusParentId,
        throughFocusParentName: name(focusParentId),
        cousinParentId,
        cousinParentName: name(cousinParentId),
        people: [],
      };

      cousinFamily.people = [
        explanation(
          cousinParentId,
          "cousinParent",
          `${name(cousinParentId)} is ${name(focusPersonId)}'s parent's sibling: ${name(cousinParentId)} and ${name(focusParentId)} are siblings.`,
        ),
        ...cousinParentIds
          .filter((personId) => personId !== cousinParentId)
          .map((personId) =>
            explanation(
              personId,
              "cousinParentPartner",
              `${name(personId)} is ${name(cousinParentId)}'s partner and ${listNames(cousinIds)}'s parent.`,
            ),
          ),
        ...cousinIds.map((personId) =>
          explanation(
            personId,
            "cousin",
            `${name(personId)} is ${name(focusPersonId)}'s cousin because ${name(personId)}'s parent ${name(cousinParentId)} is the sibling of ${name(focusPersonId)}'s parent ${name(focusParentId)}.`,
          ),
        ),
      ];

      cousinFamiliesByCousinParentId.set(cousinParentId, cousinFamily);
    }
  }

  return [...cousinFamiliesByCousinParentId.values()].sort((left, right) =>
    left.cousinParentName.localeCompare(right.cousinParentName),
  );
}

function explanation(personId, relationship, text) {
  return {
    personId,
    personName: name(personId),
    relationship,
    explanation: text,
  };
}

function name(personId) {
  return family.person(personId).displayName;
}

function listNames(personIds) {
  const names = personIds.map(name);

  if (names.length <= 1) {
    return names[0] ?? "";
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function sortPersonIds(personIds) {
  return [...personIds].sort((leftId, rightId) => name(leftId).localeCompare(name(rightId)));
}
