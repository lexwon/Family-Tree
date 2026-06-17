import { useMemo, useState } from "react";
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
      ...focusView.cousinFamilies.flatMap((group) => group.people.map((item) => item.personId)),
    ]);
  }, [focusView]);

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
        </div>
      </section>

      <section className="content-grid">
        <ReactFlowTreePanel
          focusView={focusView}
          highlightedPersonIds={highlightedPersonIds}
          focusPersonId={focusPersonId}
          familyData={familyData}
          family={family}
        />
        <ExplanationPanel focusView={focusView} />
      </section>
    </main>
  );
}