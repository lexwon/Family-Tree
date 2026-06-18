import { useMemo, useState } from "react";
import styled from "styled-components";
import familyDataJson from "../data/family.json";
import "reactflow/dist/style.css";
import {
  buildFamilyIndex,
  buildFocusView,
  type FamilyData,
} from "./relationshipEngine";
import { ExplanationPanel, ReactFlowTreePanel } from "./components";

const familyData = familyDataJson as FamilyData;
const family = buildFamilyIndex(familyData);

export function App() {
  const initialFocusPersonId = familyData.focusPersonIds[0];
  if (!initialFocusPersonId) {
    throw new Error("Family Data must include at least one Focus Person");
  }

  const [focusPersonId, setFocusPersonId] = useState<string>(initialFocusPersonId);
  
  const focusView = useMemo(
    () => buildFocusView(familyData, family, focusPersonId),
    [focusPersonId],
  );

  const highlightedPersonIds = useMemo(() => {
    return new Set([
      focusView.focusPersonId,
      ...focusView.immediateFamily.map((item) => item.personId),
    ]);
  }, [focusView]);

  return (
    <AppShell>
      <TopBar aria-labelledby="app-title">
        <div>
          <Eyebrow>Family Tree</Eyebrow>
          <Title id="app-title">{focusView.focusPersonName}'s Family View</Title>
        </div>
      </TopBar>

      <ContentGrid>
        <ReactFlowTreePanel
          focusView={focusView}
          highlightedPersonIds={highlightedPersonIds}
          familyData={familyData}
          family={family}
          onSelectPerson={setFocusPersonId}
        />
        <ExplanationPanel focusView={focusView} />
      </ContentGrid>
    </AppShell>
  );
}

const AppShell = styled.main`
  min-width: 1480px;
  width: 100%;
  margin: 0 auto;
  padding: 28px;

  @media (max-width: 980px) {
    padding: 20px;
  }
  @media (max-width: 680px) {
    padding: 16px;
  }
`;

const TopBar = styled.section`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 0 28px;

  @media (max-width: 980px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Title = styled.h1`
  max-width: 760px;
  font-size: clamp(2rem, 4vw, 4.3rem);
  line-height: 1;
`;

const Eyebrow = styled.p`
  margin-bottom: 6px;
  color: #6a4b13;
  font-size: 0.77rem;
  font-weight: 800;
  text-transform: uppercase;
`;



const ContentGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(360px, 0.9fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;