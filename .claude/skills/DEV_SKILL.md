---
name: dev-skill
description: Software Developer skill for writing clean, maintainable, and performant backend code. Use when the user needs help with application development, API implementation, database design, business logic, testing, debugging, code reviews, or general software engineering best practices.
---

# DEV — Software Developer Skill

A comprehensive skill for software development — spanning code quality, architecture patterns, testing, debugging, and engineering best practices.

## Role Context

The Software Developer writes production-grade code that solves real business problems. This skill helps with:

- Writing clean, readable, and maintainable code
- Implementing business logic and application features
- Designing database schemas and data models
- Writing comprehensive tests at all levels
- Debugging and troubleshooting production issues
- Performing and responding to code reviews
- Refactoring and improving existing codebases

## Core Competency Areas

### 1. Code Quality & Clean Code

When writing or reviewing code:

- **Naming**: Use intention-revealing names. Variables describe what they hold, functions describe what they do, classes describe what they represent.
- **Functions**: Small, single-purpose, one level of abstraction. Prefer pure functions where possible.
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion — apply pragmatically, not dogmatically.
- **DRY with Judgment**: Eliminate true duplication but tolerate similar-looking code that serves different purposes (premature abstraction is worse than duplication).
- **Error Handling**: Use typed errors, fail fast, provide context in error messages, never swallow exceptions silently.
- **Comments**: Code should be self-documenting. Comments explain "why", not "what". Document public APIs, non-obvious decisions, and workarounds.

### 2. Design Patterns & Architecture

When structuring applications:

- **Layered Architecture**: Separate concerns — controllers/handlers, services/use-cases, repositories/data-access, domain models.
- **Dependency Injection**: Invert dependencies to enable testing and flexibility. Prefer constructor injection.
- **Repository Pattern**: Abstract data access behind interfaces so storage can change without affecting business logic.
- **Domain-Driven Design** (when complexity warrants): Entities, value objects, aggregates, domain events, bounded contexts.
- **Event-Driven Patterns**: Pub/sub, event sourcing, CQRS — apply when decoupling and auditability are important.
- **Common Patterns**: Strategy, Observer, Factory, Builder, Adapter — use when they clarify intent, not for pattern-matching sake.

### 3. Database & Data Modeling

When designing data layers:

- **Schema Design**: Normalize by default (3NF), denormalize intentionally for read performance with documented rationale.
- **Migrations**: Always use versioned, reversible migrations. Never modify production schemas manually.
- **Indexing**: Index for query patterns, not speculatively. Composite indexes should match query column order.
- **Query Optimization**: Avoid N+1 queries, use EXPLAIN/ANALYZE, prefer batch operations, paginate large result sets.
- **Transactions**: Understand isolation levels. Use the minimum isolation level that guarantees correctness.
- **ORMs vs. Raw SQL**: ORMs for CRUD, raw SQL or query builders for complex queries and performance-critical paths.

### 4. Testing Strategy

When writing or planning tests:

- **Testing Pyramid**: Many unit tests, fewer integration tests, minimal e2e tests.
- **Unit Tests**: Test behavior, not implementation. One assertion per logical concept. Use descriptive test names that read like specifications.
- **Integration Tests**: Test real interactions — database queries, external API calls (with controlled test doubles), message queue publishing.
- **Test Doubles**: Mocks for verifying interactions, stubs for providing canned responses, fakes for lightweight implementations. Prefer fakes and stubs over mocks.
- **Test Organization**: Arrange-Act-Assert pattern. Keep tests independent and deterministic. No shared mutable state between tests.
- **Edge Cases**: Null/empty inputs, boundary values, concurrent access, error paths, timeout scenarios.
- **Coverage**: Aim for meaningful coverage (critical paths, edge cases) not just percentage targets.

### 5. Debugging & Troubleshooting

When diagnosing issues:

- **Scientific Method**: Observe → Hypothesize → Predict → Test → Conclude. Resist the urge to change things randomly.
- **Reproduce First**: Always reproduce the bug reliably before attempting a fix.
- **Binary Search**: Narrow the problem space systematically — bisect commits, isolate components, remove variables.
- **Logging**: Add structured, contextual logging at key decision points. Include correlation IDs for distributed systems.
- **Profiling**: Use profilers (CPU, memory, I/O) before optimizing. Measure, don't guess.
- **Root Cause Analysis**: Fix the root cause, not just the symptom. Ask "why" five times.

### 6. Code Review Practices

When reviewing or preparing code for review:

- **PR Hygiene**: Small, focused PRs (<400 lines). Clear title and description explaining what and why. Link to tickets/issues.
- **Review Checklist**: Correctness, edge cases, error handling, security implications, performance, readability, test coverage.
- **Feedback Style**: Be specific, suggest alternatives, distinguish between blocking issues and nits. Ask questions instead of making demands.
- **Self-Review**: Review your own PR before requesting others. Check diff, run tests, verify edge cases.

### 7. Performance & Optimization

When optimizing code:

- **Profile First**: Never optimize without profiling data. Premature optimization is the root of all evil.
- **Big-O Awareness**: Understand time and space complexity of algorithms and data structures you use.
- **Caching**: Cache expensive computations and external calls. Define invalidation strategy upfront.
- **Concurrency**: Use appropriate primitives (mutexes, channels, async/await). Understand race conditions and deadlocks.
- **Memory Management**: Be aware of memory allocation patterns, avoid leaks, understand garbage collection behavior in your language.
- **Batch Operations**: Prefer batch reads/writes over individual operations for I/O-bound tasks.

## Language-Agnostic Principles

Regardless of language or framework:

- **Fail fast and loud**: Validate inputs early, return errors explicitly, crash on unrecoverable states.
- **Immutability by default**: Prefer immutable data structures. Mutate only when necessary and localize mutations.
- **Composition over inheritance**: Build behavior through composition and interfaces/traits/protocols.
- **Configuration as code**: Environment-specific config via environment variables or config files — never hardcoded secrets.
- **Idempotency**: Design operations (especially API handlers and message consumers) to be safely retryable.
- **Backwards compatibility**: Database migrations, API changes, and configuration changes should be deployable independently.

## Deliverable Quality Standards

All code deliverables should be:

- **Working**: Compiles, passes tests, handles expected error cases.
- **Readable**: Another developer can understand it without a walkthrough.
- **Tested**: Critical paths have automated tests. Edge cases are covered.
- **Documented**: Public APIs have docstrings. Non-obvious decisions have inline comments.
- **Secure**: No hardcoded secrets, validated inputs, parameterized queries, appropriate access controls.
- **Deployable**: No manual steps required beyond the standard CI/CD pipeline.

## Anti-Patterns to Avoid

- God classes/functions that do everything
- Premature abstraction ("I might need this later")
- Stringly-typed code instead of proper types/enums
- Ignoring compiler/linter warnings
- Copy-paste programming without understanding what the code does
- Testing implementation details instead of behavior
- Catching and silently swallowing all exceptions
