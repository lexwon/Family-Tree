# Family Tree

A family tree application for helping children understand who they are talking to in the family and how each person is connected.

The project is currently scoped to one family and includes a TypeScript React application for browsing the family tree from a selected Focus Person's point of view.

## Project Status

This repository is currently in the first React application phase.

The initial plan is documented in [documentation/plan.md](documentation/plan.md).

The source-of-truth Family Data lives in [data/family.json](data/family.json). It stores people, Parent-Child Facts, and Partnership Facts without display-only relationship labels such as mother, father, sibling, cousin, aunt, or uncle.

The generated Mermaid inspection view lives in [data/tree.mmd](data/tree.mmd). Do not edit it by hand; regenerate it from the Family Data after data changes.

The generated Relationship Explanations live in [data/relationship-explanations.json](data/relationship-explanations.json). Do not edit them by hand; regenerate them from the Family Data after data changes.

The React application derives its displayed relationships directly from [data/family.json](data/family.json), so the UI stays aligned with the source-of-truth Family Data.

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
- Generate Immediate Family and visible Cousin Family explanations from the Family Data.

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
│   ├── relationship-explanations.json
│   └── tree.mmd
├── scripts/
│   ├── family-data.ts
│   ├── generate-mermaid.ts
│   └── generate-relationship-explanations.ts
├── src/
│   ├── main.tsx
│   ├── relationshipEngine.ts
│   └── styles.css
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Getting Started

Start by reading the project plan:

```text
documentation/plan.md
```

Then inspect or update the structured Family Data:

```text
data/family.json
```

Install dependencies with pnpm:

```sh
pnpm install
```

Run the React application locally:

```sh
pnpm dev
```

Build the TypeScript React application:

```sh
pnpm build
```

Regenerate the Mermaid view after changing the Family Data:

```sh
pnpm generate:mermaid
```

Regenerate Relationship Explanations after changing the Family Data:

```sh
pnpm generate:explanations
```

Generate explanations for one supported Focus Person:

```sh
pnpm generate:explanations arya
pnpm generate:explanations kira
```

## GitHub Pages

The app is configured for GitHub Pages with Vite's `base` set to `/Family-Tree/`.

The deployment workflow lives in [.github/workflows/deploy.yml](.github/workflows/deploy.yml). It installs dependencies with pnpm, builds the app, and deploys the `dist` output to GitHub Pages when changes are pushed to `main` or when the workflow is run manually.
