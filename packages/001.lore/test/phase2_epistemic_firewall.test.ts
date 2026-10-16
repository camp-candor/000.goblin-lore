import { describe, it, expect } from "vitest";
import { DialogueLineASTSchema, BlindProbeInputSchema } from "../src/types/dialogueAst.js";
import { TrieClueDisjointnessSolver } from "../src/health/trieClueDisjointness.js";
import { LexicalGate } from "../src/linters/lexicalGate.js";

describe("Phase 2: Epistemic Firewall, Action Ontology & Clue-Disjointness Kernels", () => {
  it("enforces split parenthetical AST validation and rejects un-schemaed keys", () => {
    const validLine = {
      id: "line_001",
      speaker_id: "char_silas",
      dialogue_text: "Keep the valve sealed tight.",
      camera_parenthetical: "EXTREME CLOSE UP on Silas eyes widening in fear",
      observable_parenthetical: "Hands trembling as he grips the iron latch",
      extracted_motor_actions: ["GRIP"],
      turn_index: 1,
    };

    expect(() => DialogueLineASTSchema.parse(validLine)).not.toThrow();

    const legacyLine = {
      ...validLine,
      parenthetical: "Eyes wide", // Legacy key
    };
    expect(() => DialogueLineASTSchema.parse(legacyLine)).toThrow();
  });

  it("structurally rejects camera_parenthetical from BlindProbeInputSchema", () => {
    const invalidProbe = {
      speaker_label: "SPEAKER_A",
      dialogue_text: "The cistern is dry.",
      observable_parenthetical: "Shifting boots in the gravel.",
      camera_parenthetical: "PANNING WIDE OVER EMPTY VALE", // Leak attempt
    };

    expect(() => BlindProbeInputSchema.parse(invalidProbe)).toThrow();
  });

  it("enforces O(L) Clue Disjointness Invariant and catches forbidden lemma collision", () => {
    const solver = new TrieClueDisjointnessSolver();
    solver.loadForbiddenPropositions([
      {
        topic_id: "mystery_famine_well",
        forbidden_propositions: [
          {
            id: "prop_arsenic_deposit",
            trigger_lemmas: ["poison", "arsenic", "taint", "residue"],
          },
        ],
      },
    ]);

    // Clean permitted clues pass
    const cleanClues = ["rusted_bucket", "cut_rope", "iron_gate"];
    const cleanResult = solver.evaluateDisjointness(cleanClues);
    expect(cleanResult.valid).toBe(true);
    expect(cleanResult.collisions).toHaveLength(0);

    // Colliding clue fails at T0 = $0.00
    const dirtyClues = ["cut_rope", "poison_residue", "iron_gate"];
    const dirtyResult = solver.evaluateDisjointness(dirtyClues, "char_wart");
    expect(dirtyResult.valid).toBe(false);
    expect(dirtyResult.collisions).toHaveLength(1);
    expect(dirtyResult.collisions[0].collidingToken).toBe("poison_residue");
    expect(dirtyResult.collisions[0].errorVector.rule_id).toBe("CLUE_DISJOINTNESS_COLLISION");
  });

  it("evaluates Union-Intersection Discrepancy Formulation and parses polarity negations", () => {
    const gate = new LexicalGate();

    const bannedVerbs = ["SPRINT", "CLIMB"];

    // Case A: Metaphorical direct object is bypassed
    const metaphorLine = {
      id: "line_002",
      speaker_id: "char_silas",
      dialogue_text: "We must face what comes next.",
      camera_parenthetical: "Tight focus on clenched fist",
      observable_parenthetical: "Clutches fate with desperate resolve",
      extracted_motor_actions: [],
      turn_index: 2,
    };
    const metaphorResult = gate.auditTurn(metaphorLine, bannedVerbs);
    expect(metaphorResult.valid).toBe(true);
    expect(metaphorResult.bannedViolations).toHaveLength(0);

    // Case B: Polarity negation is bypassed
    const negatedLine = {
      id: "line_003",
      speaker_id: "char_silas",
      dialogue_text: "My leg gave out.",
      camera_parenthetical: "Cut to crippled knee",
      observable_parenthetical: "Could not sprint across the yard",
      extracted_motor_actions: [],
      turn_index: 3,
    };
    const negatedResult = gate.auditTurn(negatedLine, bannedVerbs);
    expect(negatedResult.valid).toBe(true);
    expect(negatedResult.bannedViolations).toHaveLength(0);

    // Case C: Un-negated physical violation halts at T0 = $0.00
    const breachLine = {
      id: "line_004",
      speaker_id: "char_silas",
      dialogue_text: "Get out of the way!",
      camera_parenthetical: "Rapid tracking shot",
      observable_parenthetical: "Sprints directly toward the breach",
      extracted_motor_actions: [],
      turn_index: 4,
    };
    const breachResult = gate.auditTurn(breachLine, bannedVerbs);
    expect(breachResult.valid).toBe(false);
    expect(breachResult.bannedViolations).toContain("SPRINT");
    expect(breachResult.errorVector?.rule_id).toBe("BANNED_KINETIC_MOTOR_BREACH");
    expect(breachResult.errorVector?.target_entity).toBe("char_silas");
  });
});
