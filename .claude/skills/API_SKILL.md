---
name: api-dev-skill
description: API Developer skill for designing, building, and maintaining robust APIs. Use when the user needs help with REST API design, GraphQL schema design, API versioning, authentication/authorization, rate limiting, API documentation, webhook systems, or API gateway configuration.
---

# API — API Developer Skill

A comprehensive skill for API development — spanning API design, implementation, security, documentation, versioning, and operational excellence.

## Role Context

The API Developer designs and builds the contracts that connect systems, teams, and products. This skill helps with:

- Designing intuitive, consistent RESTful and GraphQL APIs
- Implementing authentication, authorization, and rate limiting
- Writing comprehensive API documentation (OpenAPI/Swagger)
- Versioning strategies and backward compatibility
- Webhook and event-driven API patterns
- API gateway configuration and management
- Performance optimization and caching strategies
- API testing and contract validation

## Core Competency Areas

### 1. API Design Principles

When designing APIs:

- **Design-First Approach**: Write the API spec (OpenAPI/GraphQL schema) before writing code. Review with consumers before implementation.
- **Consistency**: Uniform naming conventions, consistent error formats, predictable URL structures, standard HTTP methods across all endpoints.
- **REST Naming Conventions**:
  - Resources are nouns, plural: `/users`, `/orders`, `/products`.
  - Hierarchical relationships: `/users/{id}/orders`.
  - Actions as sub-resources when CRUD doesn't fit: `/orders/{id}/cancel` (POST).
  - Query parameters for filtering, sorting, pagination: `?status=active&sort=-created_at&page=2&limit=20`.
- **HTTP Methods**:
  - `GET` — Read (safe, idempotent, cacheable).
  - `POST` — Create (not idempotent by default).
  - `PUT` — Full replace (idempotent).
  - `PATCH` — Partial update (idempotent).
  - `DELETE` — Remove (idempotent).
- **HTTP Status Codes**: Use correctly and consistently:
  - `200` OK, `201` Created, `204` No Content.
  - `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `422` Unprocessable Entity, `429` Too Many Requests.
  - `500` Internal Server Error, `502` Bad Gateway, `503` Service Unavailable.
- **Response Envelope**: Consistent structure across all endpoints:
  ```json
  {
    "data": { ... },
    "meta": { "page": 1, "total": 100 },
    "errors": []
  }
  ```

### 2. Authentication & Authorization

When securing APIs:

- **Authentication Patterns**:
  - **OAuth 2.0 / OIDC**: For user-facing APIs. Use Authorization Code + PKCE for SPAs/mobile. Client Credentials for service-to-service.
  - **API Keys**: For server-to-server integrations. Transmit in headers (not URLs). Rotate regularly.
  - **JWT**: Stateless auth tokens. Keep payloads small. Set reasonable expiry. Use refresh tokens for long sessions.
  - **mTLS**: For high-security service-to-service communication.
- **Authorization Patterns**:
  - **RBAC** (Role-Based): Users have roles, roles have permissions.
  - **ABAC** (Attribute-Based): Policy engine evaluates user/resource/environment attributes.
  - **Scope-Based**: OAuth scopes limit token capabilities (`read:users`, `write:orders`).
- **Security Headers**: `Authorization: Bearer <token>`, never in query params. `X-API-Key` for API key auth.
- **Token Validation**: Verify signature, issuer, audience, expiration, and required scopes on every request.

### 3. Pagination, Filtering & Sorting

When implementing data retrieval:

- **Pagination Strategies**:
  - **Offset-Based**: `?page=3&limit=20` — simple, but skips can be expensive on large datasets.
  - **Cursor-Based**: `?cursor=abc123&limit=20` — performant for large datasets, stable under concurrent writes.
  - **Keyset-Based**: `?after_id=500&limit=20` — efficient for sequential data.
- **Pagination Response**: Include total count (if feasible), next/prev cursors, links to next/prev/first/last pages (HATEOAS).
- **Filtering**: Field-based: `?status=active&role=admin`. Range: `?created_after=2024-01-01`. Search: `?q=search+term`.
- **Sorting**: `?sort=created_at` (ascending), `?sort=-created_at` (descending). Support multi-field: `?sort=-priority,created_at`.
- **Field Selection**: Sparse fieldsets for bandwidth optimization: `?fields=id,name,email`.
- **Rate Limiting on Expensive Queries**: Limit max page size, restrict deep pagination, enforce query complexity limits.

### 4. Error Handling & Validation

When handling errors:

- **Error Response Format** (RFC 7807 / Problem Details):
  ```json
  {
    "type": "https://api.example.com/errors/validation",
    "title": "Validation Error",
    "status": 422,
    "detail": "The 'email' field must be a valid email address.",
    "instance": "/users",
    "errors": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Must be a valid email address"
      }
    ]
  }
  ```
- **Validation**: Validate at the edge (request middleware). Return all validation errors at once, not one at a time.
- **Error Codes**: Machine-readable error codes alongside human-readable messages. Consumers should switch on codes, not messages.
- **Idempotency Keys**: For non-idempotent operations (POST), accept an `Idempotency-Key` header to prevent duplicates.
- **Retry Guidance**: Include `Retry-After` header on `429` and `503` responses. Document retry strategies.
- **Sensitive Data**: Never expose stack traces, internal paths, database errors, or infrastructure details in API responses.

### 5. API Versioning & Evolution

When versioning APIs:

- **Versioning Strategies**:
  - **URL Path**: `/v1/users` — most common, explicit, easy to route.
  - **Header**: `Accept: application/vnd.api.v2+json` — cleaner URLs, harder to test casually.
  - **Query Param**: `?version=2` — simple but pollutes the URL.
- **Backward Compatibility Rules**:
  - **Safe changes** (non-breaking): Adding new fields, new endpoints, new optional parameters.
  - **Breaking changes** (new version required): Removing fields, renaming fields, changing types, changing required/optional status.
- **Deprecation Strategy**: Announce deprecation with timeline (minimum 6 months), add `Sunset` and `Deprecation` headers, provide migration guide, monitor deprecated endpoint usage.
- **API Changelog**: Maintain a public changelog documenting all changes per version.
- **Contract Testing**: Consumer-driven contracts (Pact) to verify changes don't break existing consumers.

### 6. API Documentation

When documenting APIs:

- **OpenAPI Specification**: Write OpenAPI 3.1 specs with complete schemas, examples, descriptions, and error responses.
- **Documentation Essentials**:
  - **Getting Started Guide**: Authentication setup, first API call, common patterns.
  - **Endpoint Reference**: Method, URL, parameters, request/response bodies, status codes, examples.
  - **Authentication Guide**: How to obtain and use credentials, token lifecycle, scopes.
  - **Error Reference**: All error codes with descriptions and resolution steps.
  - **Rate Limiting**: Limits per endpoint/tier, headers returned, handling 429s.
  - **Webhooks**: Available events, payload schemas, verification, retry policy.
  - **SDKs & Code Examples**: Snippets in 3–5 popular languages.
- **Interactive Docs**: Swagger UI, Redoc, or Stoplight for try-it-out functionality.
- **Changelog & Migration Guides**: Version-by-version changes with code examples for migration.

Output artifacts: OpenAPI specs, developer portal content, SDK documentation, migration guides.

### 7. Webhooks & Event APIs

When implementing event-driven APIs:

- **Webhook Design**:
  - Event types: `resource.action` format (e.g., `order.created`, `payment.failed`).
  - Payload: Include event type, timestamp, resource data, and API version.
  - Signature: HMAC-SHA256 signature in headers for payload verification.
- **Delivery Guarantees**: At-least-once delivery. Consumers must handle duplicate events (idempotent processing).
- **Retry Policy**: Exponential backoff with jitter. Maximum retry attempts (e.g., 5 retries over 24 hours). Dead letter queue for failed deliveries.
- **Consumer Management**: Registration API, event type subscription, delivery logs, manual replay capability.
- **Security**: Verify signatures, validate timestamps (reject old events), use HTTPS endpoints only, IP allowlisting.
- **Testing**: Provide a webhook testing endpoint or CLI tool for consumers to validate their integration.

### 8. Rate Limiting & Throttling

When implementing rate limiting:

- **Rate Limit Types**:
  - **Per-API-Key**: Overall limit per consumer.
  - **Per-Endpoint**: Different limits for read vs. write operations.
  - **Per-User**: Rate limiting within a single API key.
- **Algorithms**: Token bucket (bursty traffic), sliding window (smooth limiting), fixed window (simple).
- **Response Headers**:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 950
  X-RateLimit-Reset: 1640000000
  Retry-After: 30
  ```
- **Tiered Limits**: Different limits per pricing tier. Document clearly per plan.
- **Graceful Degradation**: Return `429 Too Many Requests` with `Retry-After` header. Don't silently drop requests.

## Frameworks & Templates

| Situation | Framework/Tool |
|-----------|----------------|
| API spec | OpenAPI 3.1, AsyncAPI (for events) |
| Documentation | Swagger UI, Redoc, Stoplight |
| Contract testing | Pact, Schemathesis |
| API gateway | Kong, AWS API Gateway, Apigee |
| Rate limiting | Redis-based (token bucket) |
| Authentication | OAuth 2.0, Auth0, Keycloak |
| Monitoring | API analytics, Datadog APM |
| SDK generation | OpenAPI Generator, Speakeasy |

## Deliverable Quality Standards

All API deliverables should be:

- **Spec-first**: OpenAPI or GraphQL schema written and reviewed before implementation.
- **Consistent**: Uniform naming, error formats, pagination, and authentication across all endpoints.
- **Documented**: Every endpoint has descriptions, examples, error codes, and rate limit information.
- **Backward-compatible**: Non-breaking changes by default. Breaking changes go through versioning process.
- **Secure**: Authentication on every endpoint, authorization checks, input validation, no sensitive data leakage.
- **Observable**: Request logging, latency tracking, error rate monitoring, usage analytics per consumer.
- **Tested**: Unit tests, integration tests, contract tests, and load tests for all endpoints.

## Anti-Patterns to Avoid

- Verbs in URLs (`/getUser`, `/createOrder`) — use HTTP methods instead
- Inconsistent response formats across endpoints
- Returning 200 OK with error body instead of proper HTTP status codes
- Exposing internal database IDs or implementation details
- No pagination on list endpoints (returning unbounded results)
- Breaking changes without versioning or deprecation notice
- Documentation that's out of sync with the actual API behavior
- Over-fetching: returning entire objects when consumers need 2 fields
- Missing rate limiting — one consumer can take down the API for everyone
