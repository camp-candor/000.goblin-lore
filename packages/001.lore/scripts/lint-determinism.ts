import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// 1. Violation Data Models & Rule Identifiers
// ---------------------------------------------------------------------------
export type DeterminismRuleId =
  | "WALL_CLOCK_READ"
  | "DATE_INSTANTIATION"
  | "NON_DETERMINISTIC_PRNG"
  | "EXECUTION_CLOCK_READ"
  | "DYNAMIC_ENV_READ"
  | "AMBIENT_FS_TIMESTAMP"
  | "NETWORK_IO_CALL"
  | "NON_ASCII_ENCODING_BREACH";

export interface DeterminismViolation {
  filePath: string;
  line: number;
  column: number;
  ruleId: DeterminismRuleId;
  expression: string;
  message: string;
}

export interface LintScanResult {
  passed: boolean;
  filesScanned: number;
  violations: DeterminismViolation[];
}

// ---------------------------------------------------------------------------
// 2. AST Visitor & Token Scanner
// ---------------------------------------------------------------------------
/**
 * Statically analyzes a TypeScript source string for non-deterministic primitives
 * and ambient wall-clock contamination using the TypeScript Compiler AST API.
 */
export function scanSourceCode(
  sourceText: string,
  filePath: string = "source.ts"
): DeterminismViolation[] {
  const violations: DeterminismViolation[] = [];

  // Check 1: Pure 7-bit ASCII compliance across raw source bytes
  for (let i = 0; i < sourceText.length; i++) {
    const charCode = sourceText.charCodeAt(i);
    if (charCode > 127) {
      // Compute line and column for the non-ASCII character
      const linesUpTo = sourceText.substring(0, i).split("\n");
      const line = linesUpTo.length;
      const column = linesUpTo[linesUpTo.length - 1].length + 1;

      violations.push({
        filePath,
        line,
        column,
        ruleId: "NON_ASCII_ENCODING_BREACH",
        expression: `\\u${charCode.toString(16).padStart(4, "0")}`,
        message: `Non-ASCII byte detected (code: 0x${charCode.toString(16)}). Pure 7-bit ASCII required.`,
      });
      break; // Report first non-ASCII occurrence per file to avoid noise
    }
  }

  // Check 2: Abstract Syntax Tree (AST) Traversal
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  function getNodeLocation(node: ts.Node): { line: number; column: number } {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile)
    );
    return { line: line + 1, column: character + 1 };
  }

  function visit(node: ts.Node): void {
    // A. Detect Call Expressions: Date.now(), performance.now(), Math.random(), fetch()
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      // Check: fetch(...)
      if (ts.isIdentifier(expr) && expr.text === "fetch") {
        const { line, column } = getNodeLocation(node);
        violations.push({
          filePath,
          line,
          column,
          ruleId: "NETWORK_IO_CALL",
          expression: "fetch()",
          message:
            "fetch() network call prohibited inside deterministic compilation path.",
        });
      }

      // Check: <Object>.<Method>()
      if (ts.isPropertyAccessExpression(expr)) {
        const targetObj = expr.expression;
        const methodName = expr.name.text;

        if (ts.isIdentifier(targetObj)) {
          const objName = targetObj.text;

          // Date.now() or Date.parse()
          if (objName === "Date" && (methodName === "now" || methodName === "parse")) {
            const { line, column } = getNodeLocation(node);
            violations.push({
              filePath,
              line,
              column,
              ruleId: "WALL_CLOCK_READ",
              expression: `Date.${methodName}()`,
              message: `Ambient wall-clock call Date.${methodName}() prohibited. Use static integer epoch or monotonic logical ticks.`,
            });
          }

          // performance.now()
          if (objName === "performance" && methodName === "now") {
            const { line, column } = getNodeLocation(node);
            violations.push({
              filePath,
              line,
              column,
              ruleId: "EXECUTION_CLOCK_READ",
              expression: "performance.now()",
              message:
                "performance.now() execution clock read prohibited. Invariant logic must not depend on execution velocity.",
            });
          }

          // Math.random()
          if (objName === "Math" && methodName === "random") {
            const { line, column } = getNodeLocation(node);
            violations.push({
              filePath,
              line,
              column,
              ruleId: "NON_DETERMINISTIC_PRNG",
              expression: "Math.random()",
              message:
                "Math.random() unseeded PRNG prohibited. Pass explicit pseudorandom seeds in event envelopes.",
            });
          }
        }
      }
    }

    // B. Detect New Expressions: new Date()
    if (ts.isNewExpression(node)) {
      const expr = node.expression;
      if (ts.isIdentifier(expr) && expr.text === "Date") {
        const { line, column } = getNodeLocation(node);
        violations.push({
          filePath,
          line,
          column,
          ruleId: "DATE_INSTANTIATION",
          expression: "new Date()",
          message:
            "new Date() ambient instantiation prohibited. Timestamps must be supplied as deterministic integer epochs.",
        });
      }
    }

    // C. Detect Property Accesses: process.env and fs.stat().mtime
    if (ts.isPropertyAccessExpression(node)) {
      const obj = node.expression;
      const prop = node.name.text;

      // process.env
      if (ts.isIdentifier(obj) && obj.text === "process" && prop === "env") {
        const { line, column } = getNodeLocation(node);
        violations.push({
          filePath,
          line,
          column,
          ruleId: "DYNAMIC_ENV_READ",
          expression: "process.env",
          message:
            "process.env read prohibited in compiler path. Pinned configuration snapshots must be baked at Genesis.",
        });
      }

      // File stat timestamps (.mtime, .ctime, .birthtime)
      if (prop === "mtime" || prop === "ctime" || prop === "birthtime" || prop === "mtimeMs") {
        const { line, column } = getNodeLocation(node);
        violations.push({
          filePath,
          line,
          column,
          ruleId: "AMBIENT_FS_TIMESTAMP",
          expression: `.${prop}`,
          message: `Filesystem timestamp .${prop} access prohibited. File order and compilation freshness must use Merkle hashes.`,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

// ---------------------------------------------------------------------------
// 3. Workspace Directory Traversal
// ---------------------------------------------------------------------------
export interface ScanWorkspaceOptions {
  baseDir: string;
  scanSubdirs?: string[];
  ignoredFiles?: string[];
}

export function scanLoreWorkspace(options: ScanWorkspaceOptions): LintScanResult {
  const subdirs = options.scanSubdirs || ["src", "schemas", "scripts"];
  const ignored = new Set(options.ignoredFiles || ["lint-determinism.ts"]);
  const allViolations: DeterminismViolation[] = [];
  let filesScanned = 0;

  function traverse(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        if (
          (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) &&
          !ignored.has(entry.name) &&
          !entry.name.includes(".test.")
        ) {
          filesScanned++;
          const content = fs.readFileSync(fullPath, "utf8");
          const fileViolations = scanSourceCode(content, fullPath);
          allViolations.push(...fileViolations);
        }
      }
    }
  }

  for (const sub of subdirs) {
    traverse(path.resolve(options.baseDir, sub));
  }

  return {
    passed: allViolations.length === 0,
    filesScanned,
    violations: allViolations,
  };
}

// ---------------------------------------------------------------------------
// 4. Standalone CLI Runner Execution
// ---------------------------------------------------------------------------
export function runCli(targetDir?: string): number {
  const baseDir = targetDir || path.resolve(__dirname, "..");
  console.log(`>> [DETERMINISM] Scanning workspace for volatile contamination: ${baseDir}`);

  const result = scanLoreWorkspace({ baseDir });

  if (!result.passed) {
    console.error(
      `>> [FAIL] VOLATILE_CONTAMINATION_DETECTED: ${result.violations.length} violation(s) across ${result.filesScanned} files.`
    );
    for (const v of result.violations) {
      console.error(
        `>> [FAIL] ${v.ruleId} at ${v.filePath}:${v.line}:${v.column}\n   Expression: ${v.expression}\n   Message: ${v.message}`
      );
    }
    return 1;
  }

  console.log(
    `>> [OK] Determinism Linter: ${result.filesScanned} files scanned. Zero volatile clocks, PRNGs, or ambient I/O detected.`
  );
  return 0;
}

// Direct execution gate
const isDirectExecution =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const exitCode = runCli();
  process.exit(exitCode);
}
