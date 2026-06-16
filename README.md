# Family Tree

A family tree application for helping children understand who they are talking to in the family and how each person is connected.

The project is currently scoped to one family and will grow in stages, starting with a simple Mermaid diagram before moving toward a React application and a more interactive tree experience.

## Project Status

This repository is currently in the first data-modelling phase.

The initial plan is documented in [documentation/plan.md](documentation/plan.md).

The source-of-truth Family Data lives in [data/family.json](data/family.json). It stores people, Parent-Child Facts, and Partnership Facts without display-only relationship labels such as mother, father, sibling, cousin, aunt, or uncle.

The generated Mermaid inspection view lives in [data/tree.mmd](data/tree.mmd). Do not edit it by hand; regenerate it from the Family Data after data changes.

## Roadmap

### Step 1: Structured Family Data

- Store people in repository-local JSON.
- Store Parent-Child Facts and Partnership Facts as the first Relationship Facts.
- Keep display labels and Derived Relationships out of the source data.

### Step 2: Generated Mermaid View

- Generate the Mermaid family tree from the structured Family Data.
- Keep the diagram as an inspection view, not the source of truth.

### Step 3: Relationship Explanation Engine

- Derive child-facing relationship explanations from Relationship Facts.
- Support Arya and Kira as the first Focus People.

### Step 4: React Application

- Create a React application to render the family tree.
- Keep the first version simple and easy to maintain.
- Host the application on GitHub Pages.

### Step 5: Interactive Tree

- Use a library such as React Flow to render the tree more interactively.
- Support navigation features such as zooming and panning.
- Represent family members as nodes and relationships as connections.

## Future Ideas

- Add UI support for editing family members.
- Add UI support for creating new family members.
- Store tree data in a database.
- Add a REST service for reading and updating tree data.
- Evaluate free hosting options such as Supabase, Firebase, or GitHub-hosted data files.
- Improve scaling for larger trees with search, filtering, grouping, and mobile-friendly layouts.

## Repository Structure

```text
.
├── documentation/
│   └── plan.md
├── data/
│   ├── family.json
│   └── tree.mmd
└── README.md
```

## Getting Started

There is no application to run yet.

Start by reading the project plan:

```text
documentation/plan.md
```

Then inspect or update the structured Family Data:

```text
data/family.json
```

Regenerate the Mermaid view after changing the Family Data:

```sh
node scripts/generate-mermaid.mjs
```
