import { describe, it, expect } from "vitest";
import {
  scanSourceCode,
  scanLoreWorkspace,
} from "../scripts/lint-determinism.js";
import * as path from "node:path";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Task MV-1.3: Static AST Determinism & Wall-Clock Contamination Linter", () => {
  it("passes clean deterministic TypeScript source code with zero violations", () => {
    const cleanSource = `
      export interface StateRecord {
        id: string;
        version: number;
        created_at_epoch: number;
        ratio_bps: number;
      }

      export function computeState(version: number): StateRecord {
        return {
          id: "fact_clean_001",
          version: version + 1,
          created_at_epoch: 0,
          ratio_bps: 5000,
        };
      }
    `;

    const violations = scanSourceCode(cleanSource, "clean.ts");
    expect(violations).toHaveLength(0);
  });

  it("catches Date.now() and performance.now() call expressions with exact locations", () => {
    const dirtySource = `
      export function getTimestamp(): number {
        const time = Date.now();
        const perf = performance.now();
        return time;
      }
    `;

    const violations = scanSourceCode(dirtySource, "dirty_clock.ts");
    expect(violations.length).toBeGreaterThanOrEqual(2);

    const dateNowViolation = violations.find((v) => v.ruleId === "WALL_CLOCK_READ");
    expect(dateNowViolation).toBeDefined();
    expect(dateNowViolation?.expression).toBe("Date.now()");
    expect(dateNowViolation?.line).toBe(3);

    const perfViolation = violations.find((v) => v.ruleId === "EXECUTION_CLOCK_READ");
    expect(perfViolation).toBeDefined();
    expect(perfViolation?.expression).toBe("performance.now()");
    expect(perfViolation?.line).toBe(4);
  });

  it("catches new Date() constructor instantiations", () => {
    const dirtySource = `
      export function makeDate(): void {
        const d = new Date();
      }
    `;

    const violations = scanSourceCode(dirtySource, "new_date.ts");
    const newDateViolation = violations.find((v) => v.ruleId === "DATE_INSTANTIATION");
    expect(newDateViolation).toBeDefined();
    expect(newDateViolation?.expression).toBe("new Date()");
    expect(newDateViolation?.line).toBe(3);
  });

  it("catches Math.random() unseeded pseudo-random number generator calls", () => {
    const dirtySource = `
      export function rollDice(): number {
        return Math.floor(Math.random() * 6) + 1;
      }
    `;

    const violations = scanSourceCode(dirtySource, "random.ts");
    const prngViolation = violations.find((v) => v.ruleId === "NON_DETERMINISTIC_PRNG");
    expect(prngViolation).toBeDefined();
    expect(prngViolation?.expression).toBe("Math.random()");
    expect(prngViolation?.line).toBe(3);
  });

  it("catches process.env dynamic environment reads", () => {
    const dirtySource = `
      export function getApiKey(): string {
        return process.env.API_KEY || "";
      }
    `;

    const violations = scanSourceCode(dirtySource, "env_read.ts");
    const envViolation = violations.find((v) => v.ruleId === "DYNAMIC_ENV_READ");
    expect(envViolation).toBeDefined();
    expect(envViolation?.expression).toBe("process.env");
    expect(envViolation?.line).toBe(3);
  });

  it("catches filesystem stat timestamps (.mtime and .birthtime)", () => {
    const dirtySource = `
      import * as fs from "node:fs";
      export function checkMod(p: string): number {
        const stats = fs.statSync(p);
        return stats.mtimeMs;
      }
    `;

    const violations = scanSourceCode(dirtySource, "fs_mtime.ts");
    const mtimeViolation = violations.find((v) => v.ruleId === "AMBIENT_FS_TIMESTAMP");
    expect(mtimeViolation).toBeDefined();
    expect(mtimeViolation?.expression).toBe(".mtimeMs");
  });

  it("catches network fetch() invocations in compilation paths", () => {
    const dirtySource = `
      export async function loadRemoteCanon(): Promise<void> {
        await fetch("https://api.example.com/canon");
      }
    `;

    const violations = scanSourceCode(dirtySource, "fetch.ts");
    const fetchViolation = violations.find((v) => v.ruleId === "NETWORK_IO_CALL");
    expect(fetchViolation).toBeDefined();
    expect(fetchViolation?.expression).toBe("fetch()");
  });

  it("insulates comments and string literals against false-positive detection", () => {
    const commentSource = `
      // Rule: Never use Date.now() or Math.random() in the compiler.
      /*
       * Block comment mentioning new Date() and process.env.
       */
      export const ERROR_MESSAGE = "Detected Date.now() in state payload";
      export const HELP_TEXT = 'Do not call fetch() inside pure reducers';
    `;

    const violations = scanSourceCode(commentSource, "comments.ts");
    expect(violations).toHaveLength(0);
  });

  it("detects multi-byte UTF-8 emojis and non-ASCII character encoding violations", () => {
    // Contains non-ASCII byte (copyright symbol \u00A9)
    const nonAsciiSource = `
      export const author = "Elena \u00A9 2026";
    `;

    const violations = scanSourceCode(nonAsciiSource, "non_ascii.ts");
    const asciiViolation = violations.find((v) => v.ruleId === "NON_ASCII_ENCODING_BREACH");
    expect(asciiViolation).toBeDefined();
    expect(asciiViolation?.message).toContain("Pure 7-bit ASCII required");
  });

  it("executes scanLoreWorkspace against the local schemas directory with zero violations", () => {
    const schemasDir = path.resolve(__dirname, "../src/schemas");
    const result = scanLoreWorkspace({
      baseDir: path.resolve(__dirname, ".."),
      scanSubdirs: ["src/schemas"],
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
