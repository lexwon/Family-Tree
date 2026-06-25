import { useEffect, useMemo } from "react";
import styled from "styled-components";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from "reactflow";
import {
  type FamilyData,
  type FocusView,
  buildFamilyIndex,
} from "../utils/relationshipEngine";
import { FamilyTreeNode, type FamilyTreeNodeData } from "./FamilyTreeNode";
import { buildReactFlowTree } from "../utils/treeLayout";

const treeNodeTypes = { person: FamilyTreeNode };

type ReactFlowTreePanelProps = {
  focusView: FocusView;
  highlightedPersonIds: Set<string>;
  familyData: FamilyData;
  family: ReturnType<typeof buildFamilyIndex>;
  onSelectPerson: (personId: string) => void;
};

export function ReactFlowTreePanel({
  focusView,
  highlightedPersonIds,
  familyData,
  family,
  onSelectPerson,
}: ReactFlowTreePanelProps) {
  const tree = useMemo(
    () => buildReactFlowTree(focusView, highlightedPersonIds, focusView.focusPersonId, familyData, family),
    [focusView, highlightedPersonIds, familyData, family],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(tree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(tree.edges);

  useEffect(() => {
    setNodes((prevNodes) => {
      const existingPositions = new Map(
        prevNodes.map((node) => [node.id, node.position]),
      );
      return tree.nodes.map((node) => {
        const prevPosition = existingPositions.get(node.id);
        if (prevPosition) {
          return {
            ...node,
            position: prevPosition,
          };
        }
        return node;
      });
    });
    setEdges(tree.edges);
  }, [tree, setNodes, setEdges]);

  return (
    <Panel aria-labelledby="react-flow-tree-title">
      <Header>
        <div>
          <Eyebrow>Interactive</Eyebrow>
          <Title id="react-flow-tree-title">Family Tree</Title>
        </div>        
      </Header>

      <div className="react-flow-shell">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={treeNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_event, node) => onSelectPerson(node.id)}
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
                return "#003feb";
              }

              return data.isHighlighted ? "#6b6b9e" : "#b9c7c0";
            }}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </Panel>
  );
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
