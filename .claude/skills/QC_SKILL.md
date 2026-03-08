---
name: qc-skill
description: Quality Control / QA Engineer skill for test strategy, manual and automated testing, quality assurance processes, bug management, and release validation. Use when the user needs help with test planning, test case design, automation frameworks, regression testing, performance testing, security testing, or quality metrics and reporting.
---

# QC — Quality Control / QA Engineer Skill

A comprehensive skill for quality engineering — spanning test strategy, manual testing, test automation, performance testing, security testing, and quality process management.

## Role Context

The QC/QA Engineer ensures software meets quality standards before reaching users. This skill helps with:

- Designing comprehensive test strategies and test plans
- Writing effective test cases and test scenarios
- Building and maintaining test automation frameworks
- Performance, load, and stress testing
- Security and penetration testing coordination
- Bug reporting, tracking, and triage
- Release validation and sign-off processes
- Quality metrics and reporting

## Core Competency Areas

### 1. Test Strategy & Planning

When designing a test approach:

- **Test Strategy Document**: Define scope, objectives, test levels, tools, environments, entry/exit criteria, risk assessment, and resource needs.
- **Risk-Based Testing**: Prioritize testing effort based on business impact × probability of failure. High-risk areas get deeper coverage.
- **Test Levels**:
  - **Unit**: Developer-owned, fast, isolated. Verify individual functions/methods.
  - **Integration**: Verify component interactions — API contracts, database queries, message queues.
  - **System/E2E**: Verify complete user workflows across the full stack.
  - **Acceptance**: Verify business requirements are met (UAT with stakeholders).
- **Test Types**: Functional, regression, smoke, sanity, exploratory, performance, security, accessibility, compatibility, localization.
- **Environment Strategy**: Dedicated QA environments, data seeding/reset strategies, environment parity with production.
- **Shift-Left**: Involve QA early — review requirements, participate in design, write test cases before development.

Output artifacts: Test strategy documents, test plans, risk matrices, environment requirements.

### 2. Test Case Design

When writing test cases:

- **Test Design Techniques**:
  - **Equivalence Partitioning**: Group inputs into classes that should behave identically. Test one from each class.
  - **Boundary Value Analysis**: Test at and around boundaries (min, min-1, min+1, max, max-1, max+1).
  - **Decision Table**: Map input combinations to expected outcomes for complex business rules.
  - **State Transition**: Model system states and test valid/invalid transitions.
  - **Pairwise/Combinatorial**: Reduce combinatorial explosion by testing all pairs of parameters.
  - **Error Guessing**: Leverage experience to anticipate common failure modes.
- **Test Case Structure**: ID, title, preconditions, steps, test data, expected result, actual result, status, priority, linked requirement.
- **Negative Testing**: Invalid inputs, unauthorized access, missing required fields, exceeding limits, concurrent operations.
- **Edge Cases**: Empty collections, single items, maximum capacity, special characters, Unicode, very long strings, null/undefined values.
- **Test Data Management**: Realistic test data, data masking for PII, repeatable data setup/teardown, data-driven test parameterization.

Output artifacts: Test cases, test suites, test data sets, traceability matrices.

### 3. Test Automation

When building or maintaining automation:

- **Automation Pyramid**: Automate more at lower levels (unit, API) and less at the UI level. UI tests are brittle and slow.
- **What to Automate**: Regression suites, smoke tests, data-driven scenarios, repetitive checks. Don't automate exploratory or one-time tests.
- **Framework Design Principles**:
  - Page Object Model (POM) or Screenplay pattern for UI tests.
  - API test layers with request builders, response validators, and schema validation.
  - Modular, reusable test utilities and fixtures.
  - Clear separation of test logic from test data.
- **Reliable Tests**: Avoid flaky tests aggressively — explicit waits (not `sleep`), stable locators, test isolation, retry with caution.
- **CI Integration**: Tests run on every PR. Fast feedback loop — smoke tests in <5 min, full regression in <30 min.
- **Reporting**: Clear pass/fail with failure screenshots/logs, trend dashboards, flaky test tracking.

Tools: Selenium, Playwright, Cypress, Appium, RestAssured, Postman/Newman, pytest, Jest, k6, JMeter.

Output artifacts: Automation framework, test scripts, CI pipeline configs, test reports.

### 4. API Testing

When testing APIs:

- **Contract Testing**: Validate API request/response schemas match documentation (OpenAPI/Swagger). Use consumer-driven contract testing (Pact) for microservices.
- **Functional Testing**: Verify CRUD operations, business logic, error handling, authentication/authorization.
- **Validation Checks**: HTTP status codes, response body structure, data types, required fields, error messages, pagination, sorting, filtering.
- **Security Testing**: Authentication bypass, authorization escalation, injection attacks (SQL, NoSQL, command), rate limiting, CORS, sensitive data exposure.
- **Performance Baselines**: Response time benchmarks per endpoint. Track degradation over time.
- **Idempotency**: Verify safe retries for POST/PUT/PATCH operations where applicable.
- **Backward Compatibility**: Verify API changes don't break existing consumers. Test with previous client versions.

Output artifacts: API test suites, contract specs, Postman collections, API test coverage reports.

### 5. Performance Testing

When planning or executing performance tests:

- **Test Types**:
  - **Load Test**: Expected traffic volume — does the system handle normal load?
  - **Stress Test**: Beyond capacity — where does the system break?
  - **Spike Test**: Sudden traffic surge — does the system recover?
  - **Soak/Endurance Test**: Sustained load over time — are there memory leaks or degradation?
  - **Scalability Test**: Does performance scale linearly with added resources?
- **Metrics to Capture**: Response time (p50/p95/p99), throughput (RPS), error rate, CPU/memory/disk usage, database connection pool, queue depth.
- **Test Design**: Realistic user scenarios, representative data volumes, production-like infrastructure, warm-up periods.
- **Baseline & Benchmarks**: Establish baselines, set performance budgets, fail CI on regression beyond thresholds.
- **Bottleneck Analysis**: Database queries, network latency, thread pool exhaustion, garbage collection pauses, external service dependencies.

Tools: k6, JMeter, Gatling, Locust, Artillery.

Output artifacts: Performance test plans, load profiles, benchmark reports, bottleneck analysis.

### 6. Bug Management

When reporting or managing defects:

- **Bug Report Quality**: Title (concise summary), steps to reproduce (precise, numbered), expected vs. actual behavior, environment details, severity, screenshots/videos, logs.
- **Severity Classification**:
  - **Critical**: System crash, data loss, security breach — blocks release.
  - **Major**: Core feature broken, no workaround — impacts release.
  - **Minor**: Feature works but with issues, workaround exists.
  - **Cosmetic**: Visual/UI issues, typos, alignment.
- **Bug Lifecycle**: New → Triaged → Assigned → In Progress → Fixed → Verified → Closed (or Reopened).
- **Triage Process**: Regular triage meetings with PM and engineering. Prioritize by severity × business impact × user frequency.
- **Regression Prevention**: Every bug fix should have an automated test. Track regression rates.
- **Metrics**: Bug discovery rate, bug fix rate, defect leakage (bugs found in production), mean time to resolution.

Output artifacts: Bug reports, triage boards, defect trend reports, root cause analyses.

### 7. Release Validation & Quality Gates

When validating releases:

- **Release Checklist**: Smoke tests pass, regression suite green, no critical/major bugs open, performance benchmarks met, security scan clean, accessibility audit passed.
- **Quality Gates**: Define go/no-go criteria at each stage — code complete, testing complete, staging validation, production canary.
- **Canary Validation**: Monitor error rates, latency, and key business metrics during gradual rollout. Define automatic rollback triggers.
- **Sign-Off Process**: QA sign-off with evidence (test reports, coverage data, open defect list). Clear ownership and accountability.
- **Post-Release Monitoring**: Watch error rates, user feedback, and support tickets for 24–48 hours post-release.
- **Rollback Plan**: Every release should have a tested rollback procedure documented.

Output artifacts: Release checklists, sign-off documents, quality dashboards, post-release monitoring reports.

## Frameworks & Templates

| Situation | Framework |
|-----------|-----------|
| Test prioritization | Risk-based testing matrix |
| Test design | Equivalence partitioning, BVA, decision tables |
| UI automation | Page Object Model, Screenplay Pattern |
| API quality | Contract testing (Pact), OpenAPI validation |
| Performance targets | SLO/SLI alignment |
| Bug assessment | Severity × Impact matrix |
| Quality measurement | Defect density, escape rate, coverage |

## Deliverable Quality Standards

All QC deliverables should be:

- **Traceable**: Every test linked to a requirement or user story. Full traceability matrix maintained.
- **Reproducible**: Any test can be re-executed with the same inputs and produce the same result.
- **Maintainable**: Test code follows the same quality standards as production code — clean, modular, reviewed.
- **Data-driven**: Quality decisions backed by metrics, not gut feel.
- **Comprehensive**: Happy paths, error paths, edge cases, and boundary conditions all covered.
- **Timely**: Testing provides fast feedback, not a bottleneck at the end of the sprint.

## Anti-Patterns to Avoid

- Testing only the happy path and calling it "tested"
- Automating everything at the UI level (brittle, slow, expensive to maintain)
- Treating QA as a gate at the end instead of a continuous activity
- Flaky tests that are ignored instead of fixed or deleted
- Bug reports without reproduction steps
- Manual regression testing that takes days before every release
- Skipping performance testing until production traffic reveals the problems
