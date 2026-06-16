import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import familyDataJson from "../data/family.json";
import "./styles.css";
import {
  buildFamilyIndex,
  buildFocusView,
  getFamilyGroups,
  getPersonAge,
  type FamilyData,
  type FocusView,
  type Person,
  type RelationshipExplanation,
  type RelationshipKind,
} from "./relationshipEngine";

const familyData = familyDataJson as FamilyData;
const family = buildFamilyIndex(familyData);
const groups = getFamilyGroups(familyData, family);
const initialFocusPersonId = getInitialFocusPersonId(familyData);

function App() {
  const [focusPersonId, setFocusPersonId] = useState<string>(initialFocusPersonId);
  const focusView = useMemo(
    () => buildFocusView(familyData, family, focusPersonId),
    [focusPersonId],
  );
  const highlightedPersonIds = useMemo(() => getHighlightedPeople(focusView), [focusView]);

  return (
    <main className="app-shell">
      <section className="topbar" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">Family Tree</p>
          <h1 id="app-title">{focusView.focusPersonName}'s Family View</h1>
        </div>

        <label className="focus-picker">
          <span>Focus Person</span>
          <select value={focusPersonId} onChange={(event) => setFocusPersonId(event.target.value)}>
            {familyData.focusPersonIds.map((personId) => (
              <option key={personId} value={personId}>
                {family.person(personId).displayName}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="content-grid">
        <TreePanel groups={groups} highlightedPersonIds={highlightedPersonIds} focusPersonId={focusPersonId} />
        <ExplanationPanel focusView={focusView} />
      </section>
    </main>
  );
}

type TreePanelProps = {
  groups: FamilyGroupView[];
  highlightedPersonIds: Set<string>;
  focusPersonId: string;
};

function TreePanel({ groups, highlightedPersonIds, focusPersonId }: TreePanelProps) {
  return (
    <section className="tree-panel" aria-labelledby="tree-title">
      <div className="section-heading">
        <p className="eyebrow">People</p>
        <h2 id="tree-title">Family Tree</h2>
      </div>

      <div className="family-groups">
        {groups.map((group) => (
          <FamilyGroup
            key={group.id}
            group={group}
            highlightedPersonIds={highlightedPersonIds}
            focusPersonId={focusPersonId}
          />
        ))}
      </div>
    </section>
  );
}

type FamilyGroupView = ReturnType<typeof getFamilyGroups>[number];

type FamilyGroupProps = {
  group: FamilyGroupView;
  highlightedPersonIds: Set<string>;
  focusPersonId: string;
};

function FamilyGroup({ group, highlightedPersonIds, focusPersonId }: FamilyGroupProps) {
  return (
    <article className="family-group">
      <div className="partners-row">
        {group.partners.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            isFocus={person.id === focusPersonId}
            isHighlighted={highlightedPersonIds.has(person.id)}
          />
        ))}
      </div>

      {group.children.length > 0 && (
        <>
          <div className="connector" aria-hidden="true" />
          <div className="children-row">
            {group.children.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                isFocus={person.id === focusPersonId}
                isHighlighted={highlightedPersonIds.has(person.id)}
              />
            ))}
          </div>
        </>
      )}
    </article>
  );
}

type PersonCardProps = {
  person: Person;
  isFocus: boolean;
  isHighlighted: boolean;
};

function PersonCard({ person, isFocus, isHighlighted }: PersonCardProps) {
  const age = getPersonAge(person);
  const className = ["person-card", isFocus ? "is-focus" : "", isHighlighted ? "is-highlighted" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <strong>{person.displayName}</strong>
      <span>{age ? `Born ${person.birthYear} · ${age}` : "Family member"}</span>
    </div>
  );
}

type ExplanationPanelProps = {
  focusView: FocusView;
};

function ExplanationPanel({ focusView }: ExplanationPanelProps) {
  return (
    <section className="explanation-panel" aria-labelledby="explanations-title">
      <div className="section-heading">
        <p className="eyebrow">Relationships</p>
        <h2 id="explanations-title">How Everyone Connects</h2>
      </div>

      <RelationshipSection title="Immediate Family" items={focusView.immediateFamily} />

      {focusView.cousinFamilies.map((familyGroup) => (
        <RelationshipSection
          key={familyGroup.cousinParentId}
          title={`${familyGroup.cousinParentName}'s Family`}
          subtitle={`Connected through ${familyGroup.throughFocusParentName}`}
          items={familyGroup.people}
        />
      ))}
    </section>
  );
}

type RelationshipSectionProps = {
  title: string;
  subtitle?: string;
  items: RelationshipExplanation[];
};

function RelationshipSection({ title, subtitle, items }: RelationshipSectionProps) {
  return (
    <article className="relationship-section">
      <div className="relationship-section-title">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="explanation-list">
        {items.map((item) => (
          <div className="explanation-item" key={`${item.personId}-${item.relationship}`}>
            <span>{formatRelationship(item.relationship)}</span>
            <p>{item.explanation}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function getHighlightedPeople(focusView: FocusView): Set<string> {
  return new Set([
    focusView.focusPersonId,
    ...focusView.immediateFamily.map((item) => item.personId),
    ...focusView.cousinFamilies.flatMap((group) => group.people.map((item) => item.personId)),
  ]);
}

function formatRelationship(relationship: RelationshipKind): string {
  const labels: Record<RelationshipKind, string> = {
    parent: "Parent",
    sibling: "Sibling",
    cousinParent: "Parent's Sibling",
    cousinParentPartner: "Partner",
    cousin: "Cousin",
  };

  return labels[relationship];
}

function getInitialFocusPersonId(data: FamilyData): string {
  const focusPersonId = data.focusPersonIds[0];

  if (!focusPersonId) {
    throw new Error("Family Data must include at least one Focus Person");
  }

  return focusPersonId;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Could not find root element");
}

createRoot(root).render(<App />);
