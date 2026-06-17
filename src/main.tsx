import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import familyDataJson from "../data/family.json";
import "reactflow/dist/style.css";
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
const treeNodeTypes = { person: FamilyTreeNode };

function App() {
  const [focusPersonId, setFocusPersonId] = useState<string>(initialFocusPersonId);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
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

        <div className="topbar-controls">
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

          <fieldset className="view-toggle" aria-label="Tree view mode">
            <legend>View</legend>
            <label>
              <input
                type="radio"
                name="view-mode"
                value="default"
                checked={viewMode === "default"}
                onChange={() => setViewMode("default")}
              />
              <span>Default</span>
            </label>
            <label>
              <input
                type="radio"
                name="view-mode"
                value="flow"
                checked={viewMode === "flow"}
                onChange={() => setViewMode("flow")}
              />
              <span>Tree</span>
            </label>
          </fieldset>
        </div>
      </section>

      <section className="content-grid">
        {viewMode === "default" ? (
          <TreePanel groups={groups} highlightedPersonIds={highlightedPersonIds} focusPersonId={focusPersonId} />
        ) : (
          <ReactFlowTreePanel
            focusView={focusView}
            highlightedPersonIds={highlightedPersonIds}
            focusPersonId={focusPersonId}
          />
        )}
        <ExplanationPanel focusView={focusView} />
      </section>
    </main>
  );
}

type ViewMode = "default" | "flow";

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

type ReactFlowTreePanelProps = {
  focusView: FocusView;
  highlightedPersonIds: Set<string>;
  focusPersonId: string;
};

function ReactFlowTreePanel({ focusView, highlightedPersonIds, focusPersonId }: ReactFlowTreePanelProps) {
  const { nodes, edges } = useMemo(
    () => buildReactFlowTree(focusView, highlightedPersonIds, focusPersonId),
    [focusView, highlightedPersonIds, focusPersonId],
  );

  return (
    <section className="tree-panel" aria-labelledby="react-flow-tree-title">
      <div className="section-heading flow-heading">
        <div>
          <p className="eyebrow">Interactive</p>
          <h2 id="react-flow-tree-title">Family Tree</h2>
        </div>

        <div className="flow-legend" aria-label="Relationship line legend">
          <span className="legend-item legend-parent">Parent</span>
          <span className="legend-item legend-partner">Partner</span>
          <span className="legend-item legend-derived">Focus link</span>
        </div>
      </div>

      <div className="react-flow-shell">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={treeNodeTypes}
          fitView
          minZoom={0.35}
          maxZoom={1.6}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#cfd9d2" gap={22} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as FamilyTreeNodeData;
              if (data.isFocus) {
                return "#1f6f55";
              }

              return data.isHighlighted ? "#6b9e82" : "#b9c7c0";
            }}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </section>
  );
}

type FamilyTreeNodeData = {
  person: Person;
  age: string | null;
  isFocus: boolean;
  isHighlighted: boolean;
  relationshipLabel: string;
};

function FamilyTreeNode({ data }: NodeProps<FamilyTreeNodeData>) {
  const className = ["flow-person-node", data.isFocus ? "is-focus" : "", data.isHighlighted ? "is-highlighted" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="partner-left" className="flow-handle" />
      <Handle type="source" position={Position.Right} id="partner-right" className="flow-handle" />

      <strong>{data.person.displayName}</strong>
      <span>{data.relationshipLabel}</span>
      <small>{data.age ? `Born ${data.person.birthYear} · ${data.age}` : "Family member"}</small>
    </div>
  );
}

function buildReactFlowTree(
  focusView: FocusView,
  highlightedPersonIds: Set<string>,
  focusPersonId: string,
): { nodes: Node<FamilyTreeNodeData>[]; edges: Edge[] } {
  const generationByPersonId = getGenerationByPersonId();
  const peopleByGeneration = new Map<number, Person[]>();

  for (const person of familyData.people) {
    const generation = generationByPersonId.get(person.id) ?? 0;
    if (!peopleByGeneration.has(generation)) {
      peopleByGeneration.set(generation, []);
    }

    peopleByGeneration.get(generation)?.push(person);
  }

  const nodes: Node<FamilyTreeNodeData>[] = [...peopleByGeneration.entries()].flatMap(([generation, people]) => {
    const sortedPeople = people.sort((left, right) => left.displayName.localeCompare(right.displayName));
    const rowWidth = (sortedPeople.length - 1) * 230;

    return sortedPeople.map((person, index) => ({
      id: person.id,
      type: "person",
      position: {
        x: index * 230 - rowWidth / 2,
        y: generation * 190,
      },
      data: {
        person,
        age: getPersonAge(person),
        isFocus: person.id === focusPersonId,
        isHighlighted: highlightedPersonIds.has(person.id),
        relationshipLabel: getRelationshipLabel(focusView, person.id),
      },
    }));
  });

  const parentChildEdges: Edge[] = familyData.relationshipFacts.parentChild.map(({ parentId, childId }) => ({
    id: `parent-${parentId}-${childId}`,
    source: parentId,
    target: childId,
    type: "smoothstep",
    label: "parent",
    className: "edge-parent-child",
  }));

  const partnershipEdges: Edge[] = familyData.relationshipFacts.partnerships.map(({ person1Id, person2Id }) => ({
    id: `partner-${person1Id}-${person2Id}`,
    source: person1Id,
    target: person2Id,
    sourceHandle: "partner-right",
    targetHandle: "partner-left",
    type: "straight",
    label: "partners",
    className: "edge-partnership",
  }));

  const derivedEdges: Edge[] = getDerivedFocusEdges(focusView, focusPersonId);

  return {
    nodes,
    edges: [...partnershipEdges, ...parentChildEdges, ...derivedEdges],
  };
}

function getGenerationByPersonId(): Map<string, number> {
  const generationByPersonId = new Map<string, number>();
  const allChildIds = new Set(familyData.relationshipFacts.parentChild.map(({ childId }) => childId));
  const rootIds = familyData.people.map((person) => person.id).filter((personId) => !allChildIds.has(personId));
  const queue = rootIds.map((personId) => ({ personId, generation: 0 }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const knownGeneration = generationByPersonId.get(current.personId);
    if (knownGeneration !== undefined && knownGeneration <= current.generation) {
      continue;
    }

    generationByPersonId.set(current.personId, current.generation);

    for (const childId of family.childrenOf(current.personId)) {
      queue.push({ personId: childId, generation: current.generation + 1 });
    }
  }

  return generationByPersonId;
}

function getDerivedFocusEdges(focusView: FocusView, focusPersonId: string): Edge[] {
  const relationships = [
    ...focusView.immediateFamily,
    ...focusView.cousinFamilies.flatMap((group) => group.people),
  ].filter((item) => item.personId !== focusPersonId);

  return relationships.map((item) => ({
    id: `derived-${focusPersonId}-${item.personId}-${item.relationship}`,
    source: focusPersonId,
    target: item.personId,
    type: "smoothstep",
    label: formatRelationship(item.relationship),
    className: `edge-derived edge-derived-${item.relationship}`,
    animated: item.relationship === "cousin",
  }));
}

function getRelationshipLabel(focusView: FocusView, personId: string): string {
  if (personId === focusView.focusPersonId) {
    return "Focus Person";
  }

  const immediateRelationship = focusView.immediateFamily.find((item) => item.personId === personId);
  if (immediateRelationship) {
    return formatRelationship(immediateRelationship.relationship);
  }

  const cousinRelationship = focusView.cousinFamilies
    .flatMap((group) => group.people)
    .find((item) => item.personId === personId);

  return cousinRelationship ? formatRelationship(cousinRelationship.relationship) : "Family Member";
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
