import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import { CharacterMachineRailSchema, CharacterMachineRail } from "../schemas/entities";

export interface ByteZeroValidationResult {
  valid: boolean;
  byteOffset: number;
  hasBom: boolean;
  hasCarriageReturns: boolean;
  reason?: string;
}

/**
 * Asserts that the buffer starts strictly at physical byte offset 0 with --- (0x2D 0x2D 0x2D 0x0A)
 */
export function verifyByteZeroIntegrity(buffer: Buffer): ByteZeroValidationResult {
  if (buffer.length < 4) {
    return {
      valid: false,
      byteOffset: 0,
      hasBom: false,
      hasCarriageReturns: false,
      reason: "FILE_TOO_SHORT",
    };
  }

  // Detect UTF-8 BOM (0xEF 0xBB 0xBF)
  const hasBom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  if (hasBom) {
    return {
      valid: false,
      byteOffset: 3,
      hasBom: true,
      hasCarriageReturns: false,
      reason: "BOM_CORRUPTION_DETECTED",
    };
  }

  // Check for carriage returns (\r / 0x0D) in the opening slice
  const hasCarriageReturns = buffer.subarray(0, 100).includes(0x0d);

  // Exact Byte-0 frontmatter delimiter: --- followed by \n
  const isByteZero =
    buffer[0] === 0x2d && buffer[1] === 0x2d && buffer[2] === 0x2d && buffer[3] === 0x0a;

  if (!isByteZero) {
    return {
      valid: false,
      byteOffset: 0,
      hasBom: false,
      hasCarriageReturns,
      reason: "BYTE_ZERO_FRONTMATTER_MISALIGNED",
    };
  }

  if (hasCarriageReturns) {
    return {
      valid: false,
      byteOffset: 0,
      hasBom: false,
      hasCarriageReturns: true,
      reason: "CARRIAGE_RETURN_NON_POSIX_DETECTED",
    };
  }

  return {
    valid: true,
    byteOffset: 0,
    hasBom: false,
    hasCarriageReturns: false,
  };
}

/**
 * Serializes frontmatter and voice prose with POSIX LF newlines starting at Byte 0
 */
export function buildByteZeroDossier(frontmatter: object, voiceBody: string): string {
  const yamlContent = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: -1,
    sortKeys: true,
  });

  // Strict POSIX LF normalization
  const normalizedYaml = yamlContent.replace(/\r\n/g, "\n").trim();
  const normalizedBody = voiceBody.replace(/\r\n/g, "\n").trim();

  return `---\n${normalizedYaml}\n---\n\n${normalizedBody}\n`;
}

/**
 * Scaffolds an atomic character dossier to disk using atomic POSIX rename
 */
export function scaffoldCharacterDossier(
  targetDir: string,
  frontmatter: CharacterMachineRail,
  voiceBody: string
): string {
  // Validate schema before disk serialization
  const validatedFrontmatter = CharacterMachineRailSchema.parse(frontmatter);
  const content = buildByteZeroDossier(validatedFrontmatter, voiceBody);
  const targetFilePath = path.join(targetDir, `${validatedFrontmatter.id}.md`);
  const tempFilePath = path.join(targetDir, `.tmp_${validatedFrontmatter.id}_${Date.now()}`);

  fs.writeFileSync(tempFilePath, content, { encoding: "utf8" });

  const rawBuffer = fs.readFileSync(tempFilePath);
  const integrity = verifyByteZeroIntegrity(rawBuffer);

  if (!integrity.valid) {
    fs.unlinkSync(tempFilePath);
    throw new Error(`CRITICAL: Byte-0 integrity failure: ${integrity.reason}`);
  }

  fs.renameSync(tempFilePath, targetFilePath);
  return targetFilePath;
}
