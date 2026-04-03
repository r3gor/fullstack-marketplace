---
name: solid-architectural-governance
description: SOLID principles applied pragmatically as a decision framework, considering ecosystem, framework conventions, and long-term maintainability
---

# SOLID Architectural Governance – Senior Pragmatic Edition

## 1. Philosophical Position

SOLID is not dogma.  
It is a decision framework.

All principles must be applied pragmatically, considering:

- The ecosystem of the current technology
- The natural architectural patterns of the framework
- The mental cost of abstraction
- Real change likelihood

Framework conventions are not enemies of architecture.
They define natural responsibility boundaries.

Avoid blind abstraction.
Prioritize clarity, cohesion, and long-term maintainability.

---

## 2. Single Responsibility Principle (SRP) – Cohesion over Fragmentation

A module should have one reason to change — not one function.

### Rules:

- Group logic that changes for the same reason.
- Do not fragment code into microscopic units unless it improves clarity.
- If two parts of code will always evolve together, they belong together.
- Respect framework-native responsibility boundaries.
- Naming must reveal responsibility clearly and follow community standards.

### Example (Conceptual):

Bad SRP (Fragmentation):
Splitting validation, formatting, and domain logic into 6 tiny modules that are always modified together.

Good SRP (Cohesion):
A cohesive domain module that encapsulates a complete behavior that evolves together.

### Mental Check Before Splitting:

- Does this reduce cognitive load?
- Or does it increase navigation cost?
- Is this real scalability or premature refactoring?

---

## 3. Open/Closed Principle (OCP) – Elegant Extensibility

Systems should allow extension without requiring modification of stable logic.

### Rules:

- Encapsulate variation points.
- Prefer strategy/policy patterns when behavior is likely to evolve.
- Do not over-engineer extension points that may never change.
- Extension must not require rewriting stable domain logic.

### Example:

If scoring logic may evolve:
Encapsulate scoring policy.
Do not scatter conditional logic across unrelated modules.

OCP must emerge from realistic change prediction, not speculation.

---

## 4. Liskov Substitution Principle (LSP) – Real Contracts

Subtypes must honor the behavioral contract of their abstraction.

This is about contract integrity, not inheritance hierarchy.

### Rules:

- Do not strengthen preconditions.
- Do not weaken postconditions.
- Do not violate behavioral invariants.
- Prefer composition over inheritance by default.
- Deep inheritance hierarchies require explicit justification.

If deep inheritance is proposed:
→ The agent must alert the user and request architectural confirmation.

### Example:

If an abstraction promises:
"Returns a valid domain object"

An implementation cannot return null or undefined silently.

If a base contract does not throw exceptions under certain inputs,
a subtype must not introduce new unexpected exceptions.

---

## 5. Interface Segregation Principle (ISP) – Client-Oriented Contracts

Interfaces must be defined by consumer needs, not by implementation convenience.

### Rules:

- Avoid "God interfaces".
- Avoid forcing implementers to define unused methods.
- Avoid atomic one-method interfaces unless justified.
- Preserve semantic cohesion.
- If 90% of implementations use A + B + C together,
  consider composing them into a single cohesive interface.

### Good Example:

Define ReadRepository if a service only reads.
Do not expose full CRUD contract unnecessarily.

### Anti-Patterns:

- Interface Mirror (e.g., IMySQLService mirroring MySQLService)
- Interface Bloat
- Fragmentation without semantic cohesion

---

## 6. Dependency Inversion Principle (DIP) – Strategic Abstraction

High-level policy must not depend on low-level implementation details.

Abstractions must belong to the domain — not the technology.

### Rules:

- Abstract I/O, external services, and unstable integrations.
- Do not abstract core framework primitives without strong reason.
- Evaluate cost-benefit before introducing abstraction.
- Abstractions must use domain language, not technical leakage.

### Anti-Patterns:

- Abstractions that leak SQL, HTTP, or library-specific errors.
- Over-abstraction of stable utilities.
- Interface-per-class without domain meaning.

### Mandatory Interaction Rule:

If a new abstraction point is detected,
the agent must:

1. Explain the coupling risk.
2. Present alternatives.
3. Ask the user to confirm the decision.

No silent abstraction.

---

## 7. Refactor-First Mentality

Architecture is evolutionary.

When structural improvement opportunities are detected:

The agent must:

- Explain the architectural smell.
- Describe benefits of refactoring.
- Estimate complexity cost.
- Ask the user for approval before restructuring.

Never force refactor silently.
Never ignore structural debt silently.

---

## 8. Prohibited Junior Anti-Patterns

The following require explicit justification:

- Interface mirrors tied to technology
- Deep inheritance without necessity
- Premature generalization
- "Not Implemented" methods
- Leaky abstractions
- Over-fragmented micro-modules
- Abstractions that increase cognitive load

If detected:
→ The agent must flag and propose correction.

---

## 9. Decision Escalation Protocol

When architectural uncertainty exists:

The agent must:

1. Describe the trade-off clearly.
2. Present at least two viable approaches.
3. Explain long-term impact.
4. Ask the user for direction.

Architectural decisions must be collaborative.

---

Final Principle:

Clarity over cleverness.
Cohesion over fragmentation.
Contracts over inheritance.
Intentional coupling over accidental abstraction.
