import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  Lab,
  DemoProvider,
  LiveProvider,
  memoryDraft,
  storeDraft,
  digest,
  safeError,
} from "../src/server/lab.js";
import {
  STORE_PLAN,
  MEMORY_PLAN,
  REVISION,
  BETA,
} from "../src/shared/lesson.js";
async function setup() {
  const lab = new Lab({ demo: new DemoProvider() });
  let s = await lab.perform("demo", "create-store", { draft: STORE_PLAN });
  const storeId = s.stores[0].id;
  s = await lab.perform("demo", "create-memory", {
    storeId,
    draft: MEMORY_PLAN,
    approved: true,
  });
  return {
    lab,
    storeId,
    memoryId: s.selectedMemory!.id,
    hash: s.selectedMemory!.content_sha256,
  };
}
test("validates reviewed text, descriptive paths and obvious credential patterns", () => {
  assert.throws(() => storeDraft({ name: "", description: "x" }));
  assert.throws(() => memoryDraft(MEMORY_PLAN, false));
  for (const path of ["../data.md", "/a/../data.md", "/key.txt"])
    assert.throws(() => memoryDraft({ ...MEMORY_PLAN, path }, true));
  assert.throws(() =>
    memoryDraft({ ...MEMORY_PLAN, content: "password=example" }, true),
  );
  assert.equal(memoryDraft(MEMORY_PLAN, true).path, MEMORY_PLAN.path);
});
test("owns stores per mode and enforces memory/version parent lineage", async () => {
  const { lab, storeId, memoryId } = await setup();
  const s = await lab.perform("demo", "create-store", {
    draft: { ...STORE_PLAN, name: "Other" },
  });
  const other = s.stores.at(-1)!.id;
  await assert.rejects(
    lab.perform("demo", "retrieve-memory", { storeId: other, memoryId }),
  );
  await assert.rejects(
    lab.perform("demo", "retrieve-store", { storeId: "foreign" }),
  );
  await lab.perform("demo", "list-versions", { storeId, memoryId });
  await assert.rejects(
    lab.perform("demo", "retrieve-version", {
      storeId,
      memoryId,
      versionId: "foreign",
    }),
  );
  assert.equal(lab.states.live.stores.length, 0);
});
test("content hash rejects stale differing writes; retrieval enables deliberate retry", async () => {
  const { lab, storeId, memoryId, hash } = await setup();
  await lab.perform("demo", "peer-update", { storeId, memoryId });
  assert.equal(lab.states.demo.selectedMemory!.content_sha256, hash);
  await assert.rejects(
    lab.perform("demo", "update-memory", {
      storeId,
      memoryId,
      expectedHash: hash,
      draft: { ...MEMORY_PLAN, content: REVISION },
      approved: true,
    }),
    /Conflict/,
  );
  await lab.perform("demo", "retrieve-memory", { storeId, memoryId });
  const s = await lab.perform("demo", "update-memory", {
    storeId,
    memoryId,
    expectedHash: lab.states.demo.selectedMemory!.content_sha256,
    draft: { ...MEMORY_PLAN, content: REVISION },
    approved: true,
  });
  assert.equal(s.selectedMemory!.content_sha256, digest(REVISION));
});
test("basic list omits text and no-op update does not create another version", async () => {
  const { lab, storeId, memoryId, hash } = await setup();
  let s = await lab.perform("demo", "list-memories", { storeId, limit: 1 });
  assert.equal(s.memories[storeId][0].content, null);
  await lab.perform("demo", "update-memory", {
    storeId,
    memoryId,
    expectedHash: hash,
    draft: MEMORY_PLAN,
    approved: true,
  });
  s = await lab.perform("demo", "list-versions", { storeId, memoryId });
  assert.equal(s.versions[storeId].length, 1);
  assert.equal(s.versions[storeId][0].content, null);
});
test("redaction rejects current head and scrubs only the selected historical snapshot", async () => {
  const { lab, storeId, memoryId, hash } = await setup();
  let s = await lab.perform("demo", "list-versions", { storeId, memoryId });
  const versionId = s.versions[storeId][0].id;
  await assert.rejects(
    lab.perform("demo", "redact-version", {
      storeId,
      memoryId,
      versionId,
      confirm: `REDACT ${versionId}`,
    }),
    /current head/,
  );
  await lab.perform("demo", "update-memory", {
    storeId,
    memoryId,
    expectedHash: hash,
    draft: { ...MEMORY_PLAN, content: REVISION },
    approved: true,
  });
  s = await lab.perform("demo", "redact-version", {
    storeId,
    memoryId,
    versionId,
    confirm: `REDACT ${versionId}`,
  });
  for (const field of [
    "content",
    "path",
    "content_sha256",
    "content_size_bytes",
  ] as const)
    assert.equal(s.selectedVersion![field], null);
  assert.ok(s.selectedVersion!.created_by);
  assert.equal(s.selectedMemory!.content, REVISION);
  assert.ok(!JSON.stringify(s.traces).includes(MEMORY_PLAN.content));
  assert.ok(!JSON.stringify(s.traces).includes(MEMORY_PLAN.path));
});
test("guarded memory deletion retains a readable historical lineage", async () => {
  const { lab, storeId, memoryId, hash } = await setup();
  await assert.rejects(
    lab.perform("demo", "delete-memory", {
      storeId,
      memoryId,
      expectedHash: "0".repeat(64),
      confirm: `DELETE ${memoryId}`,
    }),
  );
  let s = await lab.perform("demo", "delete-memory", {
    storeId,
    memoryId,
    expectedHash: hash,
    confirm: `DELETE ${memoryId}`,
  });
  assert.equal(s.memories[storeId].length, 0);
  assert.equal(s.versions[storeId][0].operation, "deleted");
  const versionId = s.versions[storeId].at(-1)!.id;
  s = await lab.perform("demo", "retrieve-version", {
    storeId,
    memoryId,
    versionId,
  });
  assert.equal(s.selectedVersion!.content, MEMORY_PLAN.content);
});
test("one-way archive prevents writes but permits reads and confirmed deletion", async () => {
  const { lab, storeId, memoryId } = await setup();
  await assert.rejects(
    lab.perform("demo", "archive-store", { storeId, confirm: "yes" }),
  );
  await lab.perform("demo", "archive-store", {
    storeId,
    confirm: `ARCHIVE ${storeId}`,
  });
  await assert.rejects(
    lab.perform("demo", "create-memory", {
      storeId,
      draft: { ...MEMORY_PLAN, path: "/other.md" },
      approved: true,
    }),
  );
  await lab.perform("demo", "retrieve-memory", { storeId, memoryId });
  const s = await lab.perform("demo", "delete-store", {
    storeId,
    confirm: `DELETE ${storeId}`,
  });
  assert.equal(s.stores.length, 0);
  assert.equal(s.memories[storeId], undefined);
  assert.equal(s.versions[storeId], undefined);
});
test("registry saves only IDs, reloads ownership and serializes concurrent operations", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lesson9-")),
    provider = new DemoProvider(),
    lab = new Lab({ live: provider }, dir);
  const first = lab.perform("live", "create-store", { draft: STORE_PLAN });
  await assert.rejects(
    lab.perform("live", "create-store", { draft: STORE_PLAN }),
    /in progress/,
  );
  const s = await first;
  assert.deepEqual(
    JSON.parse(await readFile(join(dir, "stores.json"), "utf8")),
    [s.stores[0].id],
  );
  const restored = new Lab({ live: provider }, dir);
  await restored.load();
  assert.equal(
    (await restored.perform("live", "list-stores", {})).stores.length,
    1,
  );
  assert.ok(!safeError(new Error("private-text")).includes("private-text"));
});
test("official SDK sends memory beta alone, scoped hash guards and follows cursor pages", async () => {
  const calls: {
    path: string;
    query: URLSearchParams;
    body: Record<string, unknown>;
    beta: string | null;
  }[] = [];
  const m = {
    id: "mem1",
    type: "memory",
    memory_store_id: "store1",
    memory_version_id: "v1",
    path: MEMORY_PLAN.path,
    content: MEMORY_PLAN.content,
    content_sha256: digest(MEMORY_PLAN.content),
    content_size_bytes: 100,
    created_at: "now",
    updated_at: "now",
  };
  const client = new Anthropic({
    apiKey: "test-key",
    maxRetries: 0,
    fetch: async (input, init) => {
      const req = new Request(input, init),
        url = new URL(req.url),
        raw = await req.text();
      calls.push({
        path: url.pathname,
        query: url.searchParams,
        body: JSON.parse(raw || "{}"),
        beta: req.headers.get("anthropic-beta"),
      });
      const data =
        req.method === "GET"
          ? {
              data: [
                {
                  ...m,
                  id: url.searchParams.has("page") ? "mem2" : "mem1",
                  content: null,
                },
              ],
              next_page: url.searchParams.has("page") ? null : "page2",
            }
          : m;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  const provider = new LiveProvider(client);
  await provider.updateMemory(
    "store1",
    "mem1",
    { ...MEMORY_PLAN, content: REVISION },
    m.content_sha256,
  );
  assert.deepEqual(calls[0].body.precondition, {
    type: "content_sha256",
    content_sha256: m.content_sha256,
  });
  assert.equal(calls[0].path, "/v1/memory_stores/store1/memories/mem1");
  assert.deepEqual([...new Set(calls[0].beta?.split(","))], [BETA]);
  assert.equal((await provider.listMemories("store1", 1)).length, 2);
  assert.equal(calls.at(-1)!.query.get("page"), "page2");
});
