import { writeFile } from "node:fs/promises";
import { loadFamilyData, paths, buildFamilyIndex } from "./family-data";
import { buildFocusView } from "../src/relationshipEngine";

const familyData = await loadFamilyData();
const family = buildFamilyIndex(familyData);
const requestedFocusPersonIds = process.argv.slice(2);
const focusPersonIds =
  requestedFocusPersonIds.length > 0 ? requestedFocusPersonIds : familyData.focusPersonIds;

for (const focusPersonId of focusPersonIds) {
  if (!familyData.focusPersonIds.includes(focusPersonId)) {
    throw new Error(
      `${focusPersonId} is not a supported Focus Person. Use one of: ${familyData.focusPersonIds.join(", ")}`,
    );
  }
}

const relationshipExplanations = {
  generatedFrom: "data/family.json",
  focusPeople: focusPersonIds.map((focusPersonId) =>
    buildFocusView(familyData, family, focusPersonId)
  ),
};

await writeFile(
  paths.relationshipExplanations,
  `${JSON.stringify(relationshipExplanations, null, 2)}\n`,
  "utf8",
);
