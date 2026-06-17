import { Handle, Position, type NodeProps } from "reactflow";
import { type Person } from "../relationshipEngine";

export type FamilyTreeNodeData = {
  person: Person;
  age: string | null;
  isFocus: boolean;
  isHighlighted: boolean;
  relationshipLabel: string;
};

export function FamilyTreeNode({ data }: NodeProps<FamilyTreeNodeData>) {
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