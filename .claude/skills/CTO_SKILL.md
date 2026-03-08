---
name: cto-skill
description: Chief Technology Officer skill for technical strategy, architecture decisions, engineering culture, platform scalability, security posture, and technology leadership. Use when the user needs help with system design, tech stack selection, engineering org scaling, technical due diligence, build vs. buy decisions, or CTO-level technology governance.
---

# CTO — Chief Technology Officer Skill

A comprehensive skill for operating at the Chief Technology Officer level — spanning technical strategy, architecture, engineering excellence, and technology-driven business outcomes.

## Role Context

The CTO bridges business objectives with technical execution. This skill helps with:

- Setting technical vision and architecture strategy
- Making build vs. buy vs. open-source decisions
- Designing scalable, secure, and resilient systems
- Building and scaling high-performing engineering organizations
- Managing technical debt strategically
- Evaluating emerging technologies for business impact
- Leading technical due diligence (M&A, partnerships, vendors)

## Core Competency Areas

### 1. Technical Vision & Strategy

When defining or refining technology strategy:

- **Technology Radar**: Categorize technologies into Adopt, Trial, Assess, Hold quadrants for the organization.
- **Architecture Principles**: Establish guiding principles (e.g., API-first, event-driven, cloud-native, zero-trust).
- **Platform Thinking**: Identify opportunities to build internal platforms that accelerate product delivery.
- **Innovation Pipeline**: Balance production stability with exploration — dedicate capacity for R&D, spikes, and proof-of-concepts.
- **Alignment with Business**: Map every major technical initiative to a business outcome — infrastructure investments need ROI narratives.

Output artifacts: Technology strategy docs, architecture decision records (ADRs), tech radar, innovation charters.

### 2. System Architecture & Design

When designing or reviewing architectures:

- **Architecture Styles**: Select and justify approaches — microservices vs. modular monolith vs. serverless vs. hybrid — based on team size, scale, and complexity.
- **Non-Functional Requirements**: Define targets for latency (p50/p95/p99), throughput, availability (SLA/SLO/SLI), durability, and consistency.
- **Data Architecture**: Design data flows, storage strategies (OLTP vs. OLAP), event sourcing, CQRS, and data mesh patterns where appropriate.
- **Integration Patterns**: API gateways, message brokers, service meshes, circuit breakers, retry/backoff strategies.
- **Scalability**: Horizontal vs. vertical scaling, caching layers, CDN strategy, database sharding, read replicas.
- **Disaster Recovery**: RPO/RTO targets, multi-region failover, chaos engineering practices.

Output artifacts: Architecture diagrams (C4 model), ADRs, system design documents, capacity plans.

### 3. Security & Compliance

When addressing security posture:

- **Security by Design**: Threat modeling (STRIDE), secure SDLC, shift-left security practices.
- **Identity & Access**: Zero-trust architecture, OAuth 2.0/OIDC flows, RBAC/ABAC, service-to-service auth (mTLS).
- **Data Protection**: Encryption at rest and in transit, key management, PII handling, data classification.
- **Compliance Frameworks**: SOC 2, GDPR, HIPAA, PCI-DSS — map controls to engineering practices.
- **Incident Response**: Runbooks, on-call rotations, post-incident reviews (blameless), severity classification.
- **Supply Chain Security**: Dependency scanning, SBOM, container image signing, secure CI/CD pipelines.

Output artifacts: Security architecture docs, threat models, compliance matrices, incident response playbooks.

### 4. Engineering Organization & Culture

When building or scaling engineering teams:

- **Team Structure**: Stream-aligned teams, platform teams, enabling teams, complicated-subsystem teams (Team Topologies).
- **Engineering Ladder**: IC track (Engineer → Senior → Staff → Principal → Distinguished) and management track (TL → EM → Director → VP).
- **Developer Experience (DX)**: CI/CD pipeline speed, local dev environment quality, documentation, internal tooling.
- **Engineering Metrics**: DORA metrics (deployment frequency, lead time, change failure rate, MTTR), developer satisfaction surveys.
- **Culture Pillars**: Psychological safety, blameless post-mortems, knowledge sharing (tech talks, RFCs, guilds), code review culture.
- **Hiring**: Technical interview design, rubrics, bar-raiser programs, onboarding playbooks.

Output artifacts: Org design proposals, career ladders, DX improvement plans, hiring guides.

### 5. Technical Debt & Quality

When managing technical health:

- **Debt Classification**: Categorize as deliberate/accidental × prudent/reckless (Martin Fowler's quadrant).
- **Debt Inventory**: Maintain a living register of known debt with severity, blast radius, and estimated remediation cost.
- **Investment Strategy**: Allocate 15–25% of engineering capacity to debt reduction, infrastructure, and tooling.
- **Quality Gates**: Automated testing pyramid (unit → integration → e2e), code coverage targets, static analysis, linting.
- **Observability**: Structured logging, distributed tracing, metrics dashboards, alerting hygiene.

Output artifacts: Tech debt registers, quality scorecards, observability blueprints.

### 6. Cloud & Infrastructure Strategy

When planning infrastructure:

- **Cloud Strategy**: Multi-cloud vs. single cloud, cloud-native vs. lift-and-shift, FinOps practices.
- **Infrastructure as Code**: Terraform, Pulumi, or CloudFormation — GitOps workflows, drift detection.
- **Container Orchestration**: Kubernetes strategy, service mesh, pod autoscaling, resource quotas.
- **Cost Optimization**: Reserved instances, spot/preemptible instances, right-sizing, tagging strategy for cost allocation.
- **Edge & CDN**: Content delivery, edge compute, regional deployment strategies.

Output artifacts: Cloud architecture diagrams, IaC templates, cost optimization reports, migration plans.

### 7. Emerging Technology Evaluation

When assessing new technologies:

- **AI/ML Strategy**: Build vs. buy ML capabilities, LLM integration patterns, responsible AI guidelines, MLOps pipelines.
- **Evaluation Framework**: Proof of concept criteria, production readiness checklist, risk assessment.
- **Build vs. Buy Matrix**: Total cost of ownership analysis including maintenance burden, talent availability, and strategic differentiation.
- **Vendor Assessment**: Technical evaluation rubrics, reference architecture validation, contract/SLA review.

Output artifacts: Technology evaluation reports, POC plans, build-vs-buy analyses, vendor scorecards.

## Frameworks & Templates

| Situation | Framework |
|-----------|-----------|
| Architecture decisions | ADR (Architecture Decision Records), C4 Model |
| Team structure | Team Topologies (Skelton & Pais) |
| Engineering health | DORA Metrics, SPACE Framework |
| Security assessment | STRIDE, OWASP Top 10 |
| Technology evaluation | ThoughtWorks Tech Radar model |
| Incident management | Severity levels + blameless post-mortem |
| Scaling decisions | AKF Scale Cube |
| Migration planning | Strangler Fig Pattern, Branch by Abstraction |

## Deliverable Quality Standards

All CTO-level deliverables should be:

- **Decision-oriented**: Present options with trade-offs, not just descriptions of the current state.
- **Risk-aware**: Every recommendation should include risks, mitigations, and rollback strategies.
- **Quantified**: Include estimates for cost, timeline, resource needs, and expected impact.
- **Multi-audience**: Technical depth for engineers, business translation for executives.
- **Living documents**: Architecture docs and strategies should be versioned and periodically reviewed.

## Anti-Patterns to Avoid

- Resume-driven development (choosing technologies for novelty, not fit)
- Big-bang rewrites instead of incremental migration
- Ignoring developer experience in pursuit of architectural purity
- Security as an afterthought bolted on before launch
- Over-engineering for scale that may never arrive
- Hero culture and single points of knowledge failure
