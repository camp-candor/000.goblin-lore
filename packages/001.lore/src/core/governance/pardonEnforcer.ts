import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { PardonRecord, Rule, Authorizer, RuleSchema, AuthorizerSchema } from "../../../schemas/pardon.schema";

export interface PardonDiagnostic {
  code: string;
  pardonId?: string;
  ruleId?: string;
  message: string;
}

export interface Pass2PardonValidationOptions {
  strictPardonAudit?: boolean;
}

export function loadOntologyRules(ontologyDir?: string): Map<string, Rule> {
  const possiblePaths = [
    ontologyDir ? path.join(ontologyDir, "rules.json") : "",
    path.resolve(process.cwd(), "packages/001.lore/schemas/ontology/rules.json"),
    path.resolve(process.cwd(), "schemas/ontology/rules.json"),
  ].filter(Boolean);

  const rulesPath = possiblePaths.find((p) => fs.existsSync(p));
  const rulesMap = new Map<string, Rule>();

  if (rulesPath && fs.existsSync(rulesPath)) {
    const raw = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    for (const r of raw.rules || []) {
      const validated = RuleSchema.parse(r);
      rulesMap.set(validated.id, validated);
    }
  }
  return rulesMap;
}

export function loadOntologyAuthorizers(ontologyDir?: string): Map<string, Authorizer> {
  const possiblePaths = [
    ontologyDir ? path.join(ontologyDir, "authorizers.json") : "",
    path.resolve(process.cwd(), "packages/001.lore/schemas/ontology/authorizers.json"),
    path.resolve(process.cwd(), "schemas/ontology/authorizers.json"),
  ].filter(Boolean);

  const authPath = possiblePaths.find((p) => fs.existsSync(p));
  const authMap = new Map<string, Authorizer>();

  if (authPath && fs.existsSync(authPath)) {
    const raw = JSON.parse(fs.readFileSync(authPath, "utf8"));
    for (const a of raw.authorizers || []) {
      const validated = AuthorizerSchema.parse(a);
      authMap.set(validated.id, validated);
    }
  }
  return authMap;
}

export function computeEntityNfcHash(entityPayload: unknown): string {
  const normalizedJson = JSON.stringify(entityPayload).normalize("NFC");
  return crypto.createHash("sha256").update(normalizedJson).digest("hex");
}

export function validatePass2Pardons(
  pardons: Record<string, PardonRecord>,
  rules: Map<string, Rule>,
  authorizers: Map<string, Authorizer>,
  entities: {
    characters: Record<string, any>;
    locations: Record<string, any>;
    possessions: Record<string, any>;
    grievances: Record<string, any>;
  },
  options: Pass2PardonValidationOptions = {}
): { diagnostics: PardonDiagnostic[]; appliedPardons: PardonRecord[] } {
  const diagnostics: PardonDiagnostic[] = [];
  const appliedPardons: PardonRecord[] = [];
  const ruleUsageCounts = new Map<string, number>();

  for (const [pardonId, pardon] of Object.entries(pardons)) {
    // 1. Target Entity Foreign-Key Resolution
    const targetId = pardon.target.entity_id;
    const targetEntity =
      entities.characters[targetId] ||
      entities.locations[targetId] ||
      entities.possessions[targetId] ||
      entities.grievances[targetId];

    if (!targetEntity) {
      throw new Error(`[PASS 2 PARDON ERROR] Pardon '${pardonId}' references non-existent target entity: '${targetId}'`);
    }

    // 2. Rule Resolution & Hard Invariant Fence
    const rule = rules.get(pardon.rule_id);
    if (!rule) {
      throw new Error(`[PASS 2 PARDON ERROR] Pardon '${pardonId}' references unknown rule_id: '${pardon.rule_id}'`);
    }

    if (rule.pardonable !== true) {
      throw new Error(
        `[PASS 2 PARDON FATAL] Illegal waiver attempted! Rule '${rule.id}' carries severity '${rule.severity_class}' ` +
          `and is marked pardonable: false. Hard physical and epistemic invariants cannot be bypassed via pardons.`
      );
    }

    // 3. Authorizer Identification & Permissions
    const authorizer = authorizers.get(pardon.authorizer_id);
    if (!authorizer) {
      throw new Error(`[PASS 2 PARDON ERROR] Unknown authorizer '${pardon.authorizer_id}' on pardon '${pardonId}'.`);
    }

    if (!authorizer.permitted_severity_classes.includes(rule.severity_class)) {
      throw new Error(
        `[PASS 2 PARDON PERMISSION DENIED] Authorizer '${authorizer.name}' (${authorizer.role}) lacks authority ` +
          `to waive severity class '${rule.severity_class}' on rule '${rule.id}'.`
      );
    }

    // 4. Entity-Scoped Stale Hash Verification
    const currentEntityHash = computeEntityNfcHash(targetEntity);
    if (pardon.granted_against_entity_hash !== currentEntityHash) {
      diagnostics.push({
        code: "STALE_ENTITY_PARDON",
        pardonId,
        message:
          `Pardon '${pardonId}' was granted against entity hash ` +
          `'${pardon.granted_against_entity_hash.slice(0, 8)}...', but target '${targetId}' has evolved to ` +
          `'${currentEntityHash.slice(0, 8)}...'. Re-ratification required.`,
      });
    }

    ruleUsageCounts.set(pardon.rule_id, (ruleUsageCounts.get(pardon.rule_id) || 0) + 1);
    appliedPardons.push(pardon);
  }

  // 5. Aggregate Rule Frequency Check
  for (const [ruleId, count] of ruleUsageCounts.entries()) {
    const rule = rules.get(ruleId);
    if (rule && count > rule.max_tolerated_pardon_frequency) {
      const msg = `Rule '${ruleId}' has ${count} active waivers, exceeding its limit of ${rule.max_tolerated_pardon_frequency}.`;
      if (options.strictPardonAudit) {
        throw new Error(`[PASS 2 PARDON FREQUENCY EXCEEDED] ${msg}`);
      } else {
        diagnostics.push({ code: "PARDON_FREQUENCY_EXCEEDED", ruleId, message: msg });
      }
    }
  }

  return { diagnostics, appliedPardons };
}
