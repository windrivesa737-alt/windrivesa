# WinDriveSA — GitHub Setup

## Recommended repository
`windrivesa-reward-platform`

## Publish with GitHub Desktop
1. Install GitHub Desktop from https://desktop.github.com/ if it is not installed.
2. Sign in to the GitHub account that should own the repository.
3. Choose **File → Add local repository**.
4. Select this project folder (`windrivesa-github`).
5. If GitHub Desktop says it is not a Git repository, choose the option to create a repository for it.
6. Set the repository name to `windrivesa-reward-platform`.
7. Keep the repository **Private**.
8. Add a first commit such as `Initial WinDriveSA Stitch handoff`.
9. Click **Publish repository**.
10. Confirm the repository is private on GitHub.

## Google AI Studio
In Google AI Studio Build mode, use the GitHub import option and select the repository. Then give AI Studio the master implementation prompt supplied separately.

## Important source-of-truth rules
- `stitch-reference/` contains only the 22 approved Stitch screen references.
- Do not restore excluded/obsolete Stitch iterations.
- `DESIGN.md` and `AI_STUDIO_HANDOFF.md` are authoritative project instructions.
- The current `src/` is an intentionally small React/Vite scaffold. AI Studio should implement the actual application using the approved references.
- Supabase is intentionally not configured yet.
