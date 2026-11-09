import Anthropic from "@anthropic-ai/sdk";
process.loadEnvFile();
const client = new Anthropic({ maxRetries: 0 });
const betas = ["agent-memory-2026-07-22"];
const store = await client.beta.memoryStores.create({
  name: "Course conventions example",
  description: "Approved non-sensitive course guidance.",
  betas,
});
const memory = await client.beta.memoryStores.memories.create(store.id, {
  path: "/course/conventions.md",
  content: "Use ISO 8601 dates.",
  view: "full",
  betas,
});
const revised = await client.beta.memoryStores.memories.update(memory.id, {
  memory_store_id: store.id,
  content: "Use ISO 8601 dates and TypeScript examples.",
  precondition: {
    type: "content_sha256",
    content_sha256: memory.content_sha256,
  },
  view: "full",
  betas,
});
console.log({
  storeId: store.id,
  memoryId: memory.id,
  headVersionId: revised.memory_version_id,
});
for await (const version of client.beta.memoryStores.memoryVersions.list(
  store.id,
  { memory_id: memory.id, view: "basic", betas },
))
  console.log({ versionId: version.id, operation: version.operation });
// Deliberately leaves the real store in place. No session, inference, redaction or deletion.
