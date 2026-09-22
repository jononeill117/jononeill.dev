# Versioning

One rule everywhere: [SemVer](https://semver.org/), `MAJOR.MINOR.PATCH`,
shown as `v1.4.2` in the footer of every web product.

- **PATCH** (1.4.x): bug fixes, copy changes, performance, chores. Bumped
  automatically on every production deploy. Nobody decides this, the pipeline
  does it.
- **MINOR** (1.x.0): new user-facing features. A deliberate step in the
  release, never automatic.
- **MAJOR** (x.0.0): breaking changes or launch milestones. Decided by Jon or
  the release captain, never automatic.
- **0.x.y**: pre-launch. **1.0.0**: the public launch line.

## Enforcement

1. Each app keeps a `VERSION` file at its root.
2. `scripts/bump-version.sh [patch|minor|major] [path]` (default: patch)
   bumps it. Never edit a VERSION file by hand.
3. The deploy pipeline runs the bump before shipping and commits the bumped
   VERSION back with `[skip ci]`, so the repo stays the source of truth.
4. The footer renders `v{version}` with a tooltip showing the git commit SHA
   and build time.

A version number never goes backwards. Ever.
