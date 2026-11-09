import { createCodeBlock } from "./formatting.js";
const steps = [
  {
    title: "Review the context",
    owner: "Student / browser",
    text: "Choose approved non-sensitive course guidance and a descriptive path.",
    code: 'const draft = { path: "/course/conventions.md", content: "Use TypeScript examples." };',
  },
  {
    title: "Create a store",
    owner: "Node \u2192 memory API",
    text: "Create a workspace-scoped container using the memory beta alone. Retain only owned IDs locally.",
    code: 'const store = await client.beta.memoryStores.create({ name: "Course conventions", betas: ["agent-memory-2026-07-22"] });',
  },
  {
    title: "Create the text record",
    owner: "Node \u2192 memory API",
    text: "Store reviewed text and retain memory and head version identifiers.",
    code: 'const memory = await client.beta.memoryStores.memories.create(store.id, { ...draft, view: "full", betas });',
  },
  {
    title: "Retrieve and retain the hash",
    owner: "Browser / Node",
    text: "Read current text deliberately and retain its hash for a guarded edit.",
    code: "const loadedHash = memory.content_sha256;",
  },
  {
    title: "Apply a guarded edit",
    owner: "Node \u2192 memory API",
    text: "A differing stale write fails. Retrieve, review and resubmit deliberately.",
    code: 'await client.beta.memoryStores.memories.update(memory.id, { memory_store_id: store.id, content: revisedText, precondition: { type: "content_sha256", content_sha256: loadedHash }, betas });',
  },
  {
    title: "Inspect history",
    owner: "Browser / memory API",
    text: "List retained versions and retrieve a snapshot. No automatic restore is performed.",
    code: 'await client.beta.memoryStores.memoryVersions.list(store.id, { memory_id: memory.id, view: "basic", betas });',
  },
  {
    title: "Redact historical text",
    owner: "Node \u2192 memory API",
    text: "Optional exact-ID confirmation. A live head cannot be redacted. Selected historical fields are scrubbed; audit identity remains.",
    code: "await client.beta.memoryStores.memoryVersions.redact(versionId, { memory_store_id: store.id, betas });",
  },
  {
    title: "Retire deliberately",
    owner: "Student \u2192 Node \u2192 API",
    text: "Optional retirement. Archive is one-way; store deletion removes memories and versions. Each requires separate confirmation.",
    code: "await client.beta.memoryStores.archive(store.id, { betas });\n// Separate confirmed action:\nawait client.beta.memoryStores.delete(store.id, { betas });",
  },
];
const architecture = `<svg viewBox="0 0 1040 300" role="img" aria-label="UML component architecture"><title>UML component architecture</title><defs><marker id="arch-arrow" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0 L9 4 L0 8 Z"/></marker></defs><g class="uml-box"><rect x="20" y="40" width="310" height="180" rx="10"/><text class="uml-title" x="175" y="85">Student browser</text><text x="175" y="125">Review text · inspect history</text><text x="175" y="165">Loaded hash · formatted explanations</text></g><g class="uml-box"><rect x="365" y="40" width="310" height="180" rx="10"/><text class="uml-title" x="520" y="85">Node memory host</text><text x="520" y="125">Validate scope · select memory beta</text><text x="520" y="165">API key stays on server</text></g><g class="uml-box"><rect x="710" y="40" width="310" height="180" rx="10"/><text class="uml-title" x="865" y="85">Managed Agents memory API</text><text x="865" y="125">Store → current text → versions</text><text x="865" y="165">Session integration is separate</text></g><path class="uml-edge" d="M330 130 H365 M675 130 H710"/><text class="uml-caption" x="520" y="270">Demo uses simulated records. Live manages memory without starting sessions or model turns.</text></svg>`;
const workflow = `<svg viewBox="0 0 1040 1170" role="img" aria-label="UML memory version workflow"><title>UML memory version workflow</title><defs><marker id="flow-arrow" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0 L9 4 L0 8 Z"/></marker></defs><rect class="uml-lane" x="10" y="10" width="1020" height="1150" rx="10"/><path class="uml-lane-line" d="M345 10 V1160 M690 10 V1160"/><text class="uml-title" x="180" y="40">Student / browser</text><text class="uml-title" x="520" y="40">Node host</text><text class="uml-title" x="860" y="40">Memory API</text><g class="uml-action" data-workflow-step="0"><rect x="30" y="90" width="300" height="70" rx="12"/><text x="180" y="130">1 · Review the context</text></g><path class="uml-edge" d="M180 160 V185 H860 V215"/><g class="uml-action" data-workflow-step="1"><rect x="710" y="215" width="300" height="70" rx="12"/><text x="860" y="255">2 · Create a store</text></g><path class="uml-edge" d="M860 285 V310 H860 V340"/><g class="uml-action" data-workflow-step="2"><rect x="710" y="340" width="300" height="70" rx="12"/><text x="860" y="380">3 · Create the text record</text></g><path class="uml-edge" d="M860 410 V435 H180 V465"/><g class="uml-action" data-workflow-step="3"><rect x="30" y="465" width="300" height="70" rx="12"/><text x="180" y="505">4 · Retrieve and retain the hash</text></g><path class="uml-edge" d="M180 535 V560 H860 V590"/><g class="uml-action" data-workflow-step="4"><rect x="710" y="590" width="300" height="70" rx="12"/><text x="860" y="630">5 · Apply a guarded edit</text></g><path class="uml-edge" d="M860 660 V685 H180 V715"/><g class="uml-action" data-workflow-step="5"><rect x="30" y="715" width="300" height="70" rx="12"/><text x="180" y="755">6 · Inspect history</text></g><g class="uml-action" data-workflow-step="6"><rect x="370" y="840" width="300" height="70" rx="12"/><text x="520" y="880">7 · Redact historical text</text></g><g class="uml-action" data-workflow-step="7"><rect x="710" y="965" width="300" height="70" rx="12"/><text x="860" y="1005">8 · Retire deliberately</text></g><path class="uml-edge" d="M180 785 V875 H370"/><path class="uml-edge" d="M180 785 V1000 H710"/><text class="uml-edge-label" x="180" y="930">Optional retirement</text><text class="uml-edge-label" x="520" y="825">Optional redaction</text><text class="uml-caption" x="520" y="1110">A stale differing write returns a conflict: retrieve, review, then resubmit deliberately.</text></svg>`;
export function createWorkflowGuide() {
  const section = document.createElement("section");

  section.className = "panel workflow-guide";

  section.innerHTML = `<h3>Follow a memory through its version history.</h3><p>The component diagram separates the browser, Node host, and memory API. Select each workflow step for its owner and colored code.</p><div class="uml-scroll" tabindex="0" role="region" aria-label="Scrollable component architecture">${architecture}</div><details class="uml-activity"><summary>Explore the full UML memory version workflow</summary><p class="note">Rounded boxes are actions. After inspection, redaction and retirement are separate optional branches. Scroll horizontally on small screens.</p><div class="uml-scroll" tabindex="0" role="region" aria-label="Scrollable memory version workflow">${workflow}</div></details><div class="workflow-step-buttons" role="group" aria-label="Inspect a workflow step"></div><article class="workflow-step-detail" aria-live="polite" aria-atomic="true"></article>`;

  const group = section.querySelector(".workflow-step-buttons")!,
    detail = section.querySelector(".workflow-step-detail")!;

  function select(index: number) {
    const step = steps[index];

    group

      .querySelectorAll("button")

      .forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));

    section

      .querySelectorAll<SVGElement>("[data-workflow-step]")

      .forEach((node) =>
        node.classList.toggle(
          "selected",

          node.dataset.workflowStep === String(index),
        ),
      );

    const h = document.createElement("h4");

    h.textContent = `${index + 1}. ${step.title}`;

    const badge = document.createElement("span");

    badge.className = "badge";

    badge.textContent = step.owner;

    const p = document.createElement("p");

    p.textContent = step.text;

    detail.replaceChildren(
      h,

      badge,

      p,

      createCodeBlock(step.code, "typescript"),
    );
  }

  steps.forEach((step, index) => {
    const b = document.createElement("button");

    b.textContent = `${index + 1} · ${step.title}`;

    b.onclick = () => select(index);

    group.append(b);
  });

  select(0);

  return section;
}
