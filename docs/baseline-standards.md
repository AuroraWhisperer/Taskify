# Baseline Standards Evidence Notes

## Test Coverage

Coursework requirement: minimum 80% test coverage proven through a Codecov or Istanbul badge.

Implementation:

- `npm test` runs the Node.js built-in test suite.
- `npm run coverage` runs source-only coverage for `src/**/*.js` and fails below 80% line coverage.
- `npm run coverage:lcov` writes `coverage/lcov.info` for Codecov upload.
- `.github/workflows/coverage.yml` runs coverage on GitHub Actions with a MongoDB service and uploads the lcov report to Codecov through the `CODECOV_TOKEN` repository secret.
- `codecov.yml` sets an 80% project coverage target for Codecov status checks.
- `README.md` includes the Codecov badge for the fork repository.

Latest local verification on 2026-05-03:

- Tests: 45 passed, 0 failed.
- Source-only line coverage: 89.22%.
- Source-only branch coverage: 83.28%.
- Source-only function coverage: 95.35%.

Report evidence to capture after the workflow runs on GitHub:

- Codecov badge showing coverage above 80%.
- GitHub Actions coverage workflow passing.
- Codecov page or report detail showing the uploaded `coverage/lcov.info`.

Manual verification boundary:

- The repository must be pushed to GitHub before the badge can show a real value.
- If Codecov upload fails, confirm that the repository has an Actions secret named exactly `CODECOV_TOKEN`, then rerun the Coverage workflow.
