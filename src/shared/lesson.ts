import type { BetaManagedAgentsMemoryStore } from "@anthropic-ai/sdk/resources/beta/memory-stores/memory-stores";
import type { BetaManagedAgentsMemory } from "@anthropic-ai/sdk/resources/beta/memory-stores/memories";
import type { BetaManagedAgentsMemoryVersion } from "@anthropic-ai/sdk/resources/beta/memory-stores/memory-versions";
export type Store = BetaManagedAgentsMemoryStore;
export type Memory = BetaManagedAgentsMemory;
export type Version = BetaManagedAgentsMemoryVersion;
export type Mode = "demo" | "live";
export const SDK_VERSION = "1.6.0",
  BETA = "agent-memory-2026-07-22";
export interface StoreDraft {
  name: string;
  description: string;
}
export interface MemoryDraft {
  path: string;
  content: string;
}
export interface State {
  mode: Mode;
  stores: Store[];
  memories: Record<string, Memory[]>;
  versions: Record<string, Version[]>;
  selectedMemory: Memory | null;
  selectedVersion: Version | null;
  traces: {
    action: string;
    request: unknown;
    result: unknown;
    explanation: string;
  }[];
}
export const STORE_PLAN: StoreDraft = {
  name: "Course conventions",
  description:
    "Approved non-sensitive conventions for practical course examples.",
};
export const MEMORY_PLAN: MemoryDraft = {
  path: "/course/conventions.md",
  content:
    "# Course conventions\n\nUse TypeScript examples. Explain every identifier and show expected output. Use ISO 8601 dates.",
};
export const REVISION =
  "# Course conventions\n\nUse TypeScript examples. Explain every identifier and show expected output. Use ISO 8601 dates. Include one troubleshooting exercise per lesson.";
const beta = 'betas: ["agent-memory-2026-07-22"]';
export const METHODS = [
  {
    name: "Create store",
    path: "client.beta.memoryStores.create",
    description:
      "Create the workspace-scoped container. Description is visible to agents when attached; metadata is organizational.",
    snippet: `const store = await client.beta.memoryStores.create({ name: "Course conventions", description: "Approved course guidance", ${beta} });`,
  },
  {
    name: "Retrieve store",
    path: "client.beta.memoryStores.retrieve",
    description: "Read container configuration, not a memory record.",
    snippet: `await client.beta.memoryStores.retrieve(storeId, { ${beta} });`,
  },
  {
    name: "Update store",
    path: "client.beta.memoryStores.update",
    description:
      "Change name, description or metadata. This does not edit memory content.",
    snippet: `await client.beta.memoryStores.update(storeId, { description: "Reviewed conventions", ${beta} });`,
  },
  {
    name: "List stores",
    path: "client.beta.memoryStores.list",
    description:
      "Follow all pages; include archived explicitly. This app filters to its registered IDs.",
    snippet: `for await (const store of client.beta.memoryStores.list({ limit: 2, include_archived: true, ${beta} })) console.log(store.id);`,
  },
  {
    name: "Archive store",
    path: "client.beta.memoryStores.archive",
    description:
      "One-way archival. No unarchive exists. Reads, memory deletion and historical redaction remain possible; new attachments and writes are blocked.",
    snippet: `await client.beta.memoryStores.archive(storeId, { ${beta} });`,
  },
  {
    name: "Delete store",
    path: "client.beta.memoryStores.delete",
    description:
      "Permanently remove the store, memories and versions. This app first requires archival and separate exact-ID confirmation.",
    snippet: `await client.beta.memoryStores.delete(storeId, { ${beta} });`,
  },
  {
    name: "Create memory",
    path: "client.beta.memoryStores.memories.create",
    description:
      "Create focused UTF-8 text at a descriptive absolute path. Memory creation has no metadata field in this SDK.",
    snippet: `const memory = await client.beta.memoryStores.memories.create(storeId, { path: "/course/conventions.md", content: "Use ISO 8601 dates.", view: "full", ${beta} });`,
  },
  {
    name: "Retrieve memory",
    path: "client.beta.memoryStores.memories.retrieve",
    description:
      "Use memory ID plus parent store. Retain the returned hash for a guarded write.",
    snippet: `const memory = await client.beta.memoryStores.memories.retrieve(memoryId, { memory_store_id: storeId, view: "full", ${beta} });`,
  },
  {
    name: "Update memory",
    path: "client.beta.memoryStores.memories.update",
    description:
      "Use a content_sha256 precondition, not the slide’s if_version. A stale differing update fails with 409; refresh and review rather than overwriting.",
    snippet: `await client.beta.memoryStores.memories.update(memoryId, { memory_store_id: storeId, content: revisedText, precondition: { type: "content_sha256", content_sha256: loadedHash }, view: "full", ${beta} });`,
  },
  {
    name: "List memories",
    path: "client.beta.memoryStores.memories.list",
    description:
      "Basic view omits content. A directory prefix ends with slash. depth 1 may return memory_prefix rows, not memory IDs.",
    snippet: `for await (const item of client.beta.memoryStores.memories.list(storeId, { path_prefix: "/course/", depth: 0, view: "basic", limit: 2, ${beta} })) console.log(item.type, item.path);`,
  },
  {
    name: "Delete memory",
    path: "client.beta.memoryStores.memories.delete",
    description:
      "Guard deletion with the loaded hash. Retained versions survive deletion; a deleted version records the event.",
    snippet: `await client.beta.memoryStores.memories.delete(memoryId, { memory_store_id: storeId, expected_content_sha256: loadedHash, ${beta} });`,
  },
  {
    name: "List versions",
    path: "client.beta.memoryStores.memoryVersions.list",
    description:
      "Versions belong to a store. Filter by memory_id, including deleted lineage; basic lists omit content.",
    snippet: `for await (const version of client.beta.memoryStores.memoryVersions.list(storeId, { memory_id: memoryId, view: "basic", limit: 2, ${beta} })) console.log(version.id, version.operation);`,
  },
  {
    name: "Retrieve version",
    path: "client.beta.memoryStores.memoryVersions.retrieve",
    description:
      "Retrieve a specific version using version ID and store parent. Historical text is read for review, not automatically restored.",
    snippet: `await client.beta.memoryStores.memoryVersions.retrieve(versionId, { memory_store_id: storeId, view: "full", ${beta} });`,
  },
  {
    name: "Redact version",
    path: "client.beta.memoryStores.memoryVersions.redact",
    description:
      "Scrub historical content, path, hash and byte count while retaining audit identity. The current head of a live memory cannot be redacted.",
    snippet: `await client.beta.memoryStores.memoryVersions.redact(versionId, { memory_store_id: storeId, ${beta} });`,
  },
];
export const FIELDS = [
  {
    name: "Use one memory beta",
    path: BETA,
    description:
      "Pass the memory beta explicitly on every memory request. Do not combine it with the Managed Agents session beta.",
    snippet: `const memoryOptions = { betas: ["agent-memory-2026-07-22"] };\n// Session endpoints separately use managed-agents-2026-04-01.`,
  },
  {
    name: "Attach at session creation",
    path: "resources[].memory_store_id",
    description:
      "Creating a store grants no automatic session access. Attach during session creation; read_only limits agent writes. This lab only shows the configuration.",
    snippet:
      'const session = await client.beta.sessions.create({ agent: agentId, environment_id: environmentId, resources: [{ type: "memory_store", memory_store_id: storeId, access: "read_only", instructions: "Consult course conventions." }] });\n// Example only; no session is created by this lab.',
  },
  {
    name: "Store, memory, version",
    path: "memory_store_id → memory_id → memory_version_id",
    description:
      "The container, current text record and historical snapshot have distinct identifiers. Read the actual resource mount_path from a created session.",
    snippet:
      "const link = { storeId, memoryId: memory.id, headVersionId: memory.memory_version_id };",
  },
  {
    name: "Inspect before editing",
    path: "precondition.content_sha256",
    description:
      "The hash protects content against a differing stale write. It is not a universal version lock: path-only races and no-op behavior need separate consideration.",
    snippet:
      "const loadedHash = memory.content_sha256;\n// On 409: retrieve again, review the differences, and resubmit deliberately.",
  },
  {
    name: "Knowledge versus credentials",
    path: "Memory text ≠ secret storage",
    description:
      "Only approved non-sensitive teaching facts belong here. Pattern checks are a limited classroom guard, not a data-loss-prevention system. Vaults are covered in Lesson 8.",
    snippet:
      'const approvedContext = "Examples use TypeScript and ISO 8601 dates.";\n// API keys, passwords and provider tokens belong in a credential mechanism.',
  },
];
export const QUESTIONS = [
  {
    question: "Which object holds the current text?",
    options: ["Memory store metadata", "Memory", "API key"],
    answer: 1,
    explanation:
      "A memory is a text document inside its parent store; versions record its changes.",
  },
  {
    question: "Which precondition does the pinned SDK support?",
    options: ["if_version", "revision_number", "content_sha256"],
    answer: 2,
    explanation:
      "Use precondition.type content_sha256 with the loaded content hash; handle a differing stale write as a conflict.",
  },
  {
    question: "Can an archived store be unarchived?",
    options: [
      "No; archival is one-way",
      "Yes, update its name",
      "Yes, attach it again",
    ],
    answer: 0,
    explanation:
      "There is no unarchive endpoint. Reads, deletion and supported redaction remain possible.",
  },
  {
    question: "Can the current live head version be redacted?",
    options: [
      "Always",
      "Only with if_version",
      "No; first write a new version or delete the memory",
    ],
    answer: 2,
    explanation:
      "Redaction targets eligible historical versions and retains audit information.",
  },
  {
    question: "Does creating a store attach it to every session?",
    options: [
      "Yes",
      "No; use resources at session creation",
      "Only when metadata names an environment",
    ],
    answer: 1,
    explanation:
      "The session needs an explicit store resource. A read_only reference is appropriate for shared conventions.",
  },
  {
    question: "Does memory deletion erase all retained versions?",
    options: [
      "No; retained lineage survives",
      "Yes, immediately",
      "Only basic-view versions",
    ],
    answer: 0,
    explanation:
      "Historical versions can remain after the current record is deleted. Store deletion removes the store and its memories and versions.",
  },
];
