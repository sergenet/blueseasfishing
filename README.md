# blueseasfishing

Blue Seas Fishing website workspace. The deployable site is
`blueseas-fishing-working-website/blueseasfishing.com`; everything else here is the
tooling that builds, translates and uploads it.

## Layout

| Path | What it is |
|---|---|
| `blueseas-fishing-working-website/blueseasfishing.com` | the site that gets deployed |
| `api/` | PHP API endpoints (subscribers, admin, forum) |
| `Assets/`, `Email/`, `logs/` | source assets, email templates, deploy logs |
| `internal-docs/` | project notes (Play Console progress, submissions) |
| `pre-multilang-backup/` | snapshot before the language rollout |
| `tools/` | page generators, i18n build, SEO verifiers |
| `_attic/` | retired scripts, backups, one-off bundles |
| `_api-inspect/` | scratch inspection output |
| `projects/` | **one folder per site/app — start at `projects/README.md`** |

## Deploy scripts

`deploy-site.py`, `deploy-zip.py`, `zip-deploy.py` and `deploy-dirs-zip.py` compute
the site path from their own location, so they must stay in this directory.
`deploy.py` holds the FTP credentials they share.

## Where the other sites live

Garden with Serge, TimerHaven, NexusCut, NewGiftsAndGadgets and LA Senior Services
each keep their own folder outside this workspace; `projects/` links to all of them,
and cross-site audit/planning documents are in `projects/_shared/`.
