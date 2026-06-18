import styled from "styled-components";
import { type FocusView } from "../relationshipEngine";
import { RelationshipSection } from "./RelationshipSection";

type ExplanationPanelProps = {
  focusView: FocusView;
};

export function ExplanationPanel({ focusView }: ExplanationPanelProps) {
  return (
    <Panel aria-labelledby="explanations-title">
      <SectionHeading>
        <Eyebrow>Relationships</Eyebrow>
        <Title id="explanations-title">How Everyone Connects</Title>
      </SectionHeading>

      <RelationshipSection title="Immediate Family" items={focusView.immediateFamily} />
    </Panel>
  );
}

const Panel = styled.section`
  min-width: 0;
`;

const SectionHeading = styled.div`
  margin-bottom: 16px;
`;

const Eyebrow = styled.p`
  margin-bottom: 6px;
  color: #6a4b13;
  font-size: 0.77rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const Title = styled.h2`
  font-size: 1.45rem;
  line-height: 1.15;
`;