# Teaching Lesson 09

Start with store, memory and version. Ask which object contains current text and which describes a prior change. Contrast appropriate course conventions with Lesson 8’s authentication values.

Run the demo walkthrough. Inspect three distinct identifiers and the loaded hash. Compare the current text’s troubleshooting requirement with the earlier snapshot. Expand the ID-only timeline and explain why document text is omitted.

Simulate a peer edit. Change the draft and apply a guarded update to trigger conflict. Retrieve current text, review the peer note, then submit the intended revision. Explain that the precondition checks content rather than every possible version or path-only change. A no-op need not produce another version.

Create a second store and switch back. Select a current record deliberately; basic listings omit content. Discuss workspace boundaries versus organizational labels, and why session access is explicit at creation. Shared reference context can use read_only access. This lab creates no runtime sessions.

Open the API view. All 14 method cards and five configuration cards have highlighted examples. Compare actual camelCase SDK namespaces and content-hash preconditions with the slide examples. Do not add unsupported memory metadata, if_version or unarchive calls.

Follow the eight UML steps. Redaction and retirement are separate optional branches. Inspect a historical snapshot, then in demo confirm its redaction. Observe scrubbed fields and retained audit identity. Explain why a live current head cannot be redacted.

Delete the current memory using its loaded hash. The lineage remains selected for historical inspection even though the current document is gone. Explain service retention and why version history is not a permanent archive.

Archive the store deliberately: there is no undo. Reads, memory deletion and historical redaction remain possible, while new writes/attachments are blocked. A separate confirmed store deletion removes its memories and versions. Archival before deletion is this app’s extra guard. Prior exports remain outside these actions.

Finish with six questions and the practical challenge. Live management is optional and was not exercised in development; it requires authorized access and approved non-sensitive text. Pattern checks cannot determine confidentiality.
