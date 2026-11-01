# Storyforest workflow

- The user requires completed changes to be pushed to `main` at https://github.com/simon11006/storyforest every time. Do not ask again for routine commits or pushes. Verify the remote commit after pushing; never force-push.
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
- Only the administrator manages memberships and creates/deletes classes or assigns `teacherEmail`. Teachers manage books/submissions only for their assigned classes. Enforce this in both Firestore and Storage rules, not just the UI.
- Students submit without a visible login flow using Firebase anonymous authentication. Class metadata and exhibited book records are publicly readable. Pending uploads live under `incoming/{classId}/{uid}` and are private to the submitter and class managers. Classes default to `autoPublish: false`. Class managers can enable direct student publishing; otherwise only managers approve submissions. Published Storage objects have `metadata.slot` and are publicly readable only while the corresponding book document references their exact path. Pending submissions remain private. Never make the whole bucket publicly readable.
- The previous Hosting site redirects to the current one. Deploy its redirect configuration with `firebase deploy --only hosting --config firebase-legacy.json --project fairytale-94bbd` when needed.
