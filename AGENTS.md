# Storyforest workflow

- The user requires completed changes to be pushed to `main` at https://github.com/simon11006/storyforest every time. Do not ask again for routine commits or pushes. Verify the remote commit after pushing; never force-push.
- After every completed application change, validate it, push it to GitHub `main` through the sync workflow below, and immediately deploy it to the existing Firebase production site. Both the push and the deployment are required; do not stop after editing locally or completing only one of them. Verify the remote commit and the deployed application before reporting completion. These routine pushes and deployments are already authorized; do not ask for confirmation again.
- The GitHub repository is public. Student PDFs, extracted PDF chunks, student cover images, private backups, credentials, and logs must not enter its history. Keep student content in the existing Firebase project `fairytale-94bbd` and the owner-private Sites deployment.
- This checkout also contains private bundled book samples and its history must not be pushed directly to public GitHub. Use `node sync-github.mjs` to sync application source into the sibling `storyforest-github` checkout, commit there, and push its `main` branch. The script preserves the GitHub checkout history and rejects unexpected remotes. Public `dist/books.json` is intentionally an empty sample catalog.
- Keep the existing Sites project ID and audience. For site changes, follow the Sites publishing workflow as well as the GitHub push requirement. Merely syncing GitHub or updating workflow documentation does not require a Sites redeploy.
- Validate application changes with `npm run build`, `npm run check`, and `node tests.mjs` as appropriate. Use the bundled Node 24 runtime for Sites packaging on this Windows host; Node 25 has crashed during recursive filesystem packaging.

## Firebase Hosting

- The user selected Firebase Hosting for the production deployment on 2026-11-01. Production URL: https://fairytale2026.web.app (project `fairytale-94bbd`, Hosting site `fairytale2026`). Use Firebase for future production updates; keep the former owner-private Sites deployment unchanged unless requested.
- Deploy with `firebase deploy --only hosting --project fairytale-94bbd`. Its predeploy hook builds `.firebase-hosting` with `prepare-hosting.mjs`. Never point Firebase Hosting directly at the private `dist` directory.
- Public Hosting contains application assets and an empty `books.json`. Student works stay in Firebase Storage. Published works are publicly readable; pending submissions remain private. Management remains role-scoped.
- GitHub pushes are required but do not themselves deploy Firebase; no GitHub Actions deployment credential has been configured.

## School permissions

- `endeavor1006@naver.com` is the protected super administrator (`members/{email}.role = admin`). Email verification is still required; never bypass it or change the user's password.
- Teacher sign-up is self-service: every non-anonymous account with a verified email may create a class without administrator registration or approval, including existing accounts. Legacy teacher/student membership records do not gate teacher access; only existing administrator records confer administrator privileges and clients cannot write membership records. Do not restore the manual membership management UI. Only the administrator assigns/reassigns `teacherEmail`. Verified teachers may create a class assigned to their own email and delete their own class, including all exhibited/retained books, submissions, and associated Storage files, after an explicit confirmation in the UI. Cascade deletion first marks the class as deleting and closes submissions; delete Storage files and child documents before the class document so interrupted deletion can be retried. Teachers manage books/submissions only for their assigned classes. Enforce ownership in Firestore and Storage rules, not just the UI.
- Students submit without a visible login flow using Firebase anonymous authentication. Class metadata and exhibited book records are publicly readable. Pending uploads live under `incoming/{classId}/{uid}` and are private to the submitter and class managers. Classes default to `autoPublish: false`. Class managers can enable direct student publishing; otherwise only managers approve submissions. Published Storage objects have `metadata.slot` and are publicly readable only while the corresponding book document references their exact path. Pending submissions remain private. Never make the whole bucket publicly readable.
- The previous Hosting site redirects to the current one. Deploy its redirect configuration with `firebase deploy --only hosting --config firebase-legacy.json --project fairytale-94bbd` when needed.

## Classroom appearance

- Keep twelve automatic forest-only classroom variants: three restrained variations of each of the spring, summer/temperate, autumn, and tropical forest families. Do not restore space, planets, ocean or coral themes. Use seasonal foliage and tree species (flowering broadleaf, oak, birch, pine, maple, ginkgo, palm, banana and rainforest trees). Tree canopies must remain above book covers. Preserve the common library architecture and walking routes. Select the family and variant deterministically from the immutable class ID, so renaming, revisiting, or adding another class does not change an existing classroom. Keep family assignment independent of the variant count. Vary accent colors, foliage, display-frame tops, and ceiling motifs without changing exhibition capacity or book access.

## Teacher navigation

- After verified teacher login, show the teacher management home with an owned-class selector, classroom creation, and a visible logout action. Open the sole assigned classroom automatically; require an explicit management choice when there are multiple owned classes. Visiting another teacher’s public classroom must not expose its management UI. All-class navigation uses a native dropdown rather than a card grid. Keep logout in the sticky management header and clear private management UI after sign-out.

- On refresh or home navigation, preserve authentication but show the class-selection lobby; never automatically open management merely because a saved teacher/admin session was restored. Open management only following an explicit management/login action. This supersedes automatic management landing for restored sessions.

- Persist class themeId at creation: randomly choose among the least represented forest families, then their least-used variants. Existing assigned themeId must survive rename, new classes and reloads. Legacy ID hashing is a fallback only. The user authorized a one-time balanced migration of existing classrooms on 2026-11-02.

- Assigned teachers and administrators may explicitly change themeId through Our Class Management. Persist the choice, preserve it on unrelated settings saves, and keep automatic balancing only for newly created classes.
