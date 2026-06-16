# JSON source of truth and generated Mermaid

The family data will be stored first in a repository-local JSON file, and the Mermaid diagram will be generated from that data during the first JSON milestone. Mermaid is only a cheap way to inspect the data until a better UI exists, so generating it early prevents the visual snapshot from drifting away from the source of truth even while the data model is still allowed to change.
