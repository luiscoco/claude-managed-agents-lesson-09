import "./style.css";
import {
  createCodeBlock,
  highlightCodeElements,
  renderResponse,
} from "./formatting.js";
import { createWorkflowGuide } from "./workflow.js";
import exampleCode from "../examples/course-memory.ts?raw";
import {
  SDK_VERSION,
  BETA,
  STORE_PLAN,
  MEMORY_PLAN,
  REVISION,
  METHODS,
  FIELDS,
  QUESTIONS,
  type Mode,
  type State,
  type MemoryDraft,
  type StoreDraft,
} from "../shared/lesson.js";
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
document.querySelector("#app")!.innerHTML = `
<a class="skip" href="#main">Skip to lesson</a><header class="top"><a class="brand" href="/" aria-label="Course Memory Workshop home"><span class="brand-mark">&lt;/&gt;</span><span>Claude Managed Agents<small>Practical course · Lesson 09</small></span></a><div class="header-actions"><span class="badge">TypeScript SDK ${SDK_VERSION}</span><a class="source" href="https://github.com/luiscoco/claude-managed-agents-lesson-09" target="_blank" rel="noreferrer">Source ↗</a><div class="size" role="group" aria-label="Text size"><button id="comfortable" aria-pressed="true">Comfortable</button><button id="larger" aria-pressed="false">Larger</button></div></div></header>
<main id="main" class="container"><section class="hero"><div><p class="eyebrow">LESSON 09 / MEMORY STORES & VERSIONS</p><h1>Useful context.<br><em>Reviewable history.</em></h1><p class="intro">Maintain approved course conventions across conversations. Organize focused text, guard concurrent edits, and inspect the history of every change.</p><div class="chips"><span>① Organize</span><span>② Remember</span><span>③ Review</span><span>④ Refine</span></div></div><figure class="mascot"><img src="/course-astronaut.png" width="220" height="287" alt="Course astronaut mascot"><figcaption>Focused knowledge.<br>Visible history.</figcaption></figure></section>
<details class="focus"><summary>Lesson focus & author <span>What you will learn</span></summary><div><p>Distinguish stores, memories and versions; apply hash preconditions; inspect historical text; and manage redaction and retirement deliberately.</p><p>Practical companion by <strong>Luis Coco Enríquez</strong>. All live AI work uses Claude Managed Agents through the official Anthropic SDK.</p></div></details>
<nav class="tabs" role="tablist" aria-label="Lesson activities"><button role="tab" id="tab-lab" aria-controls="panel-lab" aria-selected="true">01 · Memory workshop</button><button role="tab" id="tab-map" aria-controls="panel-map" aria-selected="false" tabindex="-1">02 · API & configuration</button><button role="tab" id="tab-how" aria-controls="panel-how" aria-selected="false" tabindex="-1">03 · How it works</button><button role="tab" id="tab-quiz" aria-controls="panel-quiz" aria-selected="false" tabindex="-1">04 · Check understanding</button></nav>




<section role="tabpanel" id="panel-lab" aria-labelledby="tab-lab"><div class="section-heading"><div><p class="eyebrow">THE PRACTICAL EXAMPLE</p><h2>Course Memory Workshop</h2><p>Retain approved conventions, revise them safely, and inspect each recorded change.</p></div><span class="lesson-number">09</span></div><div class="flow">${[
  ["organize", "Organize", "Create a focused store"],
  ["remember", "Remember", "Store reviewed text"],
  ["review", "Review", "Inspect history and conflicts"],
  ["refine", "Refine", "Manage the lifecycle"],
]
  .map(
    ([id, t, d], i) =>
      `<div id="stage-${id}" class="flow-card"><span>${i + 1}</span><strong>${t}</strong><small>${d}</small></div>`,
  )
  .join("")}</div>
<div class="workspace"><aside class="panel controls"><h3>Organize course knowledge</h3><label for="mode">Execution mode</label><select id="mode"><option value="demo">Guided demo · simulated API</option><option value="live" disabled>Live · checking configuration</option></select><p id="mode-note" class="note">Simulated records. No cloud or model calls.</p><button id="walkthrough" class="primary">Run guided walkthrough</button><button id="reset-demo">Reset demo fixtures</button><label for="store-name">Store name</label><input id="store-name" maxlength="120"><label for="store-description">Description · visible to an attached agent</label><textarea id="store-description" rows="3" maxlength="1024"></textarea><button id="create-store" class="primary">Create memory store</button><label for="store-select">Lab-owned store</label><select id="store-select"></select><label for="page-size">Page size · not total limit</label><input id="page-size" type="number" min="1" max="20" value="2"><div class="button-row"><button id="list-stores">List lab stores</button><button id="retrieve-store">Retrieve store</button><button id="update-store">Update store configuration</button></div><h3 class="fields-heading">Review a text record</h3><label for="memory-select">Current memory</label><select id="memory-select"></select><div class="button-row"><button id="list-memories">List current memories</button><button id="retrieve-memory">Retrieve and load current</button></div><label for="memory-path">Descriptive Markdown path</label><input id="memory-path" maxlength="160"><label for="memory-content">Approved teaching context · no secrets or private data</label><textarea id="memory-content" rows="8" maxlength="8000"></textarea><label class="approval"><input id="approved" type="checkbox">I reviewed this draft as non-sensitive teaching context.</label><p class="note">Pattern checks are a limited classroom guard, not a confidentiality guarantee.</p><div class="button-row"><button id="create-memory" class="primary">Create text memory</button><button id="update-memory">Apply guarded update</button><button id="load-revision">Load revision example</button></div><p id="loaded-hash" class="note"></p><button id="peer-update">Demo: simulate a peer edit</button><p class="note">The peer exercise leaves your loaded hash unchanged. Try a different update, observe the conflict, then retrieve and review. A content hash does not guard every path-only race.</p><p id="status" class="status" role="status" aria-live="polite">Ready to explore.</p></aside>
<div class="results"><section class="panel"><div class="panel-heading"><h3>Memory store</h3><span id="store-state" class="badge">No store</span></div><div id="store-details"></div></section><section class="panel"><div class="panel-heading"><h3>Current memory</h3><span id="memory-count" class="badge">0 memories</span></div><div id="memory-details"></div><div id="memory-rendered"></div><div id="teaching-report"></div></section><section class="panel"><div class="panel-heading"><h3>Recorded versions</h3><span id="version-count" class="badge">0 versions</span></div><p id="lineage" class="note"></p><button id="list-versions">List selected lineage</button><label for="version-select">Version snapshot</label><select id="version-select"></select><button id="retrieve-version">Retrieve selected version</button><div id="version-details"></div><div id="version-rendered"></div></section></div></div>
<section class="panel version-comparison"><div class="panel-heading"><h3>Store → memory → version → session</h3><span class="badge">Illustration · no session created</span></div><div id="runtime-preview" class="two-columns"></div><p class="note">Stores are workspace-scoped. Attach at session creation; read the actual mount_path from its returned resource. Enable the agent toolset in the separate runtime app. Labels are not ACLs.</p></section>
<details class="panel archive-panel"><summary>Redact history or retire records</summary><p>These are separate actions. Redact scrubs one eligible historical version while retaining audit identity. A live head cannot be redacted. Memory deletion retains history. Archival is irreversible and blocks new writes and attachments; reads, memory deletion and historical redaction remain possible.</p><label for="redact-confirm">Type REDACT followed by the selected version ID</label><input id="redact-confirm" autocomplete="off"><button id="redact-version" class="danger">Redact selected historical version</button><label for="delete-memory-confirm">Type DELETE followed by the memory ID</label><input id="delete-memory-confirm" autocomplete="off"><button id="delete-memory" class="danger">Delete current memory with loaded hash</button><label for="archive-store-confirm">Type ARCHIVE followed by the store ID</label><input id="archive-store-confirm" autocomplete="off"><button id="archive-store" class="danger">Archive store permanently</button><label for="delete-store-confirm">After archival, type DELETE followed by the store ID</label><input id="delete-store-confirm" autocomplete="off"><button id="delete-store" class="danger">Delete store and all history</button><p class="note">Archival before store deletion is this app’s guard, not an API prerequisite. Store deletion removes its memories and versions. External exports and prior copies remain separate. Timelines omit text and paths.</p></details>
<section class="panel"><div class="panel-heading"><h3>Management timeline · text omitted</h3><span id="trace-count" class="badge">0 operations</span></div><ol id="timeline" class="timeline"></ol></section><div class="teaching-callout"><strong>Try this next</strong><p>Create another course store. Compare scope, simulate a peer edit, and explain why deleting current text does not erase its retained history.</p></div></section>
<section role="tabpanel" id="panel-map" aria-labelledby="tab-map" hidden><div class="section-heading"><div><p class="eyebrow">METHODS & CONFIGURATION</p><h2>Three resources. Distinct responsibilities.</h2><p>All 14 operations and five configuration cards include colored TypeScript. Opening a card sends no request.</p></div></div><div id="method-grid" class="namespace-grid"></div><h2 class="fields-heading">Apply the verified contract.</h2><div id="field-grid" class="namespace-grid"></div><div class="teaching-callout"><strong>Resolve the deck’s inconsistencies</strong><p>SDK ${SDK_VERSION} uses <code>memoryStores</code>, <code>memoryVersions</code> and a content-hash precondition, rather than if_version. Memory has no metadata field. Archive is one-way. Use <code>${BETA}</code> alone on memory requests; session requests use their own managed beta.</p></div></section>
<section role="tabpanel" id="panel-how" aria-labelledby="tab-how" hidden><div class="section-heading"><div><p class="eyebrow">UML / ARCHITECTURE & WORKFLOW</p><h2>Follow knowledge through its history.</h2><p>Separate browser review, Node validation, durable storage and session integration.</p></div></div><div id="workflow-guide"></div><div class="two-columns"><article class="panel"><h3>1. Start locally</h3><pre><code id="setup-code"></code></pre><p>Open <code>http://127.0.0.1:4329</code>. Demo needs no key. Live mode needs authorized Managed Agents access through <code>ANTHROPIC_API_KEY</code> in the ignored local <code>.env</code>. Restart after changes.</p></article><article class="panel"><h3>2. Keep knowledge appropriate</h3><p>Store focused, reviewed text rather than binary files or sensitive data. Pattern checks cannot identify all confidential information. Use Lesson 8’s vault pattern for authentication values.</p><p>Only owned store IDs are saved locally. This teaching guard does not replace workspace permissions.</p></article></div><div class="two-columns"><article class="panel"><h3>Retrieve, review, then update</h3><p>A loaded content hash guards a differing write. A 409 requires refresh and review. A no-op need not create another version. This hash is not a universal version lock.</p><p>Basic lists omit content. Retrieve deliberately and distinguish memory objects from directory-prefix items.</p></article><article class="panel"><h3>Retention is explicit</h3><p>Versions can survive memory deletion and may expire under service retention rules. This app promises no permanent audit archive. Redaction retains who and when while scrubbing selected historical fields.</p><p>Archival has no undo. Store deletion removes its memories and versions, while exports elsewhere remain separate.</p></article></div><article class="panel code-example"><h3>3. Read the TypeScript management example</h3><p>The example deliberately creates a real store, adds and updates text, and lists version IDs. It leaves the store in place and creates no sessions or model turns.</p><pre><code id="example-code"></code></pre></article><p class="source-links">Official references: <a href="https://platform.claude.com/docs/en/managed-agents/memory" target="_blank" rel="noreferrer">Using agent memory ↗</a> · <a href="https://platform.claude.com/docs/en/api/beta/memory_stores" target="_blank" rel="noreferrer">Memory API ↗</a></p></section>
<section role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" hidden><div class="section-heading"><div><p class="eyebrow">RETRIEVE, THEN APPLY</p><h2>Can you explain durable context?</h2><p>Six questions connect scope, concurrent editing, retention and access.</p></div><span id="score" class="badge">0 / 6 correct</span></div><div id="quiz"></div><div class="teaching-callout"><h3>Your practical challenge</h3><ol><li>Create a focused non-sensitive text record.</li><li>Revise it using a loaded hash.</li><li>Resolve a stale write after review.</li><li>Inspect historical snapshots.</li><li>Explain redaction, memory deletion, archival and store deletion.</li></ol></div></section><footer><span>Claude Managed Agents · Lesson 09</span><span>Luis Coco Enríquez · Learn by inspecting.</span></footer></main>`;
function card(
  name: string,
  path: string,
  description: string,
  snippet: string,
) {
  const a = document.createElement("article");
  a.className = "panel namespace current";
  const h = document.createElement("h3"),
    c = document.createElement("code"),
    p = document.createElement("p"),
    d = document.createElement("details"),
    s = document.createElement("summary");
  h.textContent = name;
  c.textContent = path;
  p.textContent = description;
  s.textContent = "Inspect the code example";
  d.append(s, createCodeBlock(snippet, "typescript"));
  a.append(h, c, p, d);
  return a;
}
for (const m of METHODS)
  $("method-grid").append(card(m.name, m.path, m.description, m.snippet));
for (const f of FIELDS)
  $("field-grid").append(card(f.name, f.path, f.description, f.snippet));
$("workflow-guide").append(createWorkflowGuide());
$("setup-code").textContent =
  "npm ci\nCopy-Item .env.example .env\n# Set ANTHROPIC_API_KEY for optional live management\nnpm run dev";
$("setup-code").dataset.language = "powershell";
$("example-code").textContent = exampleCode;
$("example-code").dataset.language = "typescript";
highlightCodeElements(document);
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
function activate(tab: HTMLButtonElement) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.setAttribute("aria-selected", String(active));
    t.tabIndex = active ? 0 : -1;
    $(t.getAttribute("aria-controls")!).hidden = !active;
  });
}
tabs.forEach((t, i) => {
  t.onclick = () => activate(t);
  t.onkeydown = (e) => {
    let n: number | undefined;
    if (e.key === "ArrowRight") n = (i + 1) % 4;
    if (e.key === "ArrowLeft") n = (i + 3) % 4;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = 3;
    if (n !== undefined) {
      e.preventDefault();
      activate(tabs[n]);
      tabs[n].focus();
    }
  };
});
function setSize(size: string) {
  document.documentElement.dataset.text = size;
  for (const id of ["comfortable", "larger"])
    $(id).setAttribute("aria-pressed", String(size === id));
  try {
    localStorage.setItem("lesson-text-size", size);
  } catch {}
}
try {
  setSize(
    localStorage.getItem("lesson-text-size") === "larger"
      ? "larger"
      : "comfortable",
  );
} catch {}
$("comfortable").onclick = () => setSize("comfortable");
$("larger").onclick = () => setSize("larger");
const answers = new Map<number, boolean>();
QUESTIONS.forEach((q, i) => {
  const field = document.createElement("fieldset"),
    legend = document.createElement("legend"),
    feedback = document.createElement("p");
  field.className = "panel question";
  legend.textContent = `${i + 1}. ${q.question}`;
  feedback.className = "feedback";
  feedback.setAttribute("aria-live", "polite");
  field.append(legend);
  q.options.forEach((answer, j) => {
    const label = document.createElement("label"),
      radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `q-${i}`;
    label.append(radio, document.createTextNode(answer));
    radio.onchange = () => {
      const correct = j === q.answer;
      answers.set(i, correct);
      feedback.textContent = `${correct ? "Correct." : "Try again."} ${q.explanation}`;
      feedback.classList.toggle("correct", correct);
      $("score").textContent =
        `${[...answers.values()].filter(Boolean).length} / 6 correct`;
    };
    field.append(label);
  });
  field.append(feedback);
  $("quiz").append(field);
});

let mode: Mode = "demo",
  storeId = "",
  memoryId = "",
  versionId = "",
  loadedHash = "",
  busy = false;
let state: State = {
  mode,
  stores: [],
  memories: {},
  versions: {},
  selectedMemory: null,
  selectedVersion: null,
  traces: [],
};
const val = (id: string) => $<HTMLInputElement>(id).value;
const store = () => state.stores.find((s) => s.id === storeId);
const current = () =>
  state.selectedMemory?.memory_store_id === storeId &&
  state.selectedMemory.id === memoryId
    ? state.selectedMemory
    : null;
const snapshot = () =>
  state.selectedVersion?.id === versionId &&
  state.selectedVersion.memory_store_id === storeId
    ? state.selectedVersion
    : null;
const draft = (): MemoryDraft => ({
  path: val("memory-path"),
  content: val("memory-content"),
});
const containerDraft = (): StoreDraft => ({
  name: val("store-name"),
  description: val("store-description"),
});
function status(s: string) {
  $("status").textContent = s;
}
function loadStore(d: StoreDraft) {
  $<HTMLInputElement>("store-name").value = d.name;
  $<HTMLTextAreaElement>("store-description").value = d.description;
}
function loadDraft(d: MemoryDraft) {
  $<HTMLInputElement>("memory-path").value = d.path;
  $<HTMLTextAreaElement>("memory-content").value = d.content;
}
function json(id: string, value: unknown) {
  $(id).replaceChildren(
    ...(value ? [createCodeBlock(JSON.stringify(value, null, 2), "json")] : []),
  );
}
function disable(id: string, condition: unknown) {
  $<HTMLButtonElement>(id).disabled = busy || Boolean(condition);
}
function render() {
  const s = store(),
    m = current(),
    v = snapshot(),
    rows = state.memories[storeId] ?? [],
    versions = (state.versions[storeId] ?? []).filter(
      (x) => x.memory_id === memoryId,
    );
  const stores = $<HTMLSelectElement>("store-select");
  stores.replaceChildren(new Option("Select a lab-owned store", ""));
  for (const row of state.stores)
    stores.add(
      new Option(`${row.name}${row.archived_at ? " · archived" : ""}`, row.id),
    );
  stores.value = storeId;
  const memories = $<HTMLSelectElement>("memory-select");
  memories.replaceChildren(new Option("Choose a current memory", ""));
  for (const row of rows)
    memories.add(new Option(`${row.path} · ${row.id}`, row.id));
  memories.value = memoryId;
  const vs = $<HTMLSelectElement>("version-select");
  vs.replaceChildren(new Option("Choose a snapshot", ""));
  for (const row of versions)
    vs.add(
      new Option(
        `${row.operation} · ${row.id}${row.redacted_at ? " · redacted" : ""}`,
        row.id,
      ),
    );
  vs.value = versionId;
  $("store-state").textContent = s
    ? s.archived_at
      ? "archived · one-way"
      : "active"
    : "No store";
  json("store-details", s);
  $("memory-count").textContent =
    `${rows.length} current ${rows.length === 1 ? "memory" : "memories"}`;
  json("memory-details", m ? { ...m, content: "[rendered below]" } : null);
  $("memory-rendered").replaceChildren(
    ...(m
      ? [renderResponse(m.content ?? "Content omitted; retrieve full memory.")]
      : []),
  );
  $("teaching-report").replaceChildren(
    renderResponse(
      m
        ? "### Inspect the current record\n\nIts store ID, memory ID and head version ID identify different resources. The loaded content hash guards a differing write."
        : "### Keep the hierarchy clear\n\nSelect or create a memory. Basic lists omit text; retrieve to load the edit precondition. Retained history can remain after deletion.",
    ),
  );
  $("loaded-hash").textContent = loadedHash
    ? `Loaded content hash: ${loadedHash}`
    : "Retrieve a memory to load its content hash.";
  $("lineage").textContent = memoryId
    ? `Store ${storeId} · lineage ${memoryId}`
    : "Select a memory to inspect its lineage.";
  $("version-count").textContent = `${versions.length} versions`;
  json(
    "version-details",
    v
      ? { ...v, content: v.content == null ? v.content : "[rendered below]" }
      : null,
  );
  $("version-rendered").replaceChildren(
    ...(v
      ? [
          renderResponse(
            v.redacted_at
              ? "### Historical content redacted\n\nContent, path, hash and byte count are scrubbed. Audit identity remains."
              : (v.content ??
                  "This snapshot omits content or records deletion."),
          ),
        ]
      : []),
  );
  $("runtime-preview").replaceChildren();
  for (const [heading, code] of [
    [
      "Resource identity",
      JSON.stringify(
        {
          storeId: storeId || "storeId",
          memoryId: memoryId || "memoryId",
          loadedContentHash: loadedHash || null,
          headVersionId: m?.memory_version_id ?? null,
          selectedVersionId: versionId || null,
        },
        null,
        2,
      ),
    ],
    [
      "Session attachment · example only",
      `const session = await client.beta.sessions.create({\n  agent: agentId, environment_id: environmentId,\n  resources: [{ type: "memory_store", memory_store_id: ${JSON.stringify(storeId || "storeId")},\n    access: "read_only", instructions: "Consult course conventions." }],\n});\n// Illustration only; no session is created here.`,
    ],
  ] as const) {
    const a = document.createElement("article"),
      h = document.createElement("h4");
    h.textContent = heading;
    a.append(
      h,
      createCodeBlock(
        code,
        heading.startsWith("Resource") ? "json" : "typescript",
      ),
    );
    $("runtime-preview").append(a);
  }
  $("timeline").replaceChildren();
  for (const t of [...state.traces].reverse()) {
    const li = document.createElement("li"),
      h = document.createElement("strong"),
      p = document.createElement("p"),
      d = document.createElement("details"),
      summary = document.createElement("summary");
    h.textContent = t.action;
    p.textContent = t.explanation;
    summary.textContent = "Inspect IDs and preconditions";
    d.append(
      summary,
      createCodeBlock(
        JSON.stringify({ request: t.request, result: t.result }, null, 2),
        "json",
      ),
    );
    li.append(h, p, d);
    $("timeline").append(li);
  }
  $("trace-count").textContent = `${state.traces.length} operations`;
  for (const id of [
    "mode",
    "walkthrough",
    "store-name",
    "store-description",
    "store-select",
    "memory-select",
    "version-select",
    "page-size",
    "memory-path",
    "memory-content",
    "approved",
    "create-store",
    "list-stores",
    "load-revision",
  ])
    disable(id, false);
  const active = Boolean(s && !s.archived_at),
    approved = $<HTMLInputElement>("approved").checked;
  disable("reset-demo", mode !== "demo");
  for (const id of ["retrieve-store", "list-memories"]) disable(id, !s);
  disable("update-store", !active);
  disable("create-memory", !active || !approved);
  disable("retrieve-memory", !rows.some((row) => row.id === memoryId));
  disable("update-memory", !active || !m || !loadedHash || !approved);
  disable("peer-update", mode !== "demo" || !active || !m);
  disable("list-versions", !s || !memoryId);
  disable("retrieve-version", !versionId);
  disable(
    "redact-version",
    !versionId ||
      v?.redacted_at ||
      val("redact-confirm") !== `REDACT ${versionId}`,
  );
  disable(
    "delete-memory",
    !m || !loadedHash || val("delete-memory-confirm") !== `DELETE ${memoryId}`,
  );
  disable(
    "archive-store",
    !active || val("archive-store-confirm") !== `ARCHIVE ${storeId}`,
  );
  disable(
    "delete-store",
    !s?.archived_at || val("delete-store-confirm") !== `DELETE ${storeId}`,
  );
  for (const [stage, ready] of [
    ["organize", state.stores.length > 0],
    ["remember", rows.length > 0],
    ["review", versions.length > 0],
    ["refine", state.traces.some((t) => t.action === "update-memory")],
  ] as const)
    $(`stage-${stage}`).classList.toggle("ready", ready);
}
async function api(path: string, data?: Record<string, unknown>) {
  const r = await fetch(
    path,
    data
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, storeId, memoryId, versionId, ...data }),
        }
      : undefined,
  );
  const value = await r.json();
  if (!r.ok) throw new Error(value.error ?? "Operation failed.");
  return value;
}
async function perform(action: string, extra: Record<string, unknown> = {}) {
  state = await api("/api/action", {
    action,
    limit: Number(val("page-size")),
    expectedHash: loadedHash,
    ...extra,
  });
  render();
}
async function action(work: () => Promise<void>) {
  if (busy) return;
  busy = true;
  render();
  try {
    await work();
  } catch (e) {
    status(e instanceof Error ? e.message : "Operation failed.");
  } finally {
    busy = false;
    render();
  }
}
function loadCurrent() {
  const m = current();
  if (m) {
    loadedHash = m.content_sha256;
    loadDraft({ path: m.path, content: m.content ?? "" });
  }
  render();
}
async function createStore() {
  await perform("create-store", { draft: containerDraft() });
  storeId = state.stores.at(-1)?.id ?? "";
  memoryId = "";
  versionId = "";
  loadedHash = "";
  render();
  status("Memory store created. Session access remains separate.");
}
async function createMemory() {
  await perform("create-memory", {
    draft: draft(),
    approved: $<HTMLInputElement>("approved").checked,
  });
  memoryId = state.selectedMemory?.id ?? "";
  versionId = "";
  loadCurrent();
  status("Approved text stored and its first version recorded.");
}
async function chooseMemory(id: string) {
  memoryId = id;
  versionId = "";
  loadedHash = "";
  if (id) {
    await perform("retrieve-memory");
    loadCurrent();
    await perform("list-versions");
  }
  render();
  status("Current text and its content hash loaded for review.");
}
loadStore(STORE_PLAN);
loadDraft(MEMORY_PLAN);
$("walkthrough").onclick = () =>
  void action(async () => {
    loadStore(STORE_PLAN);
    loadDraft(MEMORY_PLAN);
    $<HTMLInputElement>("approved").checked = true;
    await createStore();
    await createMemory();
    $<HTMLTextAreaElement>("memory-content").value = REVISION;
    await perform("update-memory", { draft: draft(), approved: true });
    loadCurrent();
    await perform("list-memories");
    await perform("list-versions");
    versionId = state.versions[storeId]?.at(-1)?.id ?? "";
    await perform("retrieve-version");
    status(
      "Walkthrough complete. Current text revised and history retrieved; no session or model turn started.",
    );
  });
$("create-store").onclick = () => void action(createStore);
$("create-memory").onclick = () => void action(createMemory);
$("load-revision").onclick = () => {
  $<HTMLTextAreaElement>("memory-content").value = REVISION;
  status("Revision draft loaded. Review before applying the guarded update.");
};
$("approved").onchange = render;
$("store-select").onchange = () => {
  const id = val("store-select");
  void action(async () => {
    storeId = id;
    memoryId = "";
    versionId = "";
    loadedHash = "";
    if (id) {
      await perform("retrieve-store");
      await perform("list-memories");
      loadStore(store()!);
    }
    render();
    status(
      "Store and current memory list loaded. Select a document to retrieve text.",
    );
  });
};
$("memory-select").onchange = () => {
  const id = val("memory-select");
  void action(() => chooseMemory(id));
};
$("version-select").onchange = () => {
  versionId = val("version-select");
  render();
};
$("list-stores").onclick = () =>
  void action(async () => {
    await perform("list-stores");
    status(
      "Registered stores listed across all pages, including archived records.",
    );
  });
$("retrieve-store").onclick = () =>
  void action(async () => {
    await perform("retrieve-store");
    status("Store configuration retrieved.");
  });
$("update-store").onclick = () =>
  void action(async () => {
    await perform("update-store", { draft: containerDraft() });
    status("Store configuration updated; memory text was not changed.");
  });
$("list-memories").onclick = () =>
  void action(async () => {
    await perform("list-memories");
    status("Basic list loaded across all pages. Null content means omitted.");
  });
$("retrieve-memory").onclick = () => void action(() => chooseMemory(memoryId));
$("update-memory").onclick = () =>
  void action(async () => {
    await perform("update-memory", {
      draft: draft(),
      approved: $<HTMLInputElement>("approved").checked,
    });
    loadCurrent();
    await perform("list-versions");
    versionId = "";
    render();
    status("Guarded update applied. Inspect the recorded history.");
  });
$("peer-update").onclick = () =>
  void action(async () => {
    await perform("peer-update");
    status(
      "Peer edit simulated. Your loaded hash stayed unchanged; change your draft and try an update.",
    );
  });
$("list-versions").onclick = () =>
  void action(async () => {
    await perform("list-versions");
    versionId = "";
    render();
    status(
      "Retained lineage listed. Retrieve a snapshot to review historical text.",
    );
  });
$("retrieve-version").onclick = () =>
  void action(async () => {
    await perform("retrieve-version");
    status("Historical snapshot retrieved; current text was not restored.");
  });
for (const id of [
  "redact-confirm",
  "delete-memory-confirm",
  "archive-store-confirm",
  "delete-store-confirm",
])
  $(id).oninput = render;
$("redact-version").onclick = () =>
  void action(async () => {
    await perform("redact-version", { confirm: val("redact-confirm") });
    status(
      "Historical version redacted; audit identity retained. External copies are separate.",
    );
  });
$("delete-memory").onclick = () =>
  void action(async () => {
    await perform("delete-memory", { confirm: val("delete-memory-confirm") });
    loadedHash = "";
    versionId = "";
    render();
    status(
      "Current document deleted; retained lineage remains available for inspection.",
    );
  });
$("archive-store").onclick = () =>
  void action(async () => {
    await perform("archive-store", { confirm: val("archive-store-confirm") });
    status(
      "Store archived permanently. Reads, deletion and eligible redaction remain possible.",
    );
  });
$("delete-store").onclick = () =>
  void action(async () => {
    await perform("delete-store", { confirm: val("delete-store-confirm") });
    storeId = "";
    memoryId = "";
    versionId = "";
    loadedHash = "";
    render();
    status("Store and all memory/version records deleted.");
  });
$("reset-demo").onclick = () =>
  void action(async () => {
    state = await api("/api/reset-demo", {});
    storeId = "";
    memoryId = "";
    versionId = "";
    loadedHash = "";
    loadStore(STORE_PLAN);
    loadDraft(MEMORY_PLAN);
    $<HTMLInputElement>("approved").checked = false;
    render();
    status("Demo fixtures reset. Live stores are unaffected.");
  });
$("mode").onchange = () => {
  const chosen = val("mode") as Mode;
  void action(async () => {
    mode = chosen;
    storeId = "";
    memoryId = "";
    versionId = "";
    loadedHash = "";
    state = await api(`/api/state?mode=${mode}`);
    $("mode-note").textContent =
      mode === "demo"
        ? "Simulated records. No cloud or model calls."
        : "Real memory management restricted to lab-created stores. No sessions or inference.";
    render();
    status("Mode selected.");
  });
};
render();
void api("/api/lesson")
  .then(async (info) => {
    const option = $<HTMLSelectElement>("mode").options[1];
    option.disabled = !info.liveReady;
    option.textContent = info.liveReady
      ? "Live · Claude Managed Agents"
      : "Live · set server API key";
    state = await api(`/api/state?mode=${mode}`);
    render();
  })
  .catch((e) => status(e.message));
