# Family Tree

This context describes the family relationships that the application helps children understand.

## Language

**Focus Person**:
The person whose perspective is used to explain family relationships. The first supported focus people are children in the family, starting with Arya and Kira.
_Avoid_: Centre, viewer, selected child

**Immediate Family**:
The close family group shown around a Focus Person, including parents, siblings, and nearby relatives needed to explain cousin relationships.
_Avoid_: Household, nuclear family

**Cousin Family**:
A cousin and the cousin's parents as shown in the current family tree. For the first version, the visible Cousin Families are limited to the relatives already captured in the sample tree.
_Avoid_: Extended family, cousin branch

**Relationship Explanation**:
A child-facing sentence that explains how one person is connected to the Focus Person. Cousin explanations should first use the parents' sibling relationship rather than shared grandparents.
_Avoid_: Edge label, relationship path

**Relationship Fact**:
A source-of-truth family connection, such as a parent-child or partnership connection. Child-facing labels and sibling connections should be derived from Relationship Facts.
_Avoid_: Display relationship, label

**Parent-Child Fact**:
A Relationship Fact that connects a parent to a child without assigning a mother or father role.
_Avoid_: Mother edge, father edge

**Partnership Fact**:
A Relationship Fact that connects two adults as a couple unit in the family view without modelling legal marital status.
_Avoid_: Spouse, marriage

**Derived Relationship**:
A family connection inferred from Relationship Facts, such as sibling, cousin, aunt, or uncle.
_Avoid_: Relationship Fact, stored relationship

**Family Data**:
The source-of-truth collection of people and Relationship Facts used by the application and any generated views.
_Avoid_: Mermaid diagram, tree file
