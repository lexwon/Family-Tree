import { type RelationshipExplanation, type RelationshipKind } from "../relationshipEngine";

type RelationshipSectionProps = {
  title: string;
  subtitle?: string;
  items: RelationshipExplanation[];
};

export function RelationshipSection({ title, subtitle, items }: RelationshipSectionProps) {
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

export function formatRelationship(relationship: RelationshipKind): string {
  const labels: Record<RelationshipKind, string> = {
    parent: "Parent",
    sibling: "Sibling",
    cousinParent: "Parent's Sibling",
    cousinParentPartner: "Partner",
    cousin: "Cousin",
  };

  return labels[relationship];
}