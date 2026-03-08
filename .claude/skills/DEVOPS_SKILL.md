---
name: devops-skill
description: DevOps Engineer skill for CI/CD pipelines, infrastructure automation, container orchestration, monitoring, cloud operations, and site reliability. Use when the user needs help with deployment automation, infrastructure as code, Kubernetes, Docker, observability, incident response, or operational excellence.
---

# DEV OPS — DevOps Engineer Skill

A comprehensive skill for DevOps engineering — spanning CI/CD, infrastructure as code, container orchestration, observability, security operations, and reliability engineering.

## Role Context

The DevOps Engineer bridges development and operations, enabling fast, reliable, and secure software delivery. This skill helps with:

- Designing and maintaining CI/CD pipelines
- Automating infrastructure provisioning and management
- Container orchestration and service mesh configuration
- Monitoring, alerting, and observability stack setup
- Incident response and reliability engineering
- Cloud cost optimization and FinOps
- Security hardening and compliance automation

## Core Competency Areas

### 1. CI/CD Pipeline Design

When building or optimizing delivery pipelines:

- **Pipeline Stages**: Lint → Build → Unit Test → Integration Test → Security Scan → Artifact Publish → Deploy (Staging) → Smoke Test → Deploy (Production) → Verify.
- **Pipeline Principles**: Fast feedback (fail early), parallelization, caching (dependencies, Docker layers), idempotent stages.
- **Branching Strategy**: Trunk-based development with short-lived feature branches. Avoid long-lived branches and merge hell.
- **Deployment Strategies**: Blue-green, canary, rolling, feature flags. Choose based on risk tolerance and rollback requirements.
- **Artifact Management**: Immutable artifacts, semantic versioning, container image tagging (avoid `latest`), signed artifacts.
- **Pipeline Security**: No secrets in code, secret injection via vault/secrets manager, minimal pipeline permissions, audit trails.

Tools: GitHub Actions, GitLab CI, Jenkins, CircleCI, ArgoCD, Flux, Tekton.

Output artifacts: Pipeline configs (YAML), deployment runbooks, release process docs.

### 2. Infrastructure as Code (IaC)

When provisioning or managing infrastructure:

- **IaC Principles**: Declarative over imperative, idempotent, version controlled, peer reviewed, tested.
- **State Management**: Remote state with locking (S3 + DynamoDB, GCS + Cloud Storage). State isolation per environment.
- **Module Design**: Reusable, composable modules with clear input/output contracts. Semantic versioning for shared modules.
- **Environment Parity**: Dev, staging, and production should be structurally identical — differ only in scale and configuration.
- **Drift Detection**: Automated drift detection with scheduled plan/diff runs. Alert on unmanaged changes.
- **Testing IaC**: Static analysis (tflint, checkov), plan review, integration tests with ephemeral environments.

Tools: Terraform, OpenTofu, Pulumi, AWS CDK, CloudFormation, Ansible, Crossplane.

Output artifacts: Terraform modules, IaC repos, environment provisioning docs.

### 3. Container Orchestration

When working with containers and Kubernetes:

- **Dockerfile Best Practices**: Multi-stage builds, minimal base images (distroless/alpine), non-root users, layer caching, `.dockerignore`.
- **Kubernetes Resources**: Deployments, StatefulSets, DaemonSets, Jobs/CronJobs — choose the right workload type.
- **Resource Management**: Set requests and limits, implement HPA/VPA, define PodDisruptionBudgets, use resource quotas per namespace.
- **Networking**: Services (ClusterIP, NodePort, LoadBalancer), Ingress controllers, NetworkPolicies, service mesh (Istio/Linkerd) for mTLS and traffic management.
- **Configuration**: ConfigMaps for non-sensitive config, Secrets (encrypted at rest) for sensitive data, external-secrets-operator for vault integration.
- **Health Checks**: Liveness probes (restart on deadlock), readiness probes (remove from LB), startup probes (slow-starting apps).
- **GitOps**: ArgoCD or Flux for declarative, git-driven deployments. App-of-apps pattern for multi-service management.

Output artifacts: Helm charts, Kustomize overlays, Kubernetes manifests, GitOps repo structures.

### 4. Observability & Monitoring

When building or improving observability:

- **Three Pillars**: Metrics (aggregated numerical data), Logs (discrete events), Traces (request flow across services).
- **Metrics Strategy**: RED method for services (Rate, Errors, Duration), USE method for resources (Utilization, Saturation, Errors).
- **Logging**: Structured JSON logs, correlation IDs, log levels (DEBUG/INFO/WARN/ERROR), centralized aggregation, retention policies.
- **Distributed Tracing**: OpenTelemetry instrumentation, trace propagation headers, span attributes for context.
- **Alerting**: Alert on symptoms not causes, reduce alert fatigue, severity classification (page vs. ticket vs. log), runbook links in every alert.
- **Dashboards**: Golden signals dashboard per service, SLO burn rate dashboards, on-call overview dashboards.
- **SLOs/SLIs**: Define service level objectives (e.g., 99.9% availability, p99 latency < 200ms), measure with SLIs, alert on error budget burn.

Tools: Prometheus, Grafana, Datadog, ELK/OpenSearch, Jaeger, Honeycomb, PagerDuty, OpsGenie.

Output artifacts: Dashboard configs, alerting rules, SLO definitions, on-call playbooks.

### 5. Security Operations (DevSecOps)

When hardening infrastructure and pipelines:

- **Supply Chain Security**: Dependency scanning (Dependabot, Snyk), container image scanning (Trivy, Grype), SBOM generation.
- **Infrastructure Security**: CIS benchmarks, least-privilege IAM, network segmentation, WAF configuration.
- **Secrets Management**: HashiCorp Vault, AWS Secrets Manager, or cloud-native KMS. Rotate secrets automatically. Never commit secrets to git.
- **Compliance as Code**: Policy enforcement with OPA/Rego, Kyverno, or Sentinel. Automated compliance checks in CI.
- **Access Control**: RBAC for Kubernetes and cloud resources, just-in-time access, audit logging for all administrative actions.
- **Vulnerability Management**: Regular scanning cadence, SLA for remediation by severity (critical: 24h, high: 7d, medium: 30d).

Output artifacts: Security policies, compliance reports, vulnerability remediation plans.

### 6. Incident Response & Reliability

When managing incidents or improving reliability:

- **Incident Classification**: Severity levels (SEV1–SEV4) with clear definitions, escalation paths, and communication templates.
- **Incident Workflow**: Detect → Triage → Mitigate → Resolve → Post-mortem. Assign incident commander for SEV1/SEV2.
- **Post-Mortems**: Blameless, focused on systemic causes, with concrete action items (owners + deadlines).
- **Chaos Engineering**: Controlled failure injection (Chaos Monkey, Litmus, Gremlin) to validate resilience assumptions.
- **Runbooks**: Step-by-step operational procedures for common incidents. Automate runbooks where possible.
- **Capacity Planning**: Load testing, traffic modeling, auto-scaling policies, headroom budgets.

Output artifacts: Incident response playbooks, post-mortem templates, chaos experiment plans, capacity models.

### 7. Cloud Cost Optimization (FinOps)

When managing cloud spend:

- **Tagging Strategy**: Mandatory tags for environment, team, service, cost-center. Enforce via policies.
- **Right-Sizing**: Analyze utilization data to downsize over-provisioned resources.
- **Commitment Discounts**: Reserved Instances, Savings Plans, committed-use discounts — based on steady-state baseline.
- **Spot/Preemptible**: Use for fault-tolerant workloads (batch processing, CI runners, dev environments).
- **Cost Visibility**: Per-team, per-service cost dashboards. Monthly cost reviews with engineering leads.
- **Waste Elimination**: Automated detection of idle resources, orphaned volumes, unused load balancers.

Output artifacts: Cost reports, optimization recommendations, tagging policies, cleanup automation scripts.

## Frameworks & Templates

| Situation | Framework |
|-----------|-----------|
| Deployment risk | Deployment strategies decision matrix |
| Monitoring design | RED/USE methods |
| Reliability targets | SLO/SLI/Error Budget |
| Incident management | Severity levels + IC rotation |
| Security posture | CIS Benchmarks, NIST CSF |
| Cost management | FinOps maturity model |
| Platform design | Team Topologies (platform teams) |

## Deliverable Quality Standards

All DevOps deliverables should be:

- **Automated**: Manual steps are bugs. If it's done more than twice, automate it.
- **Reproducible**: Any environment can be torn down and rebuilt from code.
- **Observable**: Every system has metrics, logs, and traces. Every alert has a runbook.
- **Secure by default**: Least privilege, encrypted, scanned, and auditable.
- **Documented**: READMEs, runbooks, architecture diagrams, and decision records.
- **Cost-conscious**: Tagged, right-sized, and regularly reviewed.

## Anti-Patterns to Avoid

- Snowflake servers configured manually and never documented
- YAML-driven development without understanding what configs actually do
- Alert storms from threshold-based alerts instead of symptom-based ones
- "It works on my machine" — no environment parity
- Overly complex pipelines that take 45+ minutes for basic changes
- Using Kubernetes for everything (sometimes a VM or serverless is the right call)
- Hardcoded secrets anywhere — environment variables, configs, or source code
