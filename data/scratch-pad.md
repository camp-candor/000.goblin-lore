### MASTER REPOSITORY TASK SPECIFICATION: CANONICAL NARRATIVE FACTS (FACTS LEDGER)

* **Primary Target Repository:** `astro-kahn-it-com/001.goblin-lore` (also referenced across the architecture as `000.goblin-lore`, `packages/001.lore`, and distributed internally as `@snailicid3/consumer-npm`).


* **Cluster & Ontological Tier:** Cluster `01.canon` — The Upstream Legislative Constitution & Schema Compiler.


* **Interfacing Downstream Repositories:** `camp-candor/002.worker-sower` (`worker-sower-engine`), `camp-candor/000.repo-bot`, `camp-candor/995.library`, `camp-candor/goblin-config`, and `goblin-dashboard`.



---

### Executive Architectural Topology within `goblin-lore`

```text
-PHASE 1: BYTE-0 DUAL-RAIL DOSSIER SCHEMAS & TRI-PARTITE STATE VECTORS
 ├── [TASK-GL-1.1] Byte-0 Frontmatter Law & Tri-Partite Vector Zod Contracts
 ├── [TASK-GL-1.2] Entity Dossier Scaffolder (SCAFFOLD_ENTITY) & Refusal Vector Contract
 └── [TASK-GL-1.3] Trust Graph Ontology, Authority Levels & Three-Part Lock Enforcement

PHASE 2: EPISTEMIC FIREWALL, ACTION ONTOLOGY & CLUE-DISJOINTNESS KERNELS
 ├── [TASK-GL-2.1] Canonical Action Ontology (verb_families.json) & Dual-Field Lexical Gate
 ├── [TASK-GL-2.2] Multi-Valued Epistemic Horizons & O(L) Trie Clue-Disjointness Verifier
 └── [TASK-GL-2.3] Split Parenthetical AST Contract, Blind Probe Schemas & Pacing Manifests

PHASE 3: CREATIVE INGESTION FUNNEL, GRIEVANCE DAG & FARCE CAP GOVERNANCE
 ├── [TASK-GL-3.1] 4-Tier Creative Ingestion Funnel (vault/ingest/) & HDBSCAN Resonance Audit
 └── [TASK-GL-3.2] Tier 4 Proposal Gate (!PitchGrievance), Farce Cap Linter & Reciprocal Spatial Links

PHASE 4: THE 3-PASS OFFLINE COMPILER (T_0 = $0.00) & CRYPTOGRAPHIC H_root SEALING
 ├── [TASK-GL-4.1] 3-Pass Offline Canon Compiler (scripts/compile.ts) & Integer Basis-Point Math
 ├── [TASK-GL-4.2] RFC 8785 Canonicalization, Atomic POSIX Swap & Merkle Root (H_root) Sealing
 └── [TASK-GL-4.3] Read-Only Runtime Ingestion Client (bibleLoader.ts) & Recursive deepFreeze<T>()

PHASE 5: CANON LIFECYCLE STANDING, HARVEST RATIFICATION & APPEND-ONLY ERRATA
 ├── [TASK-GL-5.1] Asymmetric Staging Membrane (LoreStagingDO) & Human Ratification Promotion
 ├── [TASK-GL-5.2] Tri-State Epistemological Standing ("Still Good" Protocol) & Segmented Git-Notes
 └── [TASK-GL-5.3] Append-Only Errata Protocol, Multi-Repo Expand->Migrate->Contract Saga & QA Gauntlet

```

---

### Phase 1: Byte-0 Dual-Rail Dossier Schemas & Tri-Partite State Vectors

**Phase Mandate:** Establish the legislative type system inside `goblin-lore` so that every canonical entity is authored under a strict Dual-Rail contract, separating machine-verifiable physical invariants from dramaturgical prose at Stage $T_0 = \$0.00$.

#### [TASK-GL-1.1] Byte-0 Frontmatter Law & Tri-Partite Vector Zod Contracts

* **Target File Manifest:** `packages/001.lore/schemas/entities.ts`, `packages/001.lore/src/core/canon/types.ts`, `characters/*.md` (`bog.md`, `wart.md`), `locations/*.md`, `possessions/*.md`.


* **Technical Subtasks & Implementation Nuance:**
1. **Enforce the Byte-0 Frontmatter Law:** Configure the dossier parser to assert that every canonical Markdown file begins strictly at physical byte offset 0 with `---` (`0x2D 0x2D 0x2D 0x0A`) with zero leading whitespace and zero UTF-8 BOM markers (`0xEF 0xBB 0xBF`).


2. **Author Tri-Partite State Vector Schemas (`.strict()` Zod Validation):**
* **Somatic Vector (`SomaticVector`):** Define bounded locomotion classes, 32-bit integer `somaticCapabilityMask` bitmasks, active physical trauma conditions (e.g., `severed_left_arm`, `paralyzed_arm`), and explicit negative motor masks (`bannedKineticVerbs`, e.g., `["SPRINT", "CLIMB", "TWO_HANDED_STRIKE"]`).


* **Logistical Vector (`LogisticalVector`):** Enforce conservation of matter across bounded equipment slot hierarchies (`worn`, `held`, `carried`, `cached`), weight classes, item mass, and hand-slot satisfiability ($\text{Demand}_{\text{hands}} \le \text{Supply}_{\text{hands}}$ via integer `handCapacity`).


* **Epistemic & Relational Vector:** Define escalation ceilings ($1 \le x \le 5$), asymmetric relational leverage strings, faction alignments (`factionId`), and unresolved mystery clue registrations.




3. **Enforce Deterministic Temporal Purity:** Mandate static integer epoch defaults (`default(0)`) across all Zod schema initializers, strictly prohibiting runtime `Date.now()` evaluations at parse time.




* **Falsifiable Acceptance Criteria:** Injecting a leading space, UTF-8 BOM, un-schemaed YAML property, or `Date.now()` initializer into a dossier fails `tsc --noEmit` and throws a fatal `ZodError` at $T_0 = \$0.00$.



#### [TASK-GL-1.2] Entity Dossier Scaffolder (`SCAFFOLD_ENTITY`) & Refusal Vector Contract

* **Target File Manifest:** `entityBuilder.ts`, `01.series.unit/buz/series.buzz.ts`, `characters/*.md`, `locations/*.md`, `possessions/*.md`, `grievances/*.md`.


* **Technical Subtasks & Implementation Nuance:**
1. **Dual-Rail Structural Separation:** Implement `DualRailCharacter` and entity containers that bundle the **Machine Rail** (`MachineRail`: kebab-case `id`, `somaticCapabilityMask`, `bannedKineticVerbs`, `handCapacity`, `logisticalSlots`, acoustic damping basis points) and the isolated **Voice Rail** (`VoiceRail`: `emotionalRegister`, `toneNotes`, `centralIrony`, *The Surface Complaint*, *The Underneath*, *The Forbidden Truth*, and dialect rhythms).


2. **Deterministic Dossier Generator (`scaffoldEntityDossier`):** Wire `SCAFFOLD_ENTITY` in `entityBuilder.ts` and `01.series.unit/buz/series.buzz.ts` to generate atomic dossiers across `CHARACTER` (`char_*`), `LOCATION` (`loc_*`), `POSSESSION` (`item_*`), and `GRIEVANCE` (`grv_*`).


3. **Formal Refusal Vector Contract:** Embed the mandatory three-stage `refusalVectors` array (`TRIGGER -> MANDATORY REFUSAL -> UNAVOIDABLE COST`) into the entity contract to govern moral and physical non-negotiables during simulation.




* **Falsifiable Acceptance Criteria:** Invoking `scaffoldEntityDossier` emits a Byte-0 compliant Markdown dossier whose YAML frontmatter and Markdown body parse cleanly into `DualRailCharacter` maps with $O(1)$ lookup IDs.



#### [TASK-GL-1.3] Trust Graph Ontology, Authority Levels & Three-Part Lock Enforcement

* **Target File Manifest:** `packages/001.lore/schemas/trustGraph.ts`, `packages/001.lore/schemas/index.ts`, `packages/001.lore/src/linters/evalSet.json`.


* **Technical Subtasks & Implementation Nuance:**
1. **Eight Ontological Trust Graph Properties:** Formalize schema definitions capturing: *WHO created it?*, *WHAT did it depend on?*, *WHICH authority approved it?*, *WHICH version of canon did it use?*, *WHICH software produced it?*, *CAN it change?*, *CAN it become authoritative?*, and *HOW can it be revoked?*. Enforce mandatory early validation on the two core fields: **who approved it** (`approved_by`) and **which canon version it used** (`canon_version`).


2. **Explicit Authority Level Hierarchy:** Stamp every governed fact and artifact with an `AuthorityLevel` enum (`AXIOM`, `CANON`, `EVENT`, `RUNTIME_STATE`, `PROJECTION`, `SPECULATION`) so that downstream prose or media projections can never silently escalate into canonical fact.


3. **Cryptographic Writer Isolation & Three-Part Lock:** Enforce that trust edges can only be appended by the specific component that performed the act (compiler vs. human gate). Lock historical reproducibility to the **Three-Part Lock** trifecta: `canon_version`, `action_vocabulary_version` (`verb_families.json`), and `schema_version`.




* **Falsifiable Acceptance Criteria:** Any attempt by a `PROJECTION` or `SPECULATION` artifact to mutate `CANON` without a signed human approval edge is rejected at compile time.



---

### Phase 2: Epistemic Firewall, Action Ontology & Clue-Disjointness Kernels

**Phase Mandate:** Construct the compile-time linguistic and epistemic gates inside `packages/001.lore` that prevent characters from executing physically impossible motor actions or leaking forbidden world secrets.

#### [TASK-GL-2.1] Canonical Action Ontology (`verb_families.json`) & Dual-Field Lexical Gate

* **Target File Manifest:** `packages/001.lore/schemas/ontology/verb_families.json`, `packages/001.lore/src/linters/lexicalGate.ts`, `packages/001.lore/src/linters/evalSet.json`.


* **Technical Subtasks & Implementation Nuance:**
1. **Canonical Action Ontology:** Author `verb_families.json` mapping discrete kinetic verb lemmas and capability requirements directly to somatic conditions and bitmasks.


2. **Dual-Field Action Union & Metaphor Disambiguation:** Build `lexicalGate.ts` to evaluate the union of self-reported AST actions and prose-extracted verbs ($\text{CombinedActions} = \text{Actions}_{\text{self\_reported}} \cup \text{Actions}_{\text{prose\_extracted}}$) against `BannedVerbs(Subject)` in $O(1)$ set-intersection time, while disambiguating physical direct objects from abstract or metaphorical objects (e.g., *"grasping fate"* vs. *"grasping the lever"*).


3. **Golden Evaluation Benchmark:** Validate linter precision and recall Wilson lower bounds against all 210 test cases in `packages/001.lore/src/linters/evalSet.json`.




* **Falsifiable Acceptance Criteria:** Any vocabulary edit to `verb_families.json` must pass all 210 test cases in `linters/evalSet.json` without degrading precision/recall Wilson lower bounds.



#### [TASK-GL-2.2] Multi-Valued Epistemic Horizons & $O(L)$ Trie Clue-Disjointness Verifier

* **Target File Manifest:** `packages/001.lore/schemas/unresolved.schema.ts`, `unresolved.json`, `packages/001.lore/src/health/crossVectorCoherence.ts`, `packages/001.lore/src/health/trieClueDisjointness.ts`, `packages/001.lore/src/linters/epistemicLinter.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Epistemic Horizon Enum:** Implement ` crossVectorCoherence.ts` and `unresolved.schema.ts` to enforce `EpistemicHorizonEnum` (`TOTAL_IGNORANCE`, `RUMOR_ONLY`, `FALSE_BELIEF`, `PARTIAL_FACT`, `WITHHELD`) across character knowledge states.


2. **Linear-Time Prefix-Tree (Trie) Disjointness Kernel:** Build `trieClueDisjointness.ts` to verify that permitted clue tokens and forbidden trigger lemma sets are strictly disjoint ($P_{\text{clues}} \cap \bigcup T_{\text{lemmas}} = \emptyset$) in $O(L)$ linear time before downstream compilation.


3. **Canonical 4-Tuple Error Signature Vector:** Format every unaware-carrier breach trapped by `epistemicLinter.ts` / `scripts/lint-prose.ts` into the canonical 4-tuple Error Signature Vector for automated `repo-bot` trajectory arbitration.




* **Falsifiable Acceptance Criteria:** Overlapping a whitelisted clue token with a banned mystery lemma in `unresolved.json` immediately halts `trieClueDisjointness.ts` at Stage $T_0 = \$0.00$.



#### [TASK-GL-2.3] Split Parenthetical AST Contract, Blind Probe Schemas & Pacing Manifests

* **Target File Manifest:** `packages/001.lore/schemas/dialogue_ast.json`, `packages/001.lore/src/types/dialogueAst.ts`, `packages/001.lore/schemas/epistemic.ts`, `packages/001.lore/schemas/epistemicAudience.ts`, `packages/001.lore/src/gates/pacingGates.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Split Parenthetical Schema (`TASK-EPI-01.1`):** Replace the legacy single `parenthetical` string in `DialogueLineASTSchema` with two mandatory, non-empty string properties: `camera_parenthetical` (audience/Remotion optical staging) and `observable_parenthetical` (interlocutor-safe blocking), alongside `extracted_motor_actions`.


2. **Blind Implicature Probe Schemas:** Define `BlindProbeInputSchema` and `BlindImplicatureReceiptSchema` in `packages/001.lore/schemas/epistemic.ts` with `.strict()` Zod validation, structurally rejecting any payload containing `camera_parenthetical`, `emotion`, or internal reasoning traces.


3. **5-Mode Dramatic Pacing & Epistemic Manifests (`TASK-PAC-03.1a/b` & `TASK-PAC-03.2a/b`):** Extend `DramaticPacingMode` in `epistemicAudience.ts` to support `'SHARED_RECOGNITION'` (`'IRONIC_RECKONING'`) and define `EpistemicManifestSchema` (`scene_id`, `focal_proposition_id`, `active_pacing_mode`, `prior_pacing_mode`, `audience_exposure_ref` with 64-char `visibility_hash`, `actor_horizon_snapshot`, `callback_boomerang_ids`, and `manifest_sha256`). Enforce topological depth ($\delta \ge 2$) and the Premature Climax Guard in `pacingGates.ts`.




* **Falsifiable Acceptance Criteria:** Passing an AST node with the legacy `parenthetical` key or injecting `camera_parenthetical` into `BlindProbeInputSchema` throws a fatal `ZodError` at $T_0 = \$0.00$.



---

### Phase 3: Creative Ingestion Funnel, Grievance DAG & Farce Cap Governance

**Phase Mandate:** Bridge unstructured creative ideation from Slack and writer notes into normalized, mathematically bounded grievance DAGs and reciprocally linked spatial topologies inside `goblin-lore`.

#### [TASK-GL-3.1] 4-Tier Creative Ingestion Funnel (`vault/ingest/`) & HDBSCAN Resonance Audit

* **Target File Manifest:** `vault/ingest/`, `unresolved.json`, `scripts/softLinker.ts`, `scripts/clusterStaging.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Tier 1 & Tier 2 Normalized Persistence:** Mirror unformatted multi-modal drops (text notes, texture PNGs, audio memos) from Slack (`#research-wallpaper`, `#research-color`, `#creative`, `#writing`) into `vault/ingest/` with `status: "raw"`, running an asynchronous Soft Linker that tags candidate entity slugs via lemma co-occurrence without altering authorial prose.


2. **Tier 3 Dual-Trigger Ingress & Joint Semantic Projection:** Support both scheduled weekly Meso-Horizon sweeps (`0 0 * * 1` every Monday at 00:00 UTC) and on-demand `!ResearchDigest <topic>` commands. Project prose notes (`text-embedding-3-small`, 1536-d vector $V_{\text{text}}$) and visual assets (`DINOv2` / `SigLIP`, 768-d vector $V_{\text{vis}}$) into a joint semantic space ($V_{\text{joint}} = \alpha \cdot V_{\text{text}} \oplus \beta \cdot V_{\text{vis}}$), clustering motifs via HDBSCAN and auditing resonance against `01.canon` spatial adjacency, somatic masks, and epistemic secrets in `unresolved.json`.




* **Falsifiable Acceptance Criteria:** Raw creative drops in `vault/ingest/` preserve unmodified prose while emitting HDBSCAN cluster manifests pre-checked against `unresolved.json`.



#### [TASK-GL-3.2] Tier 4 Proposal Gate (`!PitchGrievance`), Farce Cap Linter & Reciprocal Spatial Links

* **Target File Manifest:** `grievances/*.md` (`grievances/initial_tension.md`), `locations/*.md`, `scripts/compile.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Tier 4 Proposal Gate (`!PitchGrievance`):** Compile validated thematic clusters into formal `grievances/*.md` files containing an immutable slug `id`, `participants_primary` (length strictly 2), intensity envelope $[I_{\min}, I_{\max}]$, `cooldown_cycles`, decay rates, and `spawns_on_max_escalation` DAG targets.


2. **Tonal Override Pool (Farce Cap) Invariant:** Enforce in `scripts/compile.ts` that intentionally shallow grievances (`tonal_override_eligible: true`) never exceed 15% of the canonical corpus:

$$\text{Ratio}_{\text{tonal}} = \frac{\vert{}\{g \in \mathcal{G} \mid g.\text{tonal\_override} = \text{true}\}\vert{}}{\vert{}\mathcal{G}\vert{}} \le 0.15$$



and assert that farce grievances hold $I_{\max} \le 2$ and spawn zero child grievances.


3. **Reciprocal Spatial Linking:** Automate location graph wiring so connecting two location nodes (`loc_*`) automatically appends mutual adjacency links to neighbor dossiers while preserving Byte-0 frontmatter integrity.




* **Falsifiable Acceptance Criteria:** Adding a farce grievance that pushes $\text{Ratio}_{\text{tonal}} > 0.15$, sets $I_{\max} > 2$, or introduces a one-way spatial portal causes `scripts/compile.ts` to exit with a non-zero error code.



---

### Phase 4: The 3-Pass Offline Compiler ($T_0 = \$0.00$) & Cryptographic $H_{\text{root}}$ Sealing

**Phase Mandate:** Compile the human-authored Markdown dossiers into the deterministic, cryptographically sealed `compiled/<seriesSlug>/bible-state.json` artifact that serves as the read-only constitution for all downstream edge and local runtimes.

#### [TASK-GL-4.1] 3-Pass Offline Canon Compiler (`scripts/compile.ts`) & Integer Basis-Point Math

* **Target File Manifest:** `scripts/compile.ts`, `packages/001.lore/src/client.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Pass 1 (Syntax, Schema & Integer Basis-Point Clamping):** Validate all incoming YAML frontmatter against strict Zod schemas. Prohibit floating-point math; enforce integer basis points ($0 \text{ to } 10{,}000$, where $10{,}000 = 1.0$) across all physical constants, acoustic damping parameters, and tension weights.


2. **Pass 2 (Relational DAG & Foreign-Key Integrity):** Walk the entire entity hypergraph (`characters`, `locations`, `possessions`, `grievances`) to guarantee **zero dangling pointers** (no broken foreign keys) and verify DAG acyclicity across `spawns_on_max_escalation` trees.


3. **Pass 3 (Static Somatic/Logistical SAT Verification):** Verify static satisfiability across initial entity states (e.g., asserting equipped items do not exceed `handCapacity` or conflict with `somaticCapabilityMask`).




* **Falsifiable Acceptance Criteria:** Introducing a dangling foreign key or a hand-slot overflow in any `.md` dossier immediately throws a compile-time error in `scripts/compile.ts` before emitting JSON.



#### [TASK-GL-4.2] RFC 8785 Canonicalization, Atomic POSIX Swap & Merkle Root ($H_{\text{root}}$) Sealing

* **Target File Manifest:** `packages/001.lore/src/core/canon/merkleVerifier.ts`, `scripts/compile.ts`, `compiled/<seriesSlug>/bible-state.json`.


* **Technical Subtasks & Implementation Nuance:**
1. **RFC 8785 JSON Canonicalization Scheme (JCS):** Implement deterministic serialization in `merkleVerifier.ts` by recursively sorting dictionary keys lexicographically by UTF-16 code units and formatting numbers and whitespace deterministically.


2. **SHA-256 Merkle Root Digest ($H_{\text{root}}$):** Compute the 64-character hex SHA-256 digest of the canonical payload and stamp it into `_meta.state_hash` alongside `seriesSlug`, `version`, and `compiled_at_iso`.


3. **Atomic Write & Freshness Assertion:** Serialize the verified canon to disk via an atomic `.tmp_[UUIDv7]` sibling write followed by a POSIX `fs.renameSync` swap into `compiled/<seriesSlug>/bible-state.json`, asserting canon timestamp freshness ($t(\text{bible-state.json}) \ge t(\text{characters/})$ and $t(\text{bible-state.json}) \ge t(\text{grievances/})$).




* **Falsifiable Acceptance Criteria:** RFC 8785 canonicalization produces bit-identical SHA-256 hashes regardless of input key ordering, and single-byte payload tampering triggers an immediate `HASH_MISMATCH` rejection.



#### [TASK-GL-4.3] Read-Only Runtime Ingestion Client (`bibleLoader.ts`) & Recursive `deepFreeze<T>()`

* **Target File Manifest:** `packages/001.lore/src/core/canon/bibleLoader.ts`, `packages/001.lore/src/core/canon/merkleVerifier.ts`, `packages/001.lore/test/client.test.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Recursive Immutability (`deepFreeze<T>()`):** Implement and export `deepFreeze<T>(obj: T)` (`TASK-PAC-03.1c`) to recursively apply `Object.freeze()` across the root `BibleState` object and all nested child properties, arrays, and dictionaries upon ingestion.


2. **D1 `CANON_DB` Parity Gateway (`verifyCanonDbMerkle`):** Query Cloudflare D1 `CANON_DB` (`SELECT state_hash, is_dirty FROM canon_metadata WHERE series_slug = ?`). If the record is missing, `state_hash !== expectedHash`, or `is_dirty === 1`, trip the circuit breaker (`{ valid: false, reason: 'CANON_DESYNC_HALT', isDirty: true }`) and halt execution so zero scenes are generated against un-synchronized canon.




* **Falsifiable Acceptance Criteria:** Attempting to mutate any property or array inside the loaded `SealedBibleState` throws a strict-mode `TypeError` at runtime, verified by `test/client.test.ts`.



---

### Phase 5: Canon Lifecycle Standing, Harvest Ratification & Append-Only Errata

**Phase Mandate:** Govern how canonical facts evolve over multi-season production via the Asymmetric Staging Membrane, the Tri-State Epistemological Standing lifecycle, recursive blast-radius invalidation, and the Append-Only Errata protocol.

#### [TASK-GL-5.1] Asymmetric Staging Membrane (`LoreStagingDO`) & Human Ratification Promotion

* **Target File Manifest:** `apps/worker/src/objects/LoreStagingDO.ts`, `characters/*.md`, `possessions/*.md`.


* **Technical Subtasks & Implementation Nuance:**
1. **Human Ratification Boundary ($\text{Runtime Fact} \neq \text{Canonical Fact}$):** Quarantine emergent props or unindexed tangible nouns with dramatic salience $S \ge 0.70$ inside the D1 `unratified_details` table and `LoreStagingDO` under the **Dual-Clock Lease Architecture** (Clock A: 5-minute interactive `WRITE_MUTEX` heartbeat; Clock B: 72-hour draft retention TTL).


2. **NotebookLM Canon Retro-Injection & Archival PR Gate:** Route ratified details and NotebookLM (`4f1ac5b5-8c6f-4629-83ec-4b81910c4605`) candidate envelopes onto ephemeral Git branches (`staging/writer-drafts`, `candidate-entities`) with `git-notes` provenance receipts (`fact_id`, `event_id`, `episode_id`, `rule_version`, `approved_by`, `approved_at_revision`), merging into `001.goblin-lore` via an archival Git PR gate so local NVMe hardware retains exclusive legislative authority to re-seal `bible-state.json` ($H_{\text{root}}$).




* **Falsifiable Acceptance Criteria:** Unratified runtime details never mutate `bible-state.json`; ratifying a detail commits a provenance-stamped dossier to `001.goblin-lore` and re-seals $H_{\text{root}}$.



#### [TASK-GL-5.2] Tri-State Epistemological Standing ("Still Good" Protocol) & Segmented Git-Notes

* **Target File Manifest:** `packages/001.lore/schemas/standing.ts`, `refs/notes/*`, `src/core/ledger/invalidation.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Tri-State Canon Lifecycle (`canon_entities` Standing):** Implement the three lifecycle states across all canonical facts:
* `ACTIVE_ENDORSED`: Enforced by downward compilation gates.


* `FLAGGED_FOR_REVIEW`: Renders an amber advisory badge in `goblin-dashboard` while triggering **zero** `is_dirty = 1` invalidation cascades.


* `DEPRECATED_ARCHIVED`: Triggers an atomic `is_dirty = 1` cascade across `scene_fact_dependencies` via the 5-stage **Stigmergic Propagation Loop** (Commit Ingress $\to$ Metadata Parse $\to$ Reverse Graph CTE $\to$ D1 Flag $\to$ WSS Broadcast).




2. **5-Second "Still Good" Reconsideration Priority:** Compute the reconsideration priority metric:

$$\text{Audit Priority Score} = \text{Days Since Reconsideration} \times \log_{10}(\text{Downstream Dependent Scenes} + 1)$$



allowing showrunners to reaffirm facts without bumping version integers or mutating $H_{\text{root}}$.


3. **Segmented Git-Notes Ledger (`Task 1.3`):** Configure `refs/notes/*` (`refs/notes/prompt-telemetry`, `refs/notes/provenance`) and edge refspecs in `001.goblin-lore` to attach audit telemetry to commits without polluting Git commit SHAs or invalidating `bible-state.json`.




* **Falsifiable Acceptance Criteria:** Transitioning a fact to `FLAGGED_FOR_REVIEW` causes zero `is_dirty = 1` flags in D1, whereas transitioning to `DEPRECATED_ARCHIVED` marks all transitive dependent scenes dirty and traces the exact hop chain via `$ sower why-dirty <id>` in $< 50\text{ ms}$.



#### [TASK-GL-5.3] Append-Only Errata Protocol, Multi-Repo `Expand -> Migrate -> Contract` Saga & QA Gauntlet

* **Target File Manifest:** `lore/errata.json`, `backups/bible-state_pre_task.json`, `packages/001.lore/test/client.test.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Append-Only Errata Protocol (`Task 4.3`):** Record post-broadcast canon corrections in an append-only ledger so historical media and `render_manifest.json` sidecars remain permanently verifiable against their original `canon_version` and $H_{\text{root}}$.


2. **Multi-Repo `Expand -> Migrate -> Contract` Saga & `RESET_TO_SEAL` (`TASK-2.4`):** Coordinate cross-repo schema changes in strict alphanumeric order (`["goblin-bible", "goblin-config", "worker-sower-engine"]`). Maintain pre-task state backups (`backups/bible-state_pre_task.json`) so that if a scope breach (`SCOPE_FIREWALL_BREACH`) or 3-strike circuit breaker fires, Stage 4 local sanitation immediately restores `compiled/bible-state.json` and resets the Git working tree (`git checkout main && git clean -fdx`).


3. **Manifest Reachability Crawl (`Task 5.3`):** Expose `001.goblin-lore`'s `bible-state.json` hashes to the Multi-Repository Manifest Crawler so event-referenced intermediates are permanently retained in WORM Content-Addressed Storage.




* **Falsifiable Acceptance Criteria:** Triggering `RESET_TO_SEAL` or a 4-stage saga rollback restores `compiled/bible-state.json` to bit-for-bit parity with `backups/bible-state_pre_task.json` and passes the Tripartite Anti-Gaming Negative Controls in `test/client.test.ts`.



---

### Summary Task Matrix for `goblin-lore` (`001.goblin-lore`)

| Phase | Task ID | Task Scope | Primary Target Files in `goblin-lore` | Verification Gate |
| --- | --- | --- | --- | --- |
| **Phase 1** | **TASK-GL-1.1** | Byte-0 Frontmatter & Tri-Partite Vector Schemas

 | `schemas/entities.ts`, `src/core/canon/types.ts`, `characters/*.md`<br> | `tsc --noEmit` & Byte-0 hex check

 |
| **Phase 1** | **TASK-GL-1.2** | Entity Scaffolder & Refusal Vector Contract

 | `entityBuilder.ts`, `01.series.unit/buz/series.buzz.ts`<br> | `SCAFFOLD_ENTITY` Dual-Rail test

 |
| **Phase 1** | **TASK-GL-1.3** | Trust Graph Ontology & Authority Levels

 | `schemas/trustGraph.ts`, `schemas/index.ts`<br> | Authority escalation negative control

 |
| **Phase 2** | **TASK-GL-2.1** | Action Ontology & Dual-Field Lexical Gate

 | `schemas/ontology/verb_families.json`, `src/linters/lexicalGate.ts`<br> | 210 cases in `linters/evalSet.json`<br> |
| **Phase 2** | **TASK-GL-2.2** | Epistemic Horizons & $O(L)$ Clue-Disjointness Trie

 | `unresolved.json`, `src/health/trieClueDisjointness.ts`<br> | Disjointness invariant $P_{\text{clues}} \cap \bigcup T_{\text{lemmas}} = \emptyset$<br> |
| **Phase 2** | **TASK-GL-2.3** | Split Parenthetical AST, Blind Probe & Pacing Schemas

 | `schemas/dialogue_ast.json`, `schemas/epistemic.ts`, `schemas/epistemicAudience.ts`<br> | `.strict()` Zod gate at $T_0 = \$0.00$<br> |
| **Phase 3** | **TASK-GL-3.1** | 4-Tier Creative Ingestion & HDBSCAN Clustering

 | `vault/ingest/`, `unresolved.json`<br> | Joint embedding $V_{\text{joint}}$ resonance check

 |
| **Phase 3** | **TASK-GL-3.2** | `!PitchGrievance` Gate, Farce Cap & Reciprocal Links

 | `grievances/*.md`, `locations/*.md`, `scripts/compile.ts`<br> | Farce ratio $\le 0.15$ & portal symmetry

 |
| **Phase 4** | **TASK-GL-4.1** | 3-Pass Offline Compiler & Basis-Point Arithmetic

 | `scripts/compile.ts`, `src/client.ts`<br> | Zero dangling pointers & SAT pass

 |
| **Phase 4** | **TASK-GL-4.2** | RFC 8785 JCS Canonicalizer & Atomic $H_{\text{root}}$ Swap

 | `src/core/canon/merkleVerifier.ts`, `compiled/<series>/bible-state.json`<br> | Key-order hash invariance & freshness check

 |
| **Phase 4** | **TASK-GL-4.3** | Read-Only `bibleLoader.ts` & Recursive `deepFreeze`<br> | `src/core/canon/bibleLoader.ts`, `test/client.test.ts`<br> | Strict-mode `TypeError` on mutation

 |
| **Phase 5** | **TASK-GL-5.1** | `LoreStagingDO` Membrane & Ratification Stamper

 | `LoreStagingDO.ts`, `characters/*.md`, `possessions/*.md`<br> | Provenance commit & $H_{\text{root}}$ re-seal

 |
| **Phase 5** | **TASK-GL-5.2** | Tri-State Standing ("Still Good") & Git-Notes

 | `schemas/standing.ts`, `refs/notes/*`, `invalidation.ts`<br> | Zero cascade on `FLAGGED_FOR_REVIEW`<br> |
| **Phase 5** | **TASK-GL-5.3** | Errata Protocol, Multi-Repo Saga & Restore Drills

 | `lore/errata.json`, `backups/bible-state_pre_task.json`, `test/client.test.ts`<br> | `RESET_TO_SEAL` snapshot parity

 |

Would you like to convert **Phase 1 & Phase 4 (`scripts/compile.ts`, `merkleVerifier.ts`, and `bibleLoader.ts`)** into an executable `@jules-task-00` coding agent prompt for `goblin-lore`?