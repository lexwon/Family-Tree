import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import {
  getPersonAge,
  type FamilyData,
  type FocusView,
  type Person,
  buildFamilyIndex,
} from "../relationshipEngine";
import { FamilyTreeNode, type FamilyTreeNodeData } from "./FamilyTreeNode";
import { formatRelationship } from "./RelationshipSection";

const treeNodeTypes = { person: FamilyTreeNode };

type ReactFlowTreePanelProps = {
  focusView: FocusView;
  highlightedPersonIds: Set<string>;
  focusPersonId: string;
  familyData: FamilyData;
  family: ReturnType<typeof buildFamilyIndex>;
};

export function ReactFlowTreePanel({
  focusView,
  highlightedPersonIds,
  focusPersonId,
  familyData,
  family,
}: ReactFlowTreePanelProps) {
  const { nodes, edges } = useMemo(
    () => buildReactFlowTree(focusView, highlightedPersonIds, focusPersonId, familyData, family),
    [focusView, highlightedPersonIds, focusPersonId, familyData, family],
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

function buildReactFlowTree(
  focusView: FocusView,
  highlightedPersonIds: Set<string>,
  focusPersonId: string,
  familyData: FamilyData,
  family: ReturnType<typeof buildFamilyIndex>,
): { nodes: Node<FamilyTreeNodeData>[]; edges: Edge[] } {
  const generationByPersonId = getGenerationByPersonId(familyData, family);
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

function getGenerationByPersonId(familyData: FamilyData, family: ReturnType<typeof buildFamilyIndex>): Map<string, number> {
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