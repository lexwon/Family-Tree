# Family Tree Application Plan

## Purpose

This application will help my children understand who they are talking to in the family and how each person is connected to them.

For now, the application is scoped only to my family.

The first supported Focus People are Arya and Kira. The application should explain relationships from the selected Focus Person's perspective using child-facing Relationship Explanations.

## Product Decisions From Grill-Me

- Family Data is the source of truth, not the Mermaid diagram or any future rendered view.
- Family Data is made from people and Relationship Facts.
- Parent-Child Facts connect parents to children without storing mother or father roles.
- Partnership Facts connect two adults as a couple unit without modelling legal marital status.
- Sibling, cousin, aunt, uncle, and similar connections are Derived Relationships.
- Relationship Explanations should be generated from Relationship Facts and written for children.
- Cousin explanations should first use the parents' sibling relationship rather than shared grandparents.
- The first useful view is a Focus Person view showing Immediate Family and visible Cousin Families already captured in the sample tree.

## Step 1: Structured Family Data

### Goal

Create the first version of the Family Data as structured repository-local JSON.

### Deliverables

- Define a simple JSON shape for people, Parent-Child Facts, and Partnership Facts.
- Move the current family structure into the JSON source of truth.
- Avoid storing display-only labels such as mother, father, brother, sister, cousin, aunt, or uncle.
- Keep the model small enough to change as the application teaches us more.

### Notes

- The JSON file should be easy to update manually while the project is small.
- The priority is capturing Relationship Facts clearly before building a custom UI.

## Step 2: Generated Mermaid View

### Goal

Generate the Mermaid family tree from the structured Family Data.

### Deliverables

- Create a script that generates the Mermaid flowchart from the JSON source of truth.
- Keep `data/tree.mmd` as a generated visual snapshot.
- Render the Mermaid diagram directly in GitHub.
- Document how to regenerate the Mermaid file after data changes.

### Notes

- Mermaid is a cheap inspection view until a better UI exists.
- Generating Mermaid prevents the diagram from drifting away from the Family Data.

## Step 3: Relationship Explanation Engine

### Goal

Derive child-facing relationship explanations from Relationship Facts.

### Deliverables

- Support choosing Arya or Kira as the Focus Person.
- Derive sibling relationships from shared Parent-Child Facts.
- Derive cousin relationships through the parents' sibling relationship.
- Generate Relationship Explanations for Immediate Family and visible Cousin Families.

### Notes

- Relationship Explanations should avoid graph language and use plain family language.
- Cousin explanations should say, for example, that a cousin's parent is the Focus Person's parent's sibling before falling back to shared grandparents.

## Step 4: React Application

### Goal

Create a React application that renders the family tree from the Family Data.

### Deliverables

- Create a React application in this repository.
- Render people and derived relationships in the application.
- Let the user choose a Focus Person.
- Show Relationship Explanations for the selected Focus Person.
- Host the React application on GitHub Pages.

### Notes

- The first React version does not need advanced interactivity.
- The tree data can stay in repository-local JSON while the application is small.
- The first UI should prioritise comprehension over completeness.

## Step 5: Interactive Tree Rendering

### Goal

Use a dedicated graph or flow library to render the tree in a more interactive and child-friendly way.

### Deliverables

- Evaluate a library such as React Flow.
- Render family members as interactive nodes.
- Render Relationship Facts and Derived Relationships in ways that are visually distinct.
- Support navigation around a larger tree, such as zooming and panning.
- Keep the Focus Person, Immediate Family, and visible Cousin Families easy to identify.

### Notes

- React Flow is a strong candidate because it supports node-based diagrams, edges, zooming, panning, and custom node rendering.
- The graph view should not become the source of truth; it should render from Family Data.

## Future Roadmap

These changes are not planned for the initial version, but should be considered later.

### Editable UI

- Allow family members to be updated in the UI.
- Support editing people and Relationship Facts.
- Support adding new people, Parent-Child Facts, and Partnership Facts.
- Eventually support deleting people and Relationship Facts if needed.

### Data Storage and API

- Create a database to store the family tree data.
- Create a REST service to read and update the tree data.
- Consider free hosting options for the database and API.

Recommended free options to evaluate:

- Supabase: free hosted PostgreSQL database, authentication, and API support.
- Firebase: free tier for a document database and hosting.
- GitHub-hosted JSON file: simplest option while the app is small, but not ideal for editing from the UI.

### Scaling Considerations

- Consider how the data model should handle larger family trees.
- Consider how the UI should behave as the number of people grows.
- Plan for search, filtering, grouping, and generated Relationship Explanations.
- Keep the tree readable on both desktop and mobile screens.
