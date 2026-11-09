import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import {
  BETA,
  type Mode,
  type State,
  type Store,
  type Memory,
  type Version,
  type StoreDraft,
  type MemoryDraft,
} from "../shared/lesson.js";
export class LabError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function safeError(e: unknown) {
  if (e instanceof LabError) return e.message;
  if (e instanceof Anthropic.APIError && e.status === 409)
    return "Conflict: stored content changed. Retrieve the current memory, review your draft, and retry deliberately.";
  return "The memory operation failed. Check access, scope and lifecycle state; request content is omitted from this error.";
}
function text(value: unknown, max: number, label: string) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new LabError(`Provide valid ${label} (1–${max} characters).`);
  return value;
}
export function storeDraft(value: unknown): StoreDraft {
  const d = value as StoreDraft;
  return {
    name: text(d?.name, 120, "store name").trim(),
    description: text(d?.description, 1024, "description"),
  };
}
export function memoryDraft(value: unknown, approved: unknown): MemoryDraft {
  const d = value as MemoryDraft;
  if (approved !== true)
    throw new LabError(
      "Confirm that this draft is approved non-sensitive teaching context.",
    );
  const path = text(d?.path, 160, "path");
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.md$/.test(path))
    throw new LabError(
      "Use an absolute descriptive Markdown path, such as /course/conventions.md.",
    );
  const content = text(d?.content, 8000, "memory text");
  if (
    /sk-ant-|ghp_|github_pat_|-----BEGIN .*PRIVATE KEY|(?:api[_ -]?key|password|secret|access[_ -]?token)\s*[:=]\s*\S+/i.test(
      content,
    )
  )
    throw new LabError(
      "Possible credential material detected. Use approved non-sensitive context; credentials belong in a vault.",
    );
  return { path, content };
}
function hash(value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    throw new LabError("Retrieve the memory first to load its content hash.");
  return value;
}
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
const options = { betas: [BETA] };
export interface Provider {
  createStore(d: StoreDraft): Promise<Store>;
  getStore(id: string): Promise<Store>;
  updateStore(id: string, d: StoreDraft): Promise<Store>;
  listStores(ids: Set<string>, limit: number): Promise<Store[]>;
  archiveStore(id: string): Promise<Store>;
  deleteStore(id: string): Promise<unknown>;
  createMemory(s: string, d: MemoryDraft): Promise<Memory>;
  getMemory(s: string, id: string): Promise<Memory>;
  updateMemory(
    s: string,
    id: string,
    d: MemoryDraft,
    h: string,
  ): Promise<Memory>;
  listMemories(s: string, limit: number): Promise<Memory[]>;
  deleteMemory(s: string, id: string, h: string): Promise<unknown>;
  listVersions(s: string, id: string, limit: number): Promise<Version[]>;
  getVersion(s: string, id: string): Promise<Version>;
  redactVersion(s: string, id: string): Promise<Version>;
}
export class LiveProvider implements Provider {
  constructor(private client: Anthropic) {}
  async createStore(d: StoreDraft) {
    return this.client.beta.memoryStores.create({
      ...d,
      metadata: { course: "09" },
      ...options,
    });
  }
  async getStore(id: string) {
    return this.client.beta.memoryStores.retrieve(id, options);
  }
  async updateStore(id: string, d: StoreDraft) {
    return this.client.beta.memoryStores.update(id, { ...d, ...options });
  }
  async listStores(ids: Set<string>, limit: number) {
    const rows: Store[] = [];
    for await (const s of this.client.beta.memoryStores.list({
      limit,
      include_archived: true,
      ...options,
    }))
      if (ids.has(s.id)) rows.push(s);
    return rows;
  }
  async archiveStore(id: string) {
    return this.client.beta.memoryStores.archive(id, options);
  }
  async deleteStore(id: string) {
    return this.client.beta.memoryStores.delete(id, options);
  }
  async createMemory(s: string, d: MemoryDraft) {
    return this.client.beta.memoryStores.memories.create(s, {
      ...d,
      view: "full",
      ...options,
    });
  }
  async getMemory(s: string, id: string) {
    return this.client.beta.memoryStores.memories.retrieve(id, {
      memory_store_id: s,
      view: "full",
      ...options,
    });
  }
  async updateMemory(s: string, id: string, d: MemoryDraft, h: string) {
    return this.client.beta.memoryStores.memories.update(id, {
      memory_store_id: s,
      ...d,
      precondition: { type: "content_sha256", content_sha256: h },
      view: "full",
      ...options,
    });
  }
  async listMemories(s: string, limit: number) {
    const rows: Memory[] = [];
    for await (const m of this.client.beta.memoryStores.memories.list(s, {
      limit,
      depth: 0,
      view: "basic",
      ...options,
    }))
      if (m.type === "memory") rows.push(m);
    return rows;
  }
  async deleteMemory(s: string, id: string, h: string) {
    return this.client.beta.memoryStores.memories.delete(id, {
      memory_store_id: s,
      expected_content_sha256: h,
      ...options,
    });
  }
  async listVersions(s: string, id: string, limit: number) {
    const rows: Version[] = [];
    for await (const v of this.client.beta.memoryStores.memoryVersions.list(s, {
      memory_id: id,
      view: "basic",
      limit,
      ...options,
    }))
      rows.push(v);
    return rows;
  }
  async getVersion(s: string, id: string) {
    return this.client.beta.memoryStores.memoryVersions.retrieve(id, {
      memory_store_id: s,
      view: "full",
      ...options,
    });
  }
  async redactVersion(s: string, id: string) {
    return this.client.beta.memoryStores.memoryVersions.redact(id, {
      memory_store_id: s,
      ...options,
    });
  }
}
export class DemoProvider implements Provider {
  private count = 0;
  private stores = new Map<string, Store>();
  private memories = new Map<string, Memory>();
  private versions = new Map<string, Version>();
  async createStore(d: StoreDraft) {
    const now = new Date().toISOString(),
      s: Store = {
        id: `demo_store_${++this.count}`,
        type: "memory_store",
        ...d,
        metadata: { course: "09" },
        archived_at: null,
        created_at: now,
        updated_at: now,
      };
    this.stores.set(s.id, s);
    return structuredClone(s);
  }
  async getStore(id: string) {
    const s = this.stores.get(id);
    if (!s) throw new LabError("Store not found.");
    return structuredClone(s);
  }
  async updateStore(id: string, d: StoreDraft) {
    const s = await this.getStore(id);
    if (s.archived_at) throw new LabError("Archived stores cannot be edited.");
    Object.assign(s, d, { updated_at: new Date().toISOString() });
    this.stores.set(id, s);
    return structuredClone(s);
  }
  async listStores(ids: Set<string>) {
    return structuredClone(
      [...this.stores.values()].filter((s) => ids.has(s.id)),
    );
  }
  async archiveStore(id: string) {
    const s = await this.getStore(id);
    s.archived_at = new Date().toISOString();
    s.updated_at = s.archived_at;
    this.stores.set(id, s);
    return structuredClone(s);
  }
  async deleteStore(id: string) {
    this.stores.delete(id);
    for (const [key, m] of this.memories)
      if (m.memory_store_id === id) this.memories.delete(key);
    for (const [key, v] of this.versions)
      if (v.memory_store_id === id) this.versions.delete(key);
    return { id, type: "memory_store_deleted" };
  }
  private version(m: Memory, operation: Version["operation"]) {
    const deleted = operation === "deleted",
      id = `demo_version_${++this.count}`;
    const v: Version = {
      id,
      type: "memory_version",
      memory_id: m.id,
      memory_store_id: m.memory_store_id,
      operation,
      created_at: new Date().toISOString(),
      created_by: { type: "api_actor", api_key_id: "demo_key_identifier" },
      content: deleted ? null : m.content,
      path: m.path,
      content_sha256: deleted ? null : m.content_sha256,
      content_size_bytes: deleted ? null : m.content_size_bytes,
      redacted_at: null,
    };
    this.versions.set(id, v);
    m.memory_version_id = id;
    return v;
  }
  async createMemory(s: string, d: MemoryDraft) {
    if ((await this.getStore(s)).archived_at)
      throw new LabError("Archived store is read-only.");
    if (
      [...this.memories.values()].some(
        (m) => m.memory_store_id === s && m.path === d.path,
      )
    )
      throw new LabError("A memory already uses this path.");
    const now = new Date().toISOString(),
      m: Memory = {
        id: `demo_memory_${++this.count}`,
        type: "memory",
        memory_store_id: s,
        ...d,
        content_sha256: digest(d.content),
        content_size_bytes: Buffer.byteLength(d.content),
        memory_version_id: "",
        created_at: now,
        updated_at: now,
      };
    this.version(m, "created");
    this.memories.set(m.id, m);
    return structuredClone(m);
  }
  async getMemory(s: string, id: string) {
    const m = this.memories.get(id);
    if (!m || m.memory_store_id !== s)
      throw new LabError("Memory does not belong to this store.");
    return structuredClone(m);
  }
  async updateMemory(s: string, id: string, d: MemoryDraft, h: string) {
    if ((await this.getStore(s)).archived_at)
      throw new LabError("Archived store is read-only.");
    const m = await this.getMemory(s, id);
    if (m.content === d.content && m.path === d.path) return m;
    if (m.content_sha256 !== h)
      throw new LabError(
        "Conflict: stored content changed. Retrieve the current memory, review your draft, and retry deliberately.",
        409,
      );
    if (
      [...this.memories.values()].some(
        (row) =>
          row.id !== id && row.memory_store_id === s && row.path === d.path,
      )
    )
      throw new LabError("A memory already uses this path.");
    Object.assign(m, d, {
      content_sha256: digest(d.content),
      content_size_bytes: Buffer.byteLength(d.content),
      updated_at: new Date().toISOString(),
    });
    this.version(m, "modified");
    this.memories.set(id, m);
    return structuredClone(m);
  }
  async listMemories(s: string) {
    return structuredClone(
      [...this.memories.values()]
        .filter((m) => m.memory_store_id === s)
        .map((m) => ({ ...m, content: null })),
    );
  }
  async deleteMemory(s: string, id: string, h: string) {
    const m = await this.getMemory(s, id);
    if (m.content_sha256 !== h)
      throw new LabError(
        "Conflict: content changed; retrieve before deleting.",
        409,
      );
    this.version(m, "deleted");
    this.memories.delete(id);
    return { id, type: "memory_deleted" };
  }
  async listVersions(s: string, id: string) {
    return structuredClone(
      [...this.versions.values()]
        .filter((v) => v.memory_store_id === s && v.memory_id === id)
        .reverse()
        .map((v) => ({ ...v, content: null })),
    );
  }
  async getVersion(s: string, id: string) {
    const v = this.versions.get(id);
    if (!v || v.memory_store_id !== s)
      throw new LabError("Version does not belong to this store.");
    return structuredClone(v);
  }
  async redactVersion(s: string, id: string) {
    const v = await this.getVersion(s, id);
    if (this.memories.get(v.memory_id)?.memory_version_id === id)
      throw new LabError(
        "Cannot redact the current head of a live memory. Write a new version or delete the memory first.",
      );
    Object.assign(v, {
      content: null,
      path: null,
      content_sha256: null,
      content_size_bytes: null,
      redacted_at: new Date().toISOString(),
      redacted_by: { type: "api_actor", api_key_id: "demo_key_identifier" },
    });
    this.versions.set(id, v);
    return structuredClone(v);
  }
}
const empty = (mode: Mode): State => ({
  mode,
  stores: [],
  memories: {},
  versions: {},
  selectedMemory: null,
  selectedVersion: null,
  traces: [],
});
export class Lab {
  readonly states = { demo: empty("demo"), live: empty("live") };
  private owned = { demo: new Set<string>(), live: new Set<string>() };
  private known: Record<Mode, Map<string, Set<string>>> = {
    demo: new Map(),
    live: new Map(),
  };
  private busy = new Set<Mode>();
  constructor(
    private providers: Partial<Record<Mode, Provider>>,
    private dir?: string,
  ) {}
  async load() {
    if (!this.dir) return;
    try {
      const data: unknown = JSON.parse(
        await readFile(`${this.dir}/stores.json`, "utf8"),
      );
      if (!Array.isArray(data) || !data.every((x) => typeof x === "string"))
        throw new Error("Invalid registry.");
      this.owned.live = new Set(data);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  private async save() {
    if (!this.dir) return;
    await mkdir(this.dir, { recursive: true });
    await writeFile(
      `${this.dir}/stores.tmp`,
      JSON.stringify([...this.owned.live]),
      { mode: 0o600 },
    );
    await rename(`${this.dir}/stores.tmp`, `${this.dir}/stores.json`);
  }
  private provider(m: Mode) {
    const p = this.providers[m];
    if (!p)
      throw new LabError("Live mode requires a server-side ANTHROPIC_API_KEY.");
    return p;
  }
  private remember(mode: Mode, s: string, id: string) {
    if (!this.known[mode].has(s)) this.known[mode].set(s, new Set());
    this.known[mode].get(s)!.add(id);
  }
  private putStore(state: State, s: Store) {
    state.stores = [...state.stores.filter((row) => row.id !== s.id), s];
  }
  private putMemory(state: State, m: Memory) {
    state.memories[m.memory_store_id] = [
      ...(state.memories[m.memory_store_id] ?? []).filter(
        (row) => row.id !== m.id,
      ),
      m,
    ];
    state.selectedMemory = m;
    this.remember(state.mode, m.memory_store_id, m.id);
  }
  async perform(mode: Mode, action: string, data: Record<string, unknown>) {
    if (this.busy.has(mode))
      throw new LabError("Another memory operation is in progress.");
    this.busy.add(mode);
    try {
      const p = this.provider(mode),
        state = this.states[mode],
        storeId = String(data.storeId ?? ""),
        id = String(data.memoryId ?? ""),
        versionId = String(data.versionId ?? "");
      let result: unknown,
        explanation = "";
      const request: Record<string, unknown> = {
        storeId: storeId || undefined,
        memoryId: id || undefined,
        versionId: versionId || undefined,
      };
      const limit = Number(data.limit ?? 2);
      if (!Number.isInteger(limit) || limit < 1 || limit > 20)
        throw new LabError("Page size must be 1–20.");
      if (action === "create-store") {
        const d = storeDraft(data.draft),
          s = await p.createStore(d);
        this.owned[mode].add(s.id);
        this.putStore(state, s);
        if (mode === "live") await this.save();
        result = { id: s.id, type: s.type };
        explanation =
          "Created a workspace-scoped container; it is not automatically attached to any session.";
      } else if (action === "list-stores") {
        state.stores = await p.listStores(this.owned[mode], limit);
        result = { count: state.stores.length };
        explanation =
          "Followed all pages and retained only this lab’s registered store IDs, including archived stores.";
      } else {
        if (!this.owned[mode].has(storeId))
          throw new LabError(
            "Select a store created by this application and mode.",
          );
        const s = await p.getStore(storeId);
        if (s.id !== storeId)
          throw new LabError("Store response scope mismatch.");
        this.putStore(state, s);
        if (action === "retrieve-store") {
          result = { id: s.id, type: s.type };
          explanation =
            "Read container configuration separately from its text records.";
        } else if (action === "archive-store") {
          if (data.confirm !== `ARCHIVE ${storeId}`)
            throw new LabError("Type ARCHIVE followed by the exact store ID.");
          if (s.archived_at) throw new LabError("Store already archived.");
          this.putStore(state, await p.archiveStore(storeId));
          result = { id: storeId, archived: true };
          explanation =
            "One-way archival: no unarchive exists. Reads, memory deletion and historical redaction remain supported.";
        } else if (action === "delete-store") {
          if (!s.archived_at || data.confirm !== `DELETE ${storeId}`)
            throw new LabError(
              "Archive this store first, then confirm DELETE plus its exact ID.",
            );
          await p.deleteStore(storeId);
          this.owned[mode].delete(storeId);
          this.known[mode].delete(storeId);
          state.stores = state.stores.filter((row) => row.id !== storeId);
          delete state.memories[storeId];
          delete state.versions[storeId];
          state.selectedMemory = null;
          state.selectedVersion = null;
          if (mode === "live") await this.save();
          result = { id: storeId, type: "memory_store_deleted" };
          explanation =
            "Deleted the store and all of its memories and versions. Prior exports and external copies are separate.";
        } else if (action === "update-store") {
          if (s.archived_at)
            throw new LabError("Archived stores cannot be edited.");
          this.putStore(
            state,
            await p.updateStore(storeId, storeDraft(data.draft)),
          );
          result = { id: storeId };
          explanation =
            "Updated the container configuration without editing its memory records.";
        } else if (action === "list-memories") {
          const rows = await p.listMemories(storeId, limit);
          if (rows.some((m) => m.memory_store_id !== storeId))
            throw new LabError("Memory list scope mismatch.");
          state.memories[storeId] = rows;
          rows.forEach((m) => this.remember(mode, storeId, m.id));
          result = { count: rows.length, view: "basic" };
          explanation =
            "Listed all pages in basic view: null content means omitted, not an empty document.";
        } else if (action === "create-memory") {
          if (s.archived_at)
            throw new LabError("Archived stores cannot accept new memories.");
          const d = memoryDraft(data.draft, data.approved),
            m = await p.createMemory(storeId, d);
          if (m.memory_store_id !== storeId)
            throw new LabError("Memory parent mismatch.");
          this.putMemory(state, m);
          result = {
            id: m.id,
            head: m.memory_version_id,
            hash: m.content_sha256,
          };
          explanation =
            "Created reviewed text and its first recorded version. Text is omitted from this timeline.";
        } else {
          if (!this.known[mode].get(storeId)?.has(id))
            throw new LabError(
              "Create or list this store’s memories before selecting a lineage.",
            );
          if (action === "list-versions") {
            const rows = await p.listVersions(storeId, id, limit);
            if (
              rows.some(
                (v) => v.memory_store_id !== storeId || v.memory_id !== id,
              )
            )
              throw new LabError("Version lineage mismatch.");
            state.versions[storeId] = rows;
            state.selectedVersion = null;
            result = { count: rows.length, view: "basic" };
            explanation =
              "Listed the selected memory’s retained history, including deleted lineage; basic view omits text.";
          } else if (
            action === "retrieve-version" ||
            action === "redact-version"
          ) {
            if (
              !(state.versions[storeId] ?? []).some(
                (v) => v.id === versionId && v.memory_id === id,
              )
            )
              throw new LabError(
                "List this lineage’s versions before selecting one.",
              );
            const v = await p.getVersion(storeId, versionId);
            if (v.memory_store_id !== storeId || v.memory_id !== id)
              throw new LabError("Version response scope mismatch.");
            if (action === "redact-version") {
              if (data.confirm !== `REDACT ${versionId}`)
                throw new LabError(
                  "Type REDACT followed by the exact version ID.",
                );
              const redacted = await p.redactVersion(storeId, versionId);
              state.versions[storeId] = state.versions[storeId].map((row) =>
                row.id === versionId ? redacted : row,
              );
              state.selectedVersion = redacted;
              result = { id: versionId, redacted: true };
              explanation =
                "Scrubbed this historical version’s text, path, hash and byte count. Audit identity remains. External copies are not erased.";
            } else {
              state.selectedVersion = v;
              result = { id: v.id, operation: v.operation };
              explanation =
                "Retrieved one historical snapshot for review; no automatic restoration was performed.";
            }
          } else {
            const m = await p.getMemory(storeId, id);
            if (m.memory_store_id !== storeId || m.id !== id)
              throw new LabError("Memory response scope mismatch.");
            if (action === "retrieve-memory") {
              this.putMemory(state, m);
              result = { id: m.id, hash: m.content_sha256 };
              explanation =
                "Loaded the current text and content hash. Review the draft before a guarded update.";
            } else if (action === "delete-memory") {
              if (data.confirm !== `DELETE ${id}`)
                throw new LabError(
                  "Type DELETE followed by the exact memory ID.",
                );
              const expected = hash(data.expectedHash);
              await p.deleteMemory(storeId, id, expected);
              state.memories[storeId] = (state.memories[storeId] ?? []).filter(
                (row) => row.id !== id,
              );
              state.selectedMemory = null;
              state.selectedVersion = null;
              state.versions[storeId] = await p.listVersions(
                storeId,
                id,
                limit,
              );
              result = { id, type: "memory_deleted" };
              explanation =
                "Deleted the current document using the loaded hash. Its retained version lineage is still inspectable.";
            } else if (action === "update-memory" || action === "peer-update") {
              if (s.archived_at)
                throw new LabError("Archived stores cannot accept edits.");
              if (action === "peer-update" && mode !== "demo")
                throw new LabError("The peer-edit exercise is demo-only.");
              const d =
                action === "peer-update"
                  ? {
                      path: m.path,
                      content:
                        (m.content ?? "") +
                        "\nPeer reviewer: add a worked example.",
                    }
                  : memoryDraft(data.draft, data.approved);
              const expected =
                action === "peer-update"
                  ? m.content_sha256
                  : hash(data.expectedHash);
              const updated = await p.updateMemory(storeId, id, d, expected);
              if (action !== "peer-update") this.putMemory(state, updated);
              result = {
                id: updated.id,
                hash: updated.content_sha256,
                head: updated.memory_version_id,
              };
              request.expectedHash = expected;
              explanation =
                action === "peer-update"
                  ? "Simulated another writer without refreshing your loaded draft/hash. Attempt a different update to observe a conflict."
                  : "Applied a guarded edit. A changed document has a new recorded version; a no-op need not add one.";
            } else throw new LabError("Choose a supported memory operation.");
          }
        }
      }
      state.traces.push({ action, request, result, explanation });
      state.traces = state.traces.slice(-30);
      return structuredClone(state);
    } finally {
      this.busy.delete(mode);
    }
  }
  resetDemo() {
    if (this.busy.has("demo"))
      throw new LabError("Wait for the operation to finish.");
    this.providers.demo = new DemoProvider();
    this.owned.demo.clear();
    this.known.demo.clear();
    this.states.demo = empty("demo");
    return structuredClone(this.states.demo);
  }
}
