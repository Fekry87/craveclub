---
name: product-designer-skill
description: Product Designer skill for user research, UX strategy, interaction design, visual design, design systems, and prototyping. Use when the user needs help with user experience design, wireframes, user flows, usability testing, design critiques, accessibility, design tokens, or translating requirements into intuitive interfaces.
---

# Product Designer Skill

A comprehensive skill for product design — spanning user research, UX strategy, interaction design, visual design, design systems, and design operations.

## Role Context

The Product Designer crafts intuitive, delightful, and accessible experiences that solve real user problems. This skill helps with:

- Conducting and synthesizing user research
- Designing user flows, wireframes, and high-fidelity mockups
- Building and maintaining design systems
- Defining interaction patterns and micro-interactions
- Ensuring accessibility compliance (WCAG)
- Facilitating design critiques and usability testing
- Collaborating with product managers and engineers on feasibility and trade-offs

## Core Competency Areas

### 1. User Research & Discovery

When planning or conducting research:

- **Research Methods**: Select based on question type:
  - **Behavioral** (what users do): Analytics, heatmaps, session recordings, A/B tests.
  - **Attitudinal** (what users think): Interviews, surveys, card sorting, diary studies.
  - **Generative** (discover problems): Contextual inquiry, ethnography, jobs-to-be-done interviews.
  - **Evaluative** (validate solutions): Usability testing, concept testing, tree testing.
- **Research Plan**: Define objectives, participant criteria, methodology, script/guide, success metrics.
- **Synthesis**: Affinity mapping, journey mapping, empathy maps, insight statements (observation → insight → opportunity).
- **Personas**: Evidence-based personas grounded in research data, not assumptions. Include behaviors, goals, pain points, and context.
- **Bias Awareness**: Confirmation bias, leading questions, small sample generalization — actively mitigate throughout research.

Output artifacts: Research plans, interview guides, synthesis decks, personas, journey maps.

### 2. Information Architecture & User Flows

When structuring product experiences:

- **Information Architecture**: Organize content and features based on user mental models (validated through card sorting and tree testing).
- **Navigation Patterns**: Top nav, side nav, tabs, breadcrumbs, hub-and-spoke — choose based on content depth and user task frequency.
- **User Flows**: Map the happy path first, then error states, edge cases, and recovery flows. Include entry points and exit points.
- **Task Analysis**: Break complex tasks into subtasks. Identify decision points, required inputs, and potential friction.
- **Content Hierarchy**: Primary, secondary, and tertiary content levels. Users should find what they need within 3 clicks/taps.
- **State Mapping**: Empty states, loading states, error states, success states, partial states — design for every condition.

Output artifacts: Sitemaps, user flow diagrams, task flows, state inventories.

### 3. Interaction Design & Prototyping

When designing interactions:

- **Interaction Principles**: Direct manipulation, feedback, consistency, forgiveness (undo/redo), progressive disclosure.
- **Form Design**: Logical grouping, inline validation, smart defaults, clear labels (not just placeholders), error messages that explain how to fix.
- **Responsive Behavior**: Mobile-first approach, adaptive layouts, touch targets (min 44px), gesture considerations.
- **Micro-interactions**: Purposeful animations for state changes, feedback, onboarding cues. Motion should inform, not decorate.
- **Prototyping Fidelity**:
  - **Low-fi**: Paper sketches, basic wireframes — for exploring multiple concepts quickly.
  - **Mid-fi**: Interactive wireframes — for validating flows and interactions.
  - **Hi-fi**: Pixel-perfect prototypes — for usability testing and developer handoff.
- **Prototype Scope**: Prototype the riskiest assumptions first. Don't over-invest in areas with high confidence.

Tools: Figma, Framer, ProtoPie, Principle.

Output artifacts: Wireframes, interactive prototypes, interaction specs, animation guidelines.

### 4. Visual Design

When defining visual direction:

- **Typography**: Establish a type scale (modular or custom). Define hierarchy with size, weight, and color — not just bold/larger.
- **Color System**: Primary, secondary, neutral, semantic (success, warning, error, info) palettes. Define for light and dark modes.
- **Spacing & Layout**: Use a spacing scale (4px or 8px base grid). Consistent padding, margin, and gap values.
- **Iconography**: Consistent style (outlined, filled, duotone), consistent sizing grid, semantic meaning.
- **Imagery & Illustration**: Define style guidelines — photography treatment, illustration style, empty state visuals.
- **Elevation & Depth**: Shadow system for cards, modals, popovers. Consistent layering logic.
- **Brand Alignment**: Visual design should express brand personality — trustworthy, playful, premium, technical — through every detail.

Output artifacts: Style guides, mood boards, visual design specs, brand application guidelines.

### 5. Design Systems

When building or maintaining a design system:

- **Component Architecture**: Atomic design (atoms → molecules → organisms → templates → pages) or similar compositional hierarchy.
- **Component API**: Define props, variants, states, sizes, and slots. Mirror engineering component APIs.
- **Token System**: Design tokens for color, typography, spacing, radii, shadows, motion. Exportable to CSS/JSON/platform-native formats.
- **Documentation**: Usage guidelines, do/don't examples, anatomy diagrams, interaction specs, accessibility notes per component.
- **Governance**: Contribution model (who can add/modify), review process, deprecation strategy, versioning.
- **Adoption Metrics**: Track component usage, custom overrides, and design-to-code parity.

Tools: Figma component libraries, Storybook, Zeroheight, Supernova.

Output artifacts: Component libraries, token files, documentation sites, contribution guides.

### 6. Accessibility (a11y)

When ensuring inclusive design:

- **WCAG Compliance**: Target AA minimum, AAA for critical flows. Understand the four principles: Perceivable, Operable, Understandable, Robust.
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text and UI elements.
- **Keyboard Navigation**: All interactive elements focusable, logical tab order, visible focus indicators, keyboard shortcuts for power users.
- **Screen Reader Support**: Semantic HTML, ARIA labels where needed, meaningful alt text, live regions for dynamic content.
- **Motion Sensitivity**: Respect `prefers-reduced-motion`, avoid vestibular-triggering animations, provide pause/stop controls.
- **Inclusive Design Patterns**: Error messages with suggestions, clear form labels, sufficient touch targets, readable font sizes (min 16px body).

Output artifacts: Accessibility audits, annotation guides, inclusive design checklists.

### 7. Usability Testing & Validation

When testing designs with users:

- **Test Planning**: Define tasks (not questions), success criteria, and observation protocol. 5 users catch ~85% of usability issues.
- **Moderation**: Think-aloud protocol, avoid leading, observe behavior over stated preference, probe on confusion.
- **Remote vs. In-Person**: Remote for scale and convenience, in-person for depth and context. Unmoderated for quantitative validation.
- **Analysis**: Severity ratings (critical, major, minor, cosmetic), task success rates, time on task, error rates.
- **Actionable Findings**: Every finding should map to a specific design recommendation. Prioritize by severity × frequency.
- **Iteration**: Test → Learn → Iterate → Test again. Design is never done on the first attempt.

Output artifacts: Test plans, task scripts, findings reports, recommendation matrices.

## Frameworks & Templates

| Situation | Framework |
|-----------|-----------|
| Discovering user needs | JTBD, Empathy Maps, Journey Maps |
| Evaluating designs | Heuristic Evaluation (Nielsen's 10) |
| Design critique | Liz Lerman Critical Response Process |
| Prioritizing features | Impact/Effort Matrix, Kano Model |
| Accessibility audit | WCAG 2.2 checklist |
| Design system structure | Atomic Design (Brad Frost) |
| Measuring UX | HEART framework (Google), SUS score |

## Deliverable Quality Standards

All design deliverables should be:

- **User-centered**: Grounded in research or clearly labeled as assumptions requiring validation.
- **Complete**: All states designed (empty, loading, error, success, edge cases). No "happy path only" designs.
- **Annotated**: Interaction specs, spacing values, responsive behavior, and accessibility notes included.
- **Consistent**: Following the design system. Deviations documented and justified.
- **Developer-friendly**: Organized layers, named components, design tokens, clear specs for handoff.
- **Testable**: Designs should be specific enough to write test scenarios from.

## Anti-Patterns to Avoid

- Designing for the happy path only and ignoring error/empty/edge states
- Pixel-perfect obsession before validating the concept with users
- Designing in isolation without engineering input on feasibility
- Accessibility as an afterthought instead of a design constraint
- Inconsistent patterns across screens that increase cognitive load
- Using placeholder content ("Lorem ipsum") for critical UI decisions
- Over-animating interfaces (motion for the sake of motion)
