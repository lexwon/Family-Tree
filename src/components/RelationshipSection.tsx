import styled from "styled-components";
import { type RelationshipExplanation, type RelationshipKind } from "../relationshipEngine";

type RelationshipSectionProps = {
  title: string;
  subtitle?: string;
  items: RelationshipExplanation[];
};

export function RelationshipSection({ title, subtitle, items }: RelationshipSectionProps) {
  return (
    <Section>
      <SectionHeader>
        <Title>{title}</Title>
        {subtitle && <p>{subtitle}</p>}
      </SectionHeader>

      <List>
        {items.map((item) => (
          <Item key={`${item.personId}-${item.relationship}`}>
            <Tag>{formatRelationship(item.relationship)}</Tag>
            <p>{item.explanation}</p>
          </Item>
        ))}
      </List>
    </Section>
  );
}

export function formatRelationship(relationship: RelationshipKind): string {
  const labels: Record<RelationshipKind, string> = {
    parent: "Parent",
    sibling: "Sibling",
    child: "Child",
    partner: "Partner",
    cousinParent: "Parent's Sibling",
    cousinParentPartner: "Partner",
    cousin: "Cousin",
  };

  return labels[relationship];
}

const Section = styled.article`
  border-top: 1px solid #d9d2c4;
  padding: 18px 0;

  &:first-of-type {
    border-top: 0;
    padding-top: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  p {
    color: #607169;
    font-size: 0.86rem;
  }

  @media (max-width: 980px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h3`
  font-size: 1rem;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const Item = styled.div`
  display: grid;
  gap: 6px;
  border-radius: 8px;
  background: #ffffff;
  padding: 13px;
  box-shadow: inset 0 0 0 1px #dce4df;

  p {
    color: #2d3a35;
    font-size: 0.94rem;
  }
`;

const Tag = styled.span`
  width: fit-content;
  border-radius: 999px;
  background: #f3df9b;
  color: #4e3d11;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 800;
`;