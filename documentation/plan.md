# Family Tree Application Plan

## Purpose

This application will help my children understand who they are talking to in the family and how each person is connected.

For now, the application is scoped only to my family.

## Step 1: Mermaid Family Tree

### Goal

Create the first version of the family tree as a Mermaid flowchart diagram.

### Deliverables

- Create a Mermaid flowchart diagram that represents the family tree.
- Store the diagram in the repository.
- Host the repository on GitHub.
- Render the Mermaid diagram directly in GitHub.

### Notes

- This version should be simple and easy to update manually.
- The priority is capturing the family structure clearly before building a custom UI.

## Step 2: React Application

### Goal

Create a React application that renders the family tree.

### Deliverables

- Create a React application in this repository.
- Render the family tree data in the application.
- Host the React application on GitHub Pages.

### Notes

- The first React version does not need advanced interactivity.
- The tree data can still be stored in a simple local format while the application is small.

## Step 3: Interactive Tree Rendering

### Goal

Use a dedicated graph or flow library to render the tree in a more interactive way.

### Deliverables

- Evaluate a library such as React Flow.
- Render family members as interactive nodes.
- Render family relationships as edges or connections.
- Support navigation around a larger tree, such as zooming and panning.

### Notes

- React Flow is a strong candidate because it supports node-based diagrams, edges, zooming, panning, and custom node rendering.
- The data model should start becoming more structured in this phase so future editing and storage are easier.

## Future Roadmap

These changes are not planned for the initial version, but should be considered later.

### Editable UI

- Allow family members to be updated in the UI.
- Support editing existing nodes.
- Support adding new nodes.
- Eventually support deleting nodes if needed.

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
- Plan for search, filtering, grouping, and relationship labels.
- Keep the tree readable on both desktop and mobile screens.
