### Master Repository Task Specification: Ground-Truth Physical State (Authority Boundary Enforcement)

* **Primary Target Repository:** `astro-kahn-it-com/001.goblin-lore` (Cluster `01.canon` / `packages/001.lore`).


* **Core Mandate:** Establish the concrete software mechanisms that enforce the ontological authority boundary around physical reality. Generative models (LLMs, neural TTS, image/video diffusion) are classified as untrusted, stateless rendering workers with **zero authority** over world truth, spatial presence, anatomical possibility, or material physics.


* **The Local-First Relational Law:** All five phases operate exclusively against a **local SQLite database** (`better-sqlite3`, `node:sqlite`, or `pilot.db` / in-memory `:memory:`) on local workstation silicon. No remote Cloudflare D1 bindings, edge Workers, or network RPCs may be invoked until all local physical state checks and adversarial traps pass with 100% compliance at Stage $T_0 = \$0.00$.


* **Zero Redundancy Guarantee:** This specification does not replicate the previously authored baseline frontmatter parsers, generic hand-capacity arithmetic, action verb taxonomy files, basic grievance DAG acyclicity linters, RFC 8785 Merkle sealers, or high-level editorial standing lifecycles. It focuses exclusively on the runtime mechanics of physical ground truth and authority boundary containment.



```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       GROUND-TRUTH PHYSICAL STATE ENFORCEMENT STACK                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  PHASE 1: SPATIAL CO-PRESENCE, MATTER CONSERVATION & VOCAL-MOTOR FEASIBILITY                │
│  ├── *[TASK-GPS-1.1] Spatial Presence & Absolute Item Disjointness Schema                    │
│  ├── *[TASK-GPS-1.2] The Vocal-Motor Feasibility Theorem Engine (vocalFeasibility.ts)        │
│  └── *[TASK-GPS-1.3] Local SQLite Physical Entity Ledger (localSpatialSomaticLedger.ts)      │
│                                                                                             │
│  PHASE 2: DYNAMIC ENVIRONMENTAL OVERLAYS & MATERIAL DEGRADATION KERNEL                      │
│  ├── *[TASK-GPS-2.1] Material State Vector & Structural Integrity Schema                     │
│  ├── *[TASK-GPS-2.2] Dynamic Environmental Overlay & Friction Engine (environmentalOverlay.ts)│
│  └── *[TASK-GPS-2.3] Local SQLite Material Feasibility Gate (materialFeasibility.ts)        │
│                                                                                             │
│  PHASE 3: THE CARTESIAN SENSORY FIREWALL & SENSORY PERCEPT FILTRATION                       │
│  ├── *[TASK-GPS-3.1] The Formal Four-Stage Cartesian Pipeline Contract (F -> G -> H -> J)   │
│  ├── *[TASK-GPS-3.2] Acoustic Attenuation & Line-of-Sight Ray-Caster (acousticOcclusion.ts)   │
│  └── *[TASK-GPS-3.3] Local SQLite Sensory Percept Ledger (perceptFilter.ts)                  │
│                                                                                             │
│  PHASE 4: NON-PARDONABLE INVARIANT ENFORCEMENT & THE PARDON LEDGER                          │
│  ├── *[TASK-GPS-4.1] The Non-Pardonable Invariant Classification Schema (pardon.schema.ts)   │
│  ├── *[TASK-GPS-4.2] Local SQLite Pardon Ledger & Tamper Guard (localPardonLedger.ts)        │
│  └── *[TASK-GPS-4.3] Cryptographic Waiver Gate & Hard Invariant Interceptor                  │
│                                                                                             │
│  PHASE 5: ADVERSARIAL PENETRATION SUITE & GATED UPSTREAM D1 PHYSICAL SYNC                   │
│  ├── *[TASK-GPS-5.1] Five-Vector Physical State Adversarial Injection Test Battery           │
│  ├── *[TASK-GPS-5.2] Automated Local SQLite Execution Trap Harness                           │
│  └── [TASK-GPS-5.3] Gated Upstream D1 Physical Core Migration Bridge (syncPhysicalCoreToD1)│
└─────────────────────────────────────────────────────────────────────────────────────────────┘

```

---

### Phase 1: Spatial Co-Presence, Matter Conservation & Vocal-Motor Feasibility

**Phase Mandate:** Implement local SQLite schemas and compile-time checkers that prevent generative models from violating fundamental conservation of matter, teleporting items across disconnected spatial zones, or attributing speech to anatomically muted or deceased characters.

#### [TASK-GPS-1.1] Spatial Presence & Absolute Item Disjointness Schema

* **Target File Manifest:** `packages/001.lore/src/schemas/physicalPlacement.ts`, `packages/001.lore/src/scaffolder/spatialPresenceSolver.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Absolute Spatial Disjointness Invariant:** Define `PhysicalPlacementSchema` with `.strict()` validation. Require that every physical entity (actors and tangible props) exists at exactly **one** physical location coordinate (either a discrete `room_id` or an axial integer hex coordinate $(q, r)$) at tick $T$.


2. **Disjoint Possession Allocation:** Enforce that a possession cannot be simultaneously equipped by an actor and resting in a room container:

$$\text{Holders}(item) \cap \text{Containers}(item) = \emptyset \quad \land \quad \vert{}\text{Holders}(item)\vert{} \le 1$$



Halting with `MASS_CONSERVATION_BREACH` at $T_0 = \$0.00$ if an LLM script depicts an item held by two independent characters simultaneously without an explicit transfer event.


3. **Spatial Co-Presence Satisfiability Solver (`spatialPresenceSolver.ts`):** Before allowing a character to interact with, pick up, or strike another entity or prop, calculate topological co-presence in $O(1)$ time. If `actor.location_id !== target.location_id`, immediately halt compilation with `SPATIAL_CO_PRESENCE_VIOLATION`.




* **Falsifiable Acceptance Criteria:** A test scene script where an actor at `loc_culvert` picks up an item situated at `loc_pump_house` fails closed at $T_0 = \$0.00$ with exit code 1.



#### [TASK-GPS-1.2] The Vocal-Motor Feasibility Theorem Engine (`vocalFeasibility.ts`)

* **Target File Manifest:** `packages/001.lore/src/linters/vocalFeasibility.ts`, `packages/001.lore/src/schemas/somaticTrauma.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Anatomical Speech Precondition Schema:** Author `SomaticTraumaSchema` capturing physiological respiratory and vocal conditions (`cond_severed_trachea`, `cond_crushed_larynx`, `cond_punctured_lung`, `cond_unconscious`, `cond_departed`).


2. **The Vocal-Motor Feasibility Theorem:**

$$\text{Actor.has\_verbal\_directives} \implies (\text{"mute"} \notin \text{Actor.conditions} \land \text{"speak"} \notin \text{Actor.banned\_verbs} \land \text{Actor.vitality\_bps} > 0)$$




If a screenplay or AST contains a spoken dialogue turn (`dialogue_text.length > 0`) attributed to an actor with vocal-tract trauma, `vocalFeasibility.ts` intercepts the turn, halting compilation with `VOCAL_FEASIBILITY_BREACH`.


3. **Physical Gasp & Exertion Exception Handler:** Permit non-verbal acoustic expressions (e.g., gasping, choking, guttural coughing) only if explicitly tagged as `observable_parenthetical` non-verbal cues while dialogue text remains completely empty (`dialogue_text: ""`).




* **Falsifiable Acceptance Criteria:** Attempting to assign dialogue to an actor bearing `cond_severed_trachea` or status `departed` throws a fatal compile-time exception and logs `[FAIL] VOCAL_FEASIBILITY_BREACH`.



#### [TASK-GPS-1.3] Local SQLite Physical Entity Ledger (`localSpatialSomaticLedger.ts`)

* **Target File Manifest:** `packages/001.lore/src/db/localSpatialSomaticLedger.ts`, `packages/001.lore/migrations/0002_physical_state_core.sql`.


* **Technical Subtasks & Implementation Nuance:**
1. **Local SQLite Physical Schema:** Author `0002_physical_state_core.sql` creating:
* `entities_physical`: `id TEXT PRIMARY KEY`, `location_id TEXT NOT NULL`, `vitality_bps INTEGER NOT NULL`, `consciousness_status TEXT CHECK(consciousness_status IN ('AWAKE', 'STUNNED', 'UNCONSCIOUS', 'DECEASED'))`, `updated_at_tick INTEGER NOT NULL`.


* `item_placements`: `item_id TEXT PRIMARY KEY`, `carrier_type TEXT CHECK(carrier_type IN ('ROOM', 'ACTOR_SLOT')) NOT NULL`, `carrier_id TEXT NOT NULL`, `slot_name TEXT`, `is_secured INTEGER NOT NULL DEFAULT 1`.




2. **Local SQLite Transit Validation (`recordPhysicalMove`):** Ensure an actor's `location_id` can only update if an edge exists in the topological adjacency table (`room_portals`). Teleportation across non-adjacent nodes without a traversal path is rejected at the SQLite transaction boundary.


3. **Strict In-Memory / File-Lock Execution:** Back the engine with `better-sqlite3` operating against `pilot.db` or `:memory:`, achieving $< 1.5\text{ ms}$ validation latency without network calls.




* **Falsifiable Acceptance Criteria:** Inserting an invalid item placement where one item exists in two locations triggers a foreign key or unique constraint violation in local SQLite.



---

### Phase 2: Dynamic Environmental Overlays & Material Degradation Kernel

**Phase Mandate:** Bind physical objects and spatial environments to deterministic material degradation rules (water damage, corrosion, structural fatigue) in local SQLite so generative models cannot invent functional machinery or dry resources in hostile environments.

#### [TASK-GPS-2.1] Material State Vector & Structural Integrity Schema

* **Target File Manifest:** `packages/001.lore/src/schemas/materialState.ts`, `packages/001.lore/src/schemas/environmentalOverlay.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Material State Vector Contract:** Define `MaterialStateVectorSchema` tracking physical properties in integer basis points ($0 \le x \le 10{,}000$):


* `wetness_bps`: $10{,}000 \equiv$ completely submerged.


* `corrosion_bps`: Rust and oxidative decay.


* `structural_integrity_bps`: Remaining tensile/impact resistance ($0 \equiv$ shattered/broken).


* `combustibility_tier`: `IMMUNE`, `IGNITABLE`, `HIGHLY_VOLATILE`.




2. **Environmental Threshold Invariants:** Formalize deterministic threshold equations:



$$\text{wetness\_bps} > 3000 \implies \text{combustibility} = \text{'IMMUNE'}$$


$$\text{structural\_integrity\_bps} = 0 \implies \text{is\_operable} = \text{false}$$



Any generative prompt or screenplay beat that attempts to ignite wet matches or operate an item with zero integrity is rejected at compile time.




* **Falsifiable Acceptance Criteria:** An input declaring that an item with `wetness_bps = 8000` is "ignited by a match" throws `MATERIAL_STATE_CONFLICT` during schema parsing.



#### [TASK-GPS-2.2] Dynamic Environmental Overlay & Friction Engine (`environmentalOverlay.ts`)

* **Target File Manifest:** `packages/001.lore/src/core/environment/environmentalOverlay.ts`, `packages/001.lore/src/schemas/environmentalOverlay.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Environmental Zone Overlay Schema:** Author `EnvironmentalOverlaySchema` with fields for `ambient_lux` (integer illumination level), `flooded_depth_cm` (standing water level), `mud_friction_bps` (locomotion resistance), and `airborne_particulate_bps` (smoke, spore, or dust density).


2. **Locomotion Degradation Calculation:** Compute the real-time movement budget deduction based on environmental friction:



$$\text{EffectiveMovementBudget} = \text{BaseMovementBudget} \times \left(1 - \frac{\text{mud\_friction\_bps}}{10{,}000}\right)$$



When standing water exceeds $50\text{ cm}$, append `banned_kinetic_verbs: ["SPRINT", "VAULT"]` dynamically to all actors present in the zone.




* **Falsifiable Acceptance Criteria:** In a room with `flooded_depth_cm: 60`, an actor attempting `SPRINT` is intercepted by `environmentalOverlay.ts` and rejected with `ENVIRONMENTAL_LOCOMOTION_HALT`.



#### [TASK-GPS-2.3] Local SQLite Material Feasibility Gate (`materialFeasibility.ts`)

* **Target File Manifest:** `packages/001.lore/src/linters/materialFeasibility.ts`, `packages/001.lore/src/db/localEnvironmentalLedger.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Local SQLite Ledger Integration:** Instantiate `material_states` and `environment_zones` tables in local SQLite.


2. **Cross-Entity Operation Feasibility Linter:** Build `materialFeasibility.ts` to inspect incoming screenplay actions against the local SQLite database. Verify that:


* Tools or weapons flagged with `corrosion_bps > 9000` cannot clear mechanical manipulation checks.


* Fragile glass containers dropped on stone surfaces with impact force $> 2000\text{ bp}$ transition their integrity to $0$ and spawn sharp debris shards in the local room table.




3. **Zero Network Egress:** Ensure the entire material check resolves in $< 2\text{ ms}$ on local disk via `better-sqlite3`.




* **Falsifiable Acceptance Criteria:** Operating a seized rusted winch (`corrosion_bps: 9500`) halts compilation at $T_0 = \$0.00$ with diagnostic `MECHANICAL_FAILURE_IMMUTABLE`.



---

### Phase 3: The Cartesian Sensory Firewall & Sensory Percept Filtration

**Phase Mandate:** Implement the formal four-stage Cartesian epistemic pipeline ($F \to G \to H \to J$) in local SQLite, mathematically preventing generative agents from reacting to events or perceiving objects that are physically occluded by acoustic barriers or opaque geometry.

#### [TASK-GPS-3.1] The Formal Four-Stage Cartesian Pipeline Contract ($F \to G \to H \to J$)

* **Target File Manifest:** `packages/001.lore/src/core/cartesian/cartesianFirewall.ts`, `packages/001.lore/schemas/cartesian.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Enforce Functional Separation of Reality from Belief:** Formally encode the directional sequence as pure TypeScript pipeline functions:
* $F(\text{Topology}, \text{DynamicOverlay}, \text{ActorState}, \text{Time}, \text{Ruleset}) \to \text{PhysicalOpportunity}$

* $G(\text{PhysicalEvents}, \text{PhysicalEnvironment}, \text{SensoryCapabilities}) \to \text{Percept}$

* $H(\text{Percepts}, \text{PriorBeliefs}, \text{InferenceRules}) \to \text{Belief}$

* $J(\text{Beliefs}, \text{Intentions}) \to \text{Expression}$ (Untrusted Generation)




2. **Directional Boundary Enforcement:**
* $F$ must never import or inspect $H$ (Physical opportunity cannot depend on character belief).


* $H$ must never directly read raw topology or the global fact ledger (Characters cannot possess omniscient awareness of unobserved geometry).


* $J$ (Generative Scripting) must never bypass $H$ to read physical ground truth directly.






* **Falsifiable Acceptance Criteria:** Any module import or function call where $J$ attempts to read `entities_physical` directly without an intermediate `BeliefRecord` is trapped by an ESLint/TypeScript boundary rule with exit code 1.



#### [TASK-GPS-3.2] Acoustic Attenuation & Line-of-Sight Ray-Caster (`acousticOcclusion.ts`)

* **Target File Manifest:** `packages/001.lore/src/health/acousticOcclusion.ts`, `packages/001.lore/src/core/cartesian/lineOfSight.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Acoustic Occlusion Decibel Attenuation Kernel:** Compute sound propagation across room boundaries in integer centibels ($1\text{ dB} \equiv 100\text{ cB}$):



$$\text{ReceivedSNR} = \text{SourceSoundPower\_cB} - \sum \text{WallDamping\_cB} - \text{AmbientNoise\_cB}$$



If $\text{ReceivedSNR} \le 0$, the acoustic event is physically undetectable by the listener.


2. **Topological Line-of-Sight (LoS) Ray-Caster:** Compute optical visibility between source and observer using local spatial portal graph traversal. Intervening closed doors, solid masonry partitions, or pitch-black zones (`ambient_lux === 0` without light sources) completely extinguish optical percept candidates.




* **Falsifiable Acceptance Criteria:** A gunshot event in `loc_cellar` with $80\text{ dB}$ sound power behind two heavy masonry doors (each damping $45\text{ dB}$) yields a negative SNR in `loc_courtyard` and produces zero auditory percepts.



#### [TASK-GPS-3.3] Local SQLite Sensory Percept Ledger (`perceptFilter.ts`)

* **Target File Manifest:** `packages/001.lore/src/db/localSensoryLedger.ts`, `packages/001.lore/src/core/cartesian/perceptFilter.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Percept Candidate Quarantine Table:** Create `sensory_percepts` in local SQLite: `id TEXT PRIMARY KEY`, `observer_id TEXT NOT NULL`, `source_event_id TEXT NOT NULL`, `modality TEXT CHECK(modality IN ('VISUAL', 'AUDITORY', 'OLFACTORY', 'TACTILE'))`, `perceived_intensity_bps INTEGER NOT NULL`, `tick INTEGER NOT NULL`.


2. **Generation Prompt Context Assembly Scrubbing:** During prompt assembly for a scene, `perceptFilter.ts` queries local SQLite and injects **only** verified `sensory_percepts` into the character's belief context envelope. Any physical event that failed acoustic or visual transmission is scrubbed completely from the generation payload.




* **Falsifiable Acceptance Criteria:** Screenplay generation prompts for an observer in an adjacent room contain zero tokens or references describing silent visual actions occurring behind closed doors.



---

### Phase 4: Non-Pardonable Invariant Enforcement & The Pardon Ledger

**Phase Mandate:** Implement a typed classification system separating hard, unbreachable physical laws from negotiable stylistic conventions, providing an immutable local SQLite pardon ledger with cryptographic signing for permissible exemptions.

#### [TASK-GPS-4.1] The Non-Pardonable Invariant Classification Schema (`pardon.schema.ts`)

* **Target File Manifest:** `packages/001.lore/schemas/pardon.schema.ts`, `packages/001.lore/src/core/governance/pardonEnforcer.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Invariant Classification Contract:** Partition all pipeline validation rules into two distinct categories:
* **Category A: Unpardonable Physical Invariants (`pardonable: false`):** Somatic hand capacity, conservation of mass, spatial co-presence, anatomical speech feasibility, vitality ceilings, and chronological arrow of time.


* **Category B: Pardonable Stylistic Guidelines (`pardonable: true`):** Scene duration limits, vocabulary formality tiers, pacing mode duration, and poetic rhetorical licenses.




2. **Strict Zod Pardon Schema:** Define `PardonWaiverSchema` requiring `waiver_id`, `rule_id`, `target_entity_id`, `justification`, `granting_authority`, and `pardonable_assert: true`.




* **Falsifiable Acceptance Criteria:** Passing a `rule_id` belonging to Category A into `PardonWaiverSchema` throws a fatal `INVALID_PARDON_REQUEST` validation error.



#### [TASK-GPS-4.2] Local SQLite Pardon Ledger & Tamper Guard (`localPardonLedger.ts`)

* **Target File Manifest:** `packages/001.lore/src/db/localPardonLedger.ts`, `packages/001.lore/migrations/0003_pardon_ledger.sql`.


* **Technical Subtasks & Implementation Nuance:**
1. **Local Pardon Table DDL:** Author `0003_pardon_ledger.sql` instantiating:
* `pardon_waivers`: `waiver_id TEXT PRIMARY KEY`, `rule_id TEXT NOT NULL`, `target_entity_id TEXT NOT NULL`, `episode_num INTEGER NOT NULL`, `scene_num INTEGER NOT NULL`, `justification TEXT NOT NULL`, `granted_by TEXT NOT NULL`, `created_at_ms INTEGER NOT NULL`.




2. **SQLite Check Constraint Protection:** Enforce a SQL `CHECK` constraint asserting `rule_id NOT IN ('SOMATIC_SAT_BREACH', 'MASS_CONSERVATION_BREACH', 'VOCAL_FEASIBILITY_BREACH', 'SPATIAL_CO_PRESENCE_VIOLATION')` directly at the local SQLite engine level, guaranteeing that no script or rogue process can write an exemption for physical laws to disk.




* **Falsifiable Acceptance Criteria:** Executing a raw SQL insert attempting to record a pardon for `SOMATIC_SAT_BREACH` fails immediately with an SQLite check constraint violation.



#### [TASK-GPS-4.3] Cryptographic Waiver Gate & Hard Invariant Interceptor

* **Target File Manifest:** `packages/001.lore/src/linters/pardonInterceptor.ts`, `packages/001.lore/test/pardon_enforcement.test.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Dual-Gate Interception Engine:** When a compilation pass detects a rule violation, `pardonInterceptor.ts` queries `localPardonLedger.ts` in $< 1\text{ ms}$.


2. **Fail-Closed Physical Shield:** If the rule is marked `pardonable: false`, the linter completely bypasses the pardon database query and immediately aborts compilation with exit code 1, emitting `FATAL_UNPARDONABLE_PHYSICAL_BREACH`.




* **Falsifiable Acceptance Criteria:** Valid stylistic exemptions resolve to `COMPLIANT_BY_EXEMPTION`, while physical somatic violations abort compilation regardless of any flags passed to the compiler.



---

### Phase 5: Adversarial Penetration Suite & Gated Upstream D1 Physical Sync

**Phase Mandate:** Execute an adversarial penetration test suite simulating rogue LLM hallucinations against the local SQLite physical state engine, blocking remote Cloudflare D1 synchronization until all five adversarial vectors are intercepted on local disk.

#### [TASK-GPS-5.1] Five-Vector Physical State Adversarial Injection Test Battery

* **Target File Manifest:** `packages/001.lore/test/physical_boundary_traps.test.ts`, `packages/001.lore/src/testkit/syntheticHallucinationGenerator.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Author the Five Adversarial Penetration Traps:**
* **Trap 1 (The Teleportation Attack):** Injects a scene where an actor transitions between two non-adjacent rooms without crossing an intermediate spatial portal.


* **Trap 2 (The Ghost Grasp Attack):** Injects a screenplay beat where an actor equips an item located in another actor's private inventory without an explicit theft or handover transaction.


* **Trap 3 (The Post-Mortem Action Attack):** Injects dialogue turns or movement directives for an actor whose vitality is $0$ or consciousness is `DECEASED`.


* **Trap 4 (The Mute Utterance Attack):** Injects spoken dialogue lines for an actor with `cond_severed_trachea` or active muteness.


* **Trap 5 (The Material Immunity Attack):** Injects an action where an actor ignites matches inside a flooded, submerged room.






* **Falsifiable Acceptance Criteria:** All five synthetic attacks are detected and halted by the compiler at $T_0 = \$0.00$, passing with 100% interception in Vitest.



#### [TASK-GPS-5.2] Automated Local SQLite Execution Trap Harness

* **Target File Manifest:** `packages/001.lore/src/testkit/physicalAdversarialRunner.ts`, `packages/001.lore/test/phase5_physical_adversarial.test.ts`.


* **Technical Subtasks & Implementation Nuance:**
1. **Deterministic Test Execution:** Implement `physicalAdversarialRunner.ts` running against a local SQLite instance (`pilot.db`).


2. **Zero False-Negative Assertion:** Assert that 100% of physical violations produce a structured 4-tuple Error Signature Vector:

$$\vec{E} = \langle \text{Domain}: \text{PHYSICAL\_STATE}, \; \text{TargetEntity}: \text{EntityID}, \; \text{RuleID}: \text{TrapRule}, \; \text{OffendingTokens}: [\dots] \rangle$$



3. **Timing & Resource Benchmark:** Prove that all five trap vectors are evaluated and rejected in $< 10\text{ ms}$ total execution time in local memory.




* **Falsifiable Acceptance Criteria:** Running `npx vitest run packages/001.lore/test/phase5_physical_adversarial.test.ts` executes and passes all assertions with exit code 0.



#### [TASK-GPS-5.3] Gated Upstream D1 Physical Core Migration Bridge (`syncPhysicalCoreToD1.ts`)

* **Target File Manifest:** `packages/001.lore/scripts/syncPhysicalCoreToD1.ts`, `packages/001.lore/migrations/0002_physical_state_core.sql`.


* **Technical Subtasks & Implementation Nuance:**
1. **Precondition Audit Verification:** Implement `syncPhysicalCoreToD1.ts` to inspect the local test results before opening any upstream network connections.


2. **Fail-Closed Edge Egress Firewall:**
* Assert `isPhysicalTestSuitePassed === true`.


* Assert `localSqliteDb.integrityCheck === 'ok'`.


* Assert zero pending un-pardonable violations exist in the local database.




3. **Cloudflare D1 Synchronization Execution:** Only when all local SQLite assertions pass green does the script invoke `npx wrangler d1 execute CANON_DB --file=migrations/0002_physical_state_core.sql` to replicate the certified physical tables to the edge.




* **Falsifiable Acceptance Criteria:** Calling `syncPhysicalCoreToD1.ts` while any local physical boundary test fails immediately aborts with `PRECONDITION_FAILED: CANNOT_DEPLOY_PHYSICAL_CORE_TO_D1`.



---

### Implementation Task Matrix for `goblin-lore`

| Phase | Task ID | Core Technical Scope | Primary Target File | Verification Gate |
| --- | --- | --- | --- | --- |
| **Phase 1** | **TASK-GPS-1.1** | Spatial Presence & Matter Conservation Schema

 | `src/schemas/physicalPlacement.ts`<br> | Disjoint placement SAT assertion

 |
| **Phase 1** | **TASK-GPS-1.2** | Vocal-Motor Feasibility Theorem Engine

 | `src/linters/vocalFeasibility.ts`<br> | Anatomical muteness dialogue check

 |
| **Phase 1** | **TASK-GPS-1.3** | Local SQLite Physical Entity Ledger

 | `src/db/localSpatialSomaticLedger.ts`<br> | Adjacency portal transit validation

 |
| **Phase 2** | **TASK-GPS-2.1** | Material State Vector & Integrity Schemas

 | `src/schemas/materialState.ts`<br> | Basis-point integrity clamping

 |
| **Phase 2** | **TASK-GPS-2.2** | Environmental Overlay & Friction Engine

 | `src/core/environment/environmentalOverlay.ts`<br> | Standing water locomotion ban

 |
| **Phase 2** | **TASK-GPS-2.3** | Local SQLite Material Feasibility Gate

 | `src/linters/materialFeasibility.ts`<br> | Corrosion $>9000\text{ bp}$ tool failure

 |
| **Phase 3** | **TASK-GPS-3.1** | Four-Stage Cartesian Pipeline Contract

 | `src/core/cartesian/cartesianFirewall.ts`<br> | ESLint architectural boundary import check

 |
| **Phase 3** | **TASK-GPS-3.2** | Acoustic Occlusion & Line-of-Sight Ray-Caster

 | `src/health/acousticOcclusion.ts`<br> | Centibel SNR attenuation calculation

 |
| **Phase 3** | **TASK-GPS-3.3** | Local SQLite Sensory Percept Ledger

 | `src/core/cartesian/perceptFilter.ts`<br> | Non-perceived event prompt scrubbing

 |
| **Phase 4** | **TASK-GPS-4.1** | Non-Pardonable Invariant Classification

 | `schemas/pardon.schema.ts`<br> | Rejection of physical law waiver requests

 |
| **Phase 4** | **TASK-GPS-4.2** | Local SQLite Pardon Ledger & Tamper Guard

 | `src/db/localPardonLedger.ts`<br> | SQLite DDL `CHECK` constraint test

 |
| **Phase 4** | **TASK-GPS-4.3** | Cryptographic Waiver Interceptor

 | `src/linters/pardonInterceptor.ts`<br> | Fail-closed physical exception gate

 |
| **Phase 5** | **TASK-GPS-5.1** | Five-Vector Adversarial Injection Test Battery

 | `test/physical_boundary_traps.test.ts`<br> | 100% trap interception in Vitest

 |
| **Phase 5** | **TASK-GPS-5.2** | Automated Local SQLite Trap Harness

 | `src/testkit/physicalAdversarialRunner.ts`<br> | $< 10\text{ ms}$ local execution benchmark

 |
| **Phase 5** | **TASK-GPS-5.3** | Gated Upstream D1 Migration Bridge

 | `scripts/syncPhysicalCoreToD1.ts`<br> | Zero cloud sync until local tests pass

 |

---

### Local SQLite Verification Sequence (To Be Executed on Workstation Silicon)

```bash
# 1. Typecheck all physical schemas, Cartesian filters, and local SQLite engines
npm run check:types

# 2. Run the Phase 1-5 physical authority boundary Vitest suite against local SQLite (:memory: / pilot.db)
npx vitest run packages/001.lore/test/physical_boundary_traps.test.ts

# 3. Verify clean 7-bit ASCII compliance across all new physical state files
git grep -P "[\x{80}-\x{FF}]" packages/001.lore/src/core/cartesian/ packages/001.lore/src/linters/ packages/001.lore/src/schemas/physicalPlacement.ts
# (Must exit with code 1; zero non-ASCII bytes found)

# 4. Confirm apps/995.library immutable testing boundary is untouched
git status --porcelain apps/995.library/
# (Must return 0 lines)

```

Would you like to take **Phase 1 (`spatialPresenceSolver.ts`, `vocalFeasibility.ts`, and `localSpatialSomaticLedger.ts`)** and generate an executable `@jules-task-00` directive complete with pre-flight audit scores and surgical code deliverables?