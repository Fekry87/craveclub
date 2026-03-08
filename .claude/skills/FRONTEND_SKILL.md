---
name: frontend-dev-skill
description: Frontend Developer skill for building performant, accessible, and responsive web interfaces. Use when the user needs help with React, Vue, Angular, TypeScript, CSS architecture, component design, state management, browser APIs, frontend performance optimization, or web accessibility implementation.
---

# FRONTEND — Frontend Developer Skill

A comprehensive skill for frontend development — spanning component architecture, state management, CSS/styling, performance, accessibility, and modern web platform capabilities.

## Role Context

The Frontend Developer builds the user-facing layer of web applications — fast, accessible, and maintainable. This skill helps with:

- Building reusable, composable UI components
- Implementing responsive and adaptive layouts
- Managing application state efficiently
- Optimizing frontend performance (Core Web Vitals)
- Ensuring WCAG accessibility compliance
- TypeScript integration and type safety
- Testing frontend components and interactions
- Working with design systems and design handoff

## Core Competency Areas

### 1. Component Architecture

When designing and building components:

- **Component Principles**: Single responsibility, composability, controlled vs. uncontrolled, presentation vs. container separation.
- **Props Design**: Minimal required props, sensible defaults, typed interfaces, avoid prop drilling (use context/composition).
- **Composition Patterns**:
  - **Compound Components**: Related components that share implicit state (e.g., `<Tabs>`, `<TabList>`, `<Tab>`, `<TabPanel>`).
  - **Render Props / Slots**: Delegate rendering decisions to the consumer.
  - **Higher-Order Components / Hooks**: Share stateful logic across components.
  - **Headless Components**: Logic without UI — let consumers own the rendering.
- **Component API Conventions**: Consistent naming, forward refs, className/style passthrough, polymorphic `as` prop where useful.
- **File Organization**: Co-locate component, styles, tests, and stories. Group by feature, not by file type.

Framework-specific: React (hooks, Suspense, Server Components), Vue (Composition API, `<script setup>`), Angular (signals, standalone components), Svelte (runes), Solid.

### 2. State Management

When managing application state:

- **State Categories**:
  - **Local/UI State**: Component-scoped — form inputs, toggles, modals (useState/useReducer, ref/reactive).
  - **Server State**: Data from APIs — caching, synchronization, background refetching (TanStack Query, SWR, Apollo).
  - **Global/App State**: Shared across many components — auth, theme, feature flags (Zustand, Pinia, Redux Toolkit, Jotai).
  - **URL State**: Routing params, search/filter state — keep in the URL for shareability and bookmarkability.
- **Principles**: Lift state only as high as needed. Derive state instead of syncing. Normalize nested data. Avoid unnecessary re-renders.
- **Server State Best Practices**: Stale-while-revalidate, optimistic updates, error/retry handling, cache invalidation strategies.
- **Forms**: Controlled components with validation libraries (React Hook Form, Formik, VeeValidate). Schema validation (Zod, Yup).

### 3. CSS & Styling Architecture

When implementing styles:

- **Methodology Options**:
  - **Utility-First** (Tailwind CSS): Rapid prototyping, consistent design tokens, minimal custom CSS.
  - **CSS Modules**: Scoped styles, no naming conflicts, works with any framework.
  - **CSS-in-JS** (styled-components, Emotion, Vanilla Extract): Dynamic styles, type-safe, co-located with components.
  - **BEM/SMACSS**: For vanilla CSS or SASS projects — predictable naming conventions.
- **Layout**: CSS Grid for 2D layouts, Flexbox for 1D alignment. Container queries for component-level responsiveness.
- **Responsive Design**: Mobile-first breakpoints, fluid typography (`clamp()`), responsive images (`srcset`, `<picture>`), logical properties.
- **Design Tokens**: CSS custom properties for colors, spacing, typography, shadows, radii. Token tiers: primitive → semantic → component.
- **Animation**: `transition` for state changes, `@keyframes` for complex sequences, `View Transition API` for page transitions, motion libraries (Framer Motion, GSAP) for advanced effects. Respect `prefers-reduced-motion`.
- **Dark Mode**: CSS `prefers-color-scheme`, design token layer switching, smooth theme transitions.

### 4. TypeScript in Frontend

When using TypeScript:

- **Strict Mode**: Enable `strict: true`. No `any` unless absolutely necessary (and annotate with a comment explaining why).
- **Component Types**: Properly type props, events, refs, slots/children, and generic components.
- **Utility Types**: `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Extract`, `Exclude` — use instead of rewriting types.
- **Discriminated Unions**: Model state machines and variant types (e.g., `{ status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }`).
- **Zod/Valibot**: Runtime validation that generates TypeScript types — use for API responses and form data.
- **Type-Safe APIs**: Generate types from OpenAPI/GraphQL schemas. Never manually type API response shapes.
- **Avoid**: Type assertions (`as`), non-null assertions (`!`), excessive generics, overly complex mapped types that reduce readability.

### 5. Performance Optimization

When optimizing frontend performance:

- **Core Web Vitals**:
  - **LCP** (Largest Contentful Paint): Optimize critical rendering path, preload hero images, server-side rendering.
  - **INP** (Interaction to Next Paint): Minimize main thread blocking, defer non-essential work, use `requestIdleCallback`.
  - **CLS** (Cumulative Layout Shift): Set explicit dimensions on images/embeds, avoid dynamically injected content above the fold.
- **Bundle Optimization**: Code splitting (route-based, component-based), tree shaking, dynamic imports, analyze bundle with source maps.
- **Rendering Strategies**: SSR, SSG, ISR, streaming SSR — choose based on content dynamism and performance requirements.
- **Image Optimization**: Modern formats (WebP, AVIF), responsive sizes, lazy loading, blur placeholders, CDN delivery.
- **Caching**: HTTP cache headers, service workers, asset fingerprinting, CDN configuration.
- **Memoization**: `React.memo`, `useMemo`, `useCallback` — use judiciously for expensive computations, not everywhere.
- **Virtual Scrolling**: For long lists (>100 items), use virtualization (TanStack Virtual, react-window).
- **Profiling**: Chrome DevTools Performance tab, React DevTools Profiler, Lighthouse, WebPageTest.

### 6. Accessibility Implementation

When implementing accessible interfaces:

- **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<dialog>` — not `<div onClick>`.
- **ARIA**: Use ARIA only when semantic HTML isn't sufficient. `aria-label`, `aria-describedby`, `aria-live`, `role`, `aria-expanded`.
- **Keyboard Navigation**: All interactive elements focusable in logical order. Focus trapping in modals. Skip links. Roving tabindex for composite widgets.
- **Focus Management**: Programmatic focus on route changes, modal open/close, dynamic content insertion.
- **Forms**: Associated `<label>` elements, error descriptions linked via `aria-describedby`, clear validation feedback.
- **Color & Contrast**: WCAG AA contrast ratios, don't rely on color alone to convey information.
- **Testing**: Automated (axe-core, jest-axe, Lighthouse), manual (keyboard testing, screen reader testing with VoiceOver/NVDA/JAWS).

### 7. Testing Frontend Code

When testing frontend applications:

- **Testing Strategy**:
  - **Unit Tests**: Utility functions, hooks, pure logic — fast, isolated.
  - **Component Tests**: Render components, verify output and interactions (Testing Library philosophy: test as users interact).
  - **Integration Tests**: Test feature workflows, API integration (MSW for mocking), routing.
  - **E2E Tests**: Critical user journeys in a real browser (Playwright, Cypress).
  - **Visual Regression**: Screenshot comparison for UI consistency (Chromatic, Percy, Playwright screenshots).
- **Testing Library Philosophy**: Query by role, label, text — not by test IDs or CSS selectors. Test behavior, not implementation.
- **Mock Strategy**: MSW (Mock Service Worker) for API mocking — intercepts at the network level, works in browser and Node.
- **Snapshot Testing**: Use sparingly and for small, stable components only. Large snapshots become noise.
- **Accessibility Testing**: Integrate axe-core into component tests. Fail CI on accessibility violations.

## Frameworks & Templates

| Situation | Framework/Tool |
|-----------|----------------|
| Component testing | Testing Library + Vitest/Jest |
| E2E testing | Playwright, Cypress |
| State management | TanStack Query (server), Zustand (client) |
| Styling | Tailwind CSS, CSS Modules |
| Animation | Framer Motion, GSAP, CSS animations |
| Performance | Lighthouse, WebPageTest, DevTools |
| Accessibility | axe-core, WAVE, screen readers |
| Build tooling | Vite, Turbopack, esbuild |

## Deliverable Quality Standards

All frontend deliverables should be:

- **Accessible**: WCAG AA compliant, keyboard navigable, screen reader tested.
- **Responsive**: Works across mobile, tablet, and desktop. Tested at key breakpoints.
- **Performant**: Meets Core Web Vitals thresholds. No unnecessary re-renders or bundle bloat.
- **Type-safe**: Full TypeScript coverage with strict mode. No `any` types in production.
- **Tested**: Component tests for interactive elements, E2E for critical paths, visual regression for design consistency.
- **Cross-browser**: Tested in Chrome, Firefox, Safari (and Edge where required).
- **Consistent**: Follows design system patterns. Deviations documented.

## Anti-Patterns to Avoid

- `div` soup instead of semantic HTML elements
- `useEffect` as a state synchronization mechanism (derive state instead)
- Importing entire libraries when you need one function (tree shaking won't save you from bad imports)
- CSS `!important` chains and specificity wars
- Premature optimization (memoizing everything "just in case")
- Disabling ESLint rules instead of fixing the underlying issue
- Testing implementation details (internal state, private methods)
- Hardcoded breakpoints instead of content-driven responsive design
