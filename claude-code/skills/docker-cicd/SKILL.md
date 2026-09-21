---
name: docker-cicd
description: >
  Docker multi-stage builds, image hardening, and CI/CD pipeline security patterns
  (GitHub Actions / GitLab CI). Trigger: working with Dockerfiles, docker-compose,
  or CI workflow YAML.
metadata:
  version: "2026-baseline"
  last_reviewed: "2026-09"
---

# Docker & CI/CD — 2026 Baseline

## Multi-stage build shape

```dockerfile
# Build stage — full toolchain, discarded from the final image
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                 # manifest copied + installed BEFORE source, for layer caching
COPY . .
RUN npm run build

# Runtime stage — minimal, hardened
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 nodejs && adduser -S nodeuser -u 1001
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
USER nodeuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node healthcheck.js || exit 1
CMD ["node", "dist/server.js"]
```

## Base image choice

| Image | Use when |
|---|---|
| **Alpine/slim** | Default safe choice — small, has a shell for debugging |
| **Distroless** | Hardened production — no shell, no package manager. Health checks must be app-level (a tiny script/binary the app exposes), not `curl`/`wget` based, since there's no shell to run them. Pair with a `:nonroot` tag. |
| **scratch** | Only for fully static binaries (e.g. a Go binary with no dynamic deps) |

## Layer caching rule

Always copy dependency manifests (`package.json` + lockfile) and install *before*
copying the rest of the source. Otherwise every source change invalidates the
dependency-install layer and every build reinstalls from scratch.

## `.dockerignore` (always)

```
node_modules
.env*
!.env.example
dist
build
.git
*.test.ts
```

## Secrets

- Never bake secrets into a Dockerfile `ENV`/`ARG` (they persist in image layers/history).
- Use BuildKit `--secret` for build-time secrets, and CI-injected env vars or a
  secrets manager for runtime — the repo only ever contains `.env.example`.

## CI/CD security baseline (GitHub Actions / GitLab CI, 2026)

- **Pin third-party Actions to a full commit SHA**, not a tag or branch — tags are
  mutable and a compromised tag is a supply-chain attack vector.
  ```yaml
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
  ```
- **OIDC over static credentials** for cloud deploy steps — no long-lived cloud
  access keys sitting in repo secrets when the provider supports federated auth.
- **Least-privilege `permissions:`** set at the job level, not a blanket
  `permissions: write-all` at the workflow level.
- **Never run `pull_request_target` against untrusted/forked-PR code** without
  explicit review gating — that trigger runs with access to repo secrets against
  attacker-controlled code otherwise.
- Enable secret scanning + push protection on the repository.
- Sign container images (e.g. Cosign) when the deploy target can verify signatures.
- GitHub's 2026 direction is toward workflow lockfiles (SHA-pinning transitive
  Action dependencies) and centralized execution policy — treat as "coming," verify
  current enforcement rather than assuming it's already mandatory on a given repo.

## Minimum pipeline shape

```
lint → test → build → deploy
```

Each stage gates the next — don't deploy an artifact that skipped test, even under
time pressure; that's exactly when a bad deploy is expensive.

## Checklist before calling infra work "done"

- [ ] Multi-stage build; final image doesn't contain build-only tooling
- [ ] Runtime stage runs as non-root
- [ ] Image digest pinned (not just tag) for reproducibility
- [ ] `.dockerignore` excludes secrets, `node_modules`, VCS metadata
- [ ] `docker build` actually run and verified locally
- [ ] CI Actions pinned to SHA; least-privilege `permissions:` set
