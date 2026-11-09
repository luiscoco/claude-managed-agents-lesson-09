# Validation

Nine domain tests cover draft approval/path/credential-pattern checks, owned-store and lineage scope, differing stale-write conflicts and retry, basic-view omission and no-op history, historical redaction versus current head, retained history after guarded memory deletion, one-way archival and store deletion, ID-only registry reload/concurrency, and official SDK request construction with scoped hashes, the memory beta alone, and multi-page cursor iteration.

Ten production-browser checks cover five workflows on desktop and mobile Chromium: formatted current/historical context; peer-edit conflict and deliberate retry; redaction/deletion/archival; second-store isolation and all 19 highlighted cards; UML steps, quiz feedback, keyboard tabs and larger text. Screenshots document the main views.

No real Anthropic management request, session, inference, tool execution, redaction or deletion was performed. SDK tests use a mocked transport. Actual feature access, service retention, runtime mounts, provider availability and permissions require separate validation with authorized credentials. Pattern guards are not DLP. Cloud records remain untouched by these checks.
