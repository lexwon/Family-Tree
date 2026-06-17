import { useEffect, useMemo } from "react";
import styled from "styled-components";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "reactflow";
import {
  getPersonAge,
  type FamilyData,
  type FocusView,
  buildFamilyIndex,
} from "../relationshipEngine";
import { FamilyTreeNode, type FamilyTreeNodeData } from "./FamilyTreeNode";
import { formatRelationship } from "./RelationshipSection";

const treeNodeTypes = { person: FamilyTreeNode };
const NODE_WIDTH = 190;
const PARTNER_GAP = 34;
const UNIT_GAP = 86;
const ROW_GAP = 210;

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
  const tree = useMemo(
    () => buildReactFlowTree(focusView, highlightedPersonIds, focusPersonId, familyData, family),
    [focusView, highlightedPersonIds, focusPersonId, familyData, family],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(tree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(tree.edges);

  useEffect(() => {
    setNodes(tree.nodes);
    setEdges(tree.edges);
  }, [tree, setNodes, setEdges]);

  return (
    <Panel aria-labelledby="react-flow-tree-title">
      <Header>
        <div>
          <Eyebrow>Interactive</Eyebrow>
          <Title id="react-flow-tree-title">Family Tree</Title>
        </div>

        <div className="flow-legend" aria-label="Relationship line legend">
          <span className="legend-item legend-parent">Parent</span>
          <span className="legend-item legend-partner">Partner</span>
        </div>
      </Header>

      <div className="react-flow-shell">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={treeNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          minZoom={0.35}
          maxZoom={1.6}
          nodesDraggable={true}
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
    </Panel>
  );
}

function buildReactFlowTree(
  focusView: FocusView,
  highlightedPersonIds: Set<string>,
  focusPersonId: string,
  familyData: FamilyData,
  family: ReturnType<typeof buildFamilyIndex>,
): { nodes: Node<FamilyTreeNodeData>[]; edges: Edge[] } {
  const generationByPersonId = getGenerationByPersonId(familyData);
  const layoutUnits = buildLayoutUnits(familyData, generationByPersonId);
  const positionedUnits = positionLayoutUnits(layoutUnits);

  const nodes: Node<FamilyTreeNodeData>[] = positionedUnits.flatMap((unit) => {
    const unitLeft = unit.centerX - unit.width / 2;

    return unit.personIds.map((personId, index) => {
      const person = family.person(personId);

      return {
        id: person.id,
        type: "person",
        position: {
          x: unitLeft + index * (NODE_WIDTH + PARTNER_GAP),
          y: unit.generation * ROW_GAP,
        },
        data: {
          person,
          age: getPersonAge(person),
          isFocus: person.id === focusPersonId,
          isHighlighted: highlightedPersonIds.has(person.id),
          relationshipLabel: getRelationshipLabel(focusView, person.id),
        },
      };
    });
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

  return {
    nodes,
    edges: [...partnershipEdges, ...parentChildEdges],
  };
}

type LayoutUnit = {
  id: string;
  personIds: string[];
  generation: number;
  width: number;
  centerX: number;
  parentUnitIds: Set<string>;
  childUnitIds: Set<string>;
};

function buildLayoutUnits(
  familyData: FamilyData,
  generationByPersonId: Map<string, number>,
): LayoutUnit[] {
  const unitsById = new Map<string, LayoutUnit>();
  const unitIdByPersonId = new Map<string, string>();

  for (const { person1Id, person2Id } of familyData.relationshipFacts.partnerships) {
    const personIds = [person1Id, person2Id];
    const unit = createLayoutUnit(personIds, generationByPersonId);

    unitsById.set(unit.id, unit);
    unitIdByPersonId.set(person1Id, unit.id);
    unitIdByPersonId.set(person2Id, unit.id);
  }

  for (const person of familyData.people) {
    if (unitIdByPersonId.has(person.id)) {
      continue;
    }

    const unit = createLayoutUnit([person.id], generationByPersonId);
    unitsById.set(unit.id, unit);
    unitIdByPersonId.set(person.id, unit.id);
  }

  for (const { parentId, childId } of familyData.relationshipFacts.parentChild) {
    const parentUnitId = unitIdByPersonId.get(parentId);
    const childUnitId = unitIdByPersonId.get(childId);

    if (!parentUnitId || !childUnitId || parentUnitId === childUnitId) {
      continue;
    }

    const parentUnit = unitsById.get(parentUnitId);
    const childUnit = unitsById.get(childUnitId);

    parentUnit?.childUnitIds.add(childUnitId);
    childUnit?.parentUnitIds.add(parentUnitId);
  }

  return [...unitsById.values()].sort((left, right) => {
    if (left.generation !== right.generation) {
      return left.generation - right.generation;
    }

    return left.id.localeCompare(right.id);
  });
}

function createLayoutUnit(personIds: string[], generationByPersonId: Map<string, number>): LayoutUnit {
  const generation = Math.max(...personIds.map((personId) => generationByPersonId.get(personId) ?? 0));

  return {
    id: personIds.join("+"),
    personIds,
    generation,
    width: personIds.length * NODE_WIDTH + Math.max(0, personIds.length - 1) * PARTNER_GAP,
    centerX: 0,
    parentUnitIds: new Set(),
    childUnitIds: new Set(),
  };
}

function positionLayoutUnits(layoutUnits: LayoutUnit[]): LayoutUnit[] {
  const unitsById = new Map(layoutUnits.map((unit) => [unit.id, unit]));
  const generations = [...new Set(layoutUnits.map((unit) => unit.generation))].sort((left, right) => left - right);

  for (const generation of generations) {
    const units = layoutUnits.filter((unit) => unit.generation === generation);
    placeUnits(units, units.map((_, index) => index * (NODE_WIDTH + PARTNER_GAP + UNIT_GAP)));
  }

  for (const generation of generations.slice().reverse()) {
    const units = layoutUnits.filter((unit) => unit.generation === generation);
    const desiredCenters = units.map((unit) => {
      const childCenters = [...unit.childUnitIds]
        .map((childUnitId) => unitsById.get(childUnitId)?.centerX)
        .filter((center): center is number => center !== undefined);

      return childCenters.length > 0 ? average(childCenters) : unit.centerX;
    });

    placeUnits(units, desiredCenters);
  }

  for (const generation of generations) {
    const units = layoutUnits.filter((unit) => unit.generation === generation);
    const desiredCenters = units.map((unit) => {
      const parentCenters = [...unit.parentUnitIds]
        .map((parentUnitId) => unitsById.get(parentUnitId)?.centerX)
        .filter((center): center is number => center !== undefined);

      return parentCenters.length > 0 ? average(parentCenters) : unit.centerX;
    });

    placeUnits(units, desiredCenters);
  }

  return layoutUnits;
}

function placeUnits(units: LayoutUnit[], desiredCenters: number[]): void {
  const desiredCenterByUnitId = new Map(units.map((unit, index) => [unit.id, desiredCenters[index] ?? unit.centerX]));
  const sortedUnits = [...units].sort((left, right) => {
    const leftDesiredCenter = desiredCenterByUnitId.get(left.id) ?? 0;
    const rightDesiredCenter = desiredCenterByUnitId.get(right.id) ?? 0;

    if (leftDesiredCenter !== rightDesiredCenter) {
      return leftDesiredCenter - rightDesiredCenter;
    }

    return left.id.localeCompare(right.id);
  });

  let nextLeft = Number.NEGATIVE_INFINITY;

  for (const unit of sortedUnits) {
    const desiredCenter = desiredCenterByUnitId.get(unit.id) ?? unit.centerX;
    const desiredLeft = desiredCenter - unit.width / 2;
    const left = Math.max(desiredLeft, nextLeft);

    unit.centerX = left + unit.width / 2;
    nextLeft = left + unit.width + UNIT_GAP;
  }

  const rowLeft = Math.min(...sortedUnits.map((unit) => unit.centerX - unit.width / 2));
  const rowRight = Math.max(...sortedUnits.map((unit) => unit.centerX + unit.width / 2));
  const offset = (rowLeft + rowRight) / 2;

  for (const unit of sortedUnits) {
    unit.centerX -= offset;
  }
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getGenerationByPersonId(familyData: FamilyData): Map<string, number> {
  const generationByPersonId = new Map<string, number>();
  const allChildIds = new Set(familyData.relationshipFacts.parentChild.map(({ childId }) => childId));
  const rootIds = familyData.people.map((person) => person.id).filter((personId) => !allChildIds.has(personId));

  for (const personId of rootIds) {
    generationByPersonId.set(personId, 0);
  }

  let changed = true;
  let passCount = 0;
  const maxPassCount = familyData.people.length * 2;

  while (changed && passCount < maxPassCount) {
    changed = false;
    passCount += 1;

    for (const { person1Id, person2Id } of familyData.relationshipFacts.partnerships) {
      const person1Generation = generationByPersonId.get(person1Id);
      const person2Generation = generationByPersonId.get(person2Id);
      const partnershipGeneration = Math.max(person1Generation ?? 0, person2Generation ?? 0);

      if (setGenerationIfHigher(generationByPersonId, person1Id, partnershipGeneration)) {
        changed = true;
      }

      if (setGenerationIfHigher(generationByPersonId, person2Id, partnershipGeneration)) {
        changed = true;
      }
    }

    for (const { parentId, childId } of familyData.relationshipFacts.parentChild) {
      const parentGeneration = generationByPersonId.get(parentId) ?? 0;

      if (setGenerationIfHigher(generationByPersonId, childId, parentGeneration + 1)) {
        changed = true;
      }
    }
  }

  for (const person of familyData.people) {
    if (!generationByPersonId.has(person.id)) {
      generationByPersonId.set(person.id, 0);
    }
  }

  return generationByPersonId;
}

function setGenerationIfHigher(
  generationByPersonId: Map<string, number>,
  personId: string,
  generation: number,
): boolean {
  const currentGeneration = generationByPersonId.get(personId);

  if (currentGeneration !== undefined && currentGeneration >= generation) {
    return false;
  }

  generationByPersonId.set(personId, generation);
  return true;
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

const Panel = styled.section`
  min-width: 0;
`;

const Header = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: 1.45rem;
  line-height: 1.15;
`;

const Eyebrow = styled.p`
  margin-bottom: 6px;
  color: #6a4b13;
  font-size: 0.77rem;
  font-weight: 800;
  text-transform: uppercase;
`;
