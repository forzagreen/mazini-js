# mazini-js

## Releasing

Every release gets a GitHub Release with a description; the Python port
([forzagreen/mazini](https://github.com/forzagreen/mazini)) is released alongside it with the same
version when the API changes.

1. Bump `version` in `package.json` and `package-lock.json` (edit the line; `npm version` reformats
   `package.json`). Open a "Release X.Y.Z" PR and merge it once CI is green.
2. Run the **Release** workflow (`.github/workflows/release.yml`, `workflow_dispatch`) with `notes` set to
   the description. It creates tag `vX.Y.Z` and the GitHub Release, then runs `publish.yml` on the tag,
   which publishes to npm with provenance.
3. Notes follow the earlier releases: what is new (API first, then the demo), what stayed unchanged,
   `npm install mazini@X.Y.Z`, and a Full Changelog compare link from the previous tag.
4. Check `npm view mazini version`.
