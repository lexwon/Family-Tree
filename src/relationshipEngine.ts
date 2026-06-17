export type Person = {
  id: string;
  displayName: string;
  birthYear?: number;
};

export type ParentChildFact = {
  parentId: string;
  childId: string;
};

export type PartnershipFact = {
  person1Id: string;
  person2Id: string;
};

export type FamilyData = {
  schemaVersion: 1;
  focusPersonIds: string[];
  people: Person[];
  relationshipFacts: {
    parentChild: ParentChildFact[];
    partnerships: PartnershipFact[];
  };
};

export type RelationshipKind = "parent" | "sibling" | "cousinParent" | "cousinParentPartner" | "cousin";

export type RelationshipExplanation = {
  personId: string;
  personName: string;
  relationship: RelationshipKind;
  explanation: string;
};

export type CousinFamily = {
  throughFocusParentId: string;
  throughFocusParentName: string;
  cousinParentId: string;
  cousinParentName: string;
  people: RelationshipExplanation[];
};

export type FocusView = {
  focusPersonId: string;
  focusPersonName: string;
  immediateFamily: RelationshipExplanation[];
  cousinFamilies: CousinFamily[];
};

export type FamilyIndex = {
  peopleById: Map<string, Person>;
  parentIdsByChildId: Map<string, Set<string>>;
  childIdsByParentId: Map<string, Set<string>>;
  partnerIdsByPersonId: Map<string, Set<string>>;
  person: (personId: string) => Person;
  parentsOf: (personId: string) => string[];
  childrenOf: (personId: string) => string[];
  partnersOf: (personId: string) => string[];
  areSiblings: (person1Id: string, person2Id: string) => boolean;
};

export function buildFamilyIndex(familyData: FamilyData): FamilyIndex {
  const peopleById = new Map(familyData.people.map((person) => [person.id, person]));
  const parentIdsByChildId = new Map<string, Set<string>>();
  const childIdsByParentId = new Map<string, Set<string>>();
  const partnerIdsByPersonId = new Map<string, Set<string>>();

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
    person: (personId) => {
      const person = peopleById.get(personId);
      if (!person) {
        throw new Error(`Unknown person id: ${personId}`);
      }

      return person;
    },
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

export function buildFocusView(familyData: FamilyData, family: FamilyIndex, focusPersonId: string): FocusView {
  if (!familyData.focusPersonIds.includes(focusPersonId)) {
    throw new Error(
      `${focusPersonId} is not a supported Focus Person. Use one of: ${familyData.focusPersonIds.join(", ")}`,
    );
  }

  const parents = family.parentsOf(focusPersonId);
  const siblings = findSiblings(family, focusPersonId);

  return {
    focusPersonId,
    focusPersonName: name(family, focusPersonId),
    immediateFamily: [
      ...parents.map((parentId) =>
        explanation(
          family,
          parentId,
          "parent",
          `${name(family, parentId)} is one of ${name(family, focusPersonId)}'s parents.`,
        ),
      ),
      ...siblings.map((siblingId) =>
        explanation(
          family,
          siblingId,
          "sibling",
          `${name(family, siblingId)} is ${name(family, focusPersonId)}'s sibling because they share a parent.`,
        ),
      ),
    ],
    cousinFamilies: findCousinFamilies(family, focusPersonId),
  };
}

export function getPersonAge(person: Person, now = new Date()): string | null {
  if (!person.birthYear) {
    return null;
  }

  const age = now.getFullYear() - person.birthYear;
  return `${age} years old`;
}

function listNames(family: FamilyIndex, personIds: string[]): string {
  const names = personIds.map((personId) => name(family, personId));

  if (names.length <= 1) {
    return names[0] ?? "";
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function findSiblings(family: FamilyIndex, personId: string): string[] {
  const siblingIds = new Set<string>();

  for (const parentId of family.parentsOf(personId)) {
    for (const childId of family.childrenOf(parentId)) {
      if (childId !== personId) {
        siblingIds.add(childId);
      }
    }
  }

  return uniqueSortedIds(siblingIds, family);
}

function findCousinFamilies(family: FamilyIndex, focusPersonId: string): CousinFamily[] {
  const cousinFamiliesByCousinParentId = new Map<string, CousinFamily>();

  for (const focusParentId of family.parentsOf(focusPersonId)) {
    for (const cousinParentId of findSiblings(family, focusParentId)) {
      const cousinIds = family
        .childrenOf(cousinParentId)
        .filter((childId) => childId !== focusPersonId && !family.areSiblings(childId, focusPersonId));

      if (cousinIds.length === 0) {
        continue;
      }

      const partnerIds = family.partnersOf(cousinParentId);
      const cousinParentIds = uniqueSortedIds(new Set([cousinParentId, ...partnerIds]), family);
      const cousinFamily: CousinFamily = {
        throughFocusParentId: focusParentId,
        throughFocusParentName: name(family, focusParentId),
        cousinParentId,
        cousinParentName: name(family, cousinParentId),
        people: [],
      };

      cousinFamily.people = [
        explanation(
          family,
          cousinParentId,
          "cousinParent",
          `${name(family, cousinParentId)} is ${name(family, focusPersonId)}'s parent's sibling: ${name(family, cousinParentId)} and ${name(family, focusParentId)} are siblings.`,
        ),
        ...cousinParentIds
          .filter((personId) => personId !== cousinParentId)
          .map((personId) =>
            explanation(
              family,
              personId,
              "cousinParentPartner",
              `${name(family, personId)} is ${name(family, cousinParentId)}'s partner and ${listNames(family, cousinIds)}'s parent.`,
            ),
          ),
        ...cousinIds.map((personId) =>
          explanation(
            family,
            personId,
            "cousin",
            `${name(family, personId)} is ${name(family, focusPersonId)}'s cousin because ${name(family, personId)}'s parent ${name(family, cousinParentId)} is the sibling of ${name(family, focusPersonId)}'s parent ${name(family, focusParentId)}.`,
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

function explanation(
  family: FamilyIndex,
  personId: string,
  relationship: RelationshipKind,
  text: string,
): RelationshipExplanation {
  return {
    personId,
    personName: name(family, personId),
    relationship,
    explanation: text,
  };
}

function name(family: FamilyIndex, personId: string): string {
  return family.person(personId).displayName;
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string): void {
  if (!map.has(key)) {
    map.set(key, new Set());
  }

  map.get(key)?.add(value);
}

function uniqueSortedIds(ids: Iterable<string>, family: FamilyIndex): string[] {
  return [...new Set(ids)].sort((leftId, rightId) =>
    family.person(leftId).displayName.localeCompare(family.person(rightId).displayName),
  );
}

function sortedIds(ids: Set<string> | undefined, peopleById: Map<string, Person>): string[] {
  return [...(ids ?? [])].sort((leftId, rightId) => {
    const leftPerson = peopleById.get(leftId);
    const rightPerson = peopleById.get(rightId);

    if (!leftPerson || !rightPerson) {
      return leftId.localeCompare(rightId);
    }

    return leftPerson.displayName.localeCompare(rightPerson.displayName);
  });
}
