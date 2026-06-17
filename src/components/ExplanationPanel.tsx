import { type FocusView } from "../relationshipEngine";
import { RelationshipSection } from "./RelationshipSection";

type ExplanationPanelProps = {
  focusView: FocusView;
};

export function ExplanationPanel({ focusView }: ExplanationPanelProps) {
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