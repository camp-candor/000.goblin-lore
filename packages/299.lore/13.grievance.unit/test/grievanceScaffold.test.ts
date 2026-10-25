/**
 * packages/299.lore/13.grievance.unit/test/grievanceScaffold.test.ts
 * Vitest verification battery for Interactive Grievance Scaffolding Interview.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GrievanceModel } from '../grievance.model';
import * as ActGrv from '../grievance.action';
import { reducer } from '../grievance.reduce';
import {
  validateParticipantDyad,
  renderGrievanceDossierMarkdown,
  writeGrievanceDossierAtomic,
} from '../buz/grievanceScaffold.buzz';

describe('Interactive Grievance Scaffolding Interview (13.grievance.unit)', () => {
  const tmpTestDir = path.join(process.cwd(), '.tmp_test_grievance_scaffold');

  afterEach(() => {
    if (fs.existsSync(tmpTestDir)) {
      fs.rmSync(tmpTestDir, { recursive: true, force: true });
    }
  });

  it('P0.1: enforces Anti-Reflexivity: rejects self-grievances and sorts distinct dyads', () => {
    // Reflexive pairing MUST FAIL
    const selfRes = validateParticipantDyad(['char_bog', 'char_bog']);
    expect(selfRes.valid).toBe(false);
    expect(selfRes.error?.includes('SELF_GRIEVANCE_BREACH')).toBe(true);

    // Wrong count MUST FAIL
    const countRes = validateParticipantDyad(['char_bog']);
    expect(countRes.valid).toBe(false);

    // Valid distinct pairing -> passes and sorts lexicographically
    const validRes = validateParticipantDyad(['char_spleen', 'char_bog']);
    expect(validRes.valid).toBe(true);
    expect(validRes.sortedTuple).toEqual(['char_bog', 'char_spleen']);
  });

  it('P0.2: formats grievance spring dossier strictly beginning with --- at Byte 0', () => {
    const md = renderGrievanceDossierMarkdown({
      id: 'grv_silver_spoon_grease',
      title: 'The Good Silver Spoon',
      category: 'resource_hoarding',
      participantsPrimary: ['char_bog', 'char_spleen'],
      participantsCanInvolve: ['char_wart'],
      participantsCannotInvolve: ['char_mum_grissel'],
      intensityFloor: 1,
      intensityCeiling: 4,
      cooldownCycles: 3,
      decayRate: 'slow',
      tonalOverrideEligible: false,
      physicalAnchorProp: 'item_silver_spoon',
      spawnsOnMaxEscalation: {
        type: 'grievance',
        target_id: 'grv_hoarding_reveal',
      },
    });

    const buf = Buffer.from(md, 'utf8');
    expect(buf[0]).toBe(0x2d); // '-'
    expect(buf[1]).toBe(0x2d); // '-'
    expect(buf[2]).toBe(0x2d); // '-'
    expect(buf[3]).toBe(0x0a); // '\n'
    expect(md.includes('id: grv_silver_spoon_grease')).toBe(true);
    expect(md.includes('category: resource_hoarding')).toBe(true);
    expect(md.includes('participants_primary:')).toBe(true);
    expect(md.includes('physical_anchor_prop: item_silver_spoon')).toBe(true);
    expect(md.includes('## Surface Complaint')).toBe(true);
    expect(md.includes('## The Underneath')).toBe(true);
    expect(md.includes('## Escalation Path')).toBe(true);
    expect(md.includes('## Callback Phrases')).toBe(true);
  });

  it('P0.3: enforces Farce Contract invariants when tonal_override_eligible is true', () => {
    const md = renderGrievanceDossierMarkdown({
      id: 'grv_shiny_button',
      title: 'The Shiny Button Claim',
      category: 'status_anxiety',
      participantsPrimary: ['char_spleen', 'char_wart'],
      participantsCanInvolve: [],
      participantsCannotInvolve: [],
      intensityFloor: 1,
      intensityCeiling: 2,
      cooldownCycles: 2,
      decayRate: 'fast',
      tonalOverrideEligible: true,
      spawnsOnMaxEscalation: null,
    });

    expect(md.includes('tonal_override_eligible: true')).toBe(true);
    expect(md.includes('spawns_on_max_escalation:\n  null')).toBe(true);
    expect(md.includes("There genuinely isn't one. This is the point.")).toBe(true);
  });

  it('P0.4: executes atomic POSIX file persistence and enforces Byte 0 invariant', () => {
    const targetFile = path.join(tmpTestDir, 'grv_atomic_dispute.md');
    const content = renderGrievanceDossierMarkdown({
      id: 'grv_atomic_dispute',
      title: 'Atomic Dispute',
      category: 'territorial_boundary',
      participantsPrimary: ['char_actor_a', 'char_actor_b'],
      participantsCanInvolve: [],
      participantsCannotInvolve: [],
      intensityFloor: 2,
      intensityCeiling: 5,
      cooldownCycles: 4,
      decayRate: 'medium',
      tonalOverrideEligible: false,
      spawnsOnMaxEscalation: null,
    });

    writeGrievanceDossierAtomic(targetFile, content);

    expect(fs.existsSync(targetFile)).toBe(true);
    const readBuf = fs.readFileSync(targetFile);
    expect(readBuf[0]).toBe(0x2d);
    expect(readBuf[1]).toBe(0x2d);
    expect(readBuf[2]).toBe(0x2d);
  });

  it('P0.5: routes SCAFFOLD_GRIEVANCE_WIZARD through reducer with state bus mocks', async () => {
    const model = new GrievanceModel();
    const calls: Array<{ action: string; payload: any }> = [];

    const mockState: any = {
      hunt: vi.fn(async (action: string, payload: any) => {
        calls.push({ action, payload });
        return {};
      }),
    };

    let resolvedResult: any = null;
    const action = new ActGrv.ScaffoldGrievanceWizard({
      idx: 'test-grv-wizard',
      dat: {
        seriesSlug: 'test-series',
        grvId: 'grv_unit_test',
        title: 'Unit Test Feud',
        category: 'secret_keeping',
        participantsPrimary: ['char_spleen', 'char_bog'],
        intensityFloor: 2,
        intensityCeiling: 4,
        cooldownCycles: 4,
        decayRate: 'slow',
        tonalOverrideEligible: false,
        spawnsOnMaxEscalation: {
          type: 'secret',
          target_id: 'sec_famine_well',
        },
      },
      slv: (res) => {
        resolvedResult = res;
      },
    });

    await reducer(model, action, mockState);

    expect(resolvedResult).toBeDefined();
    expect(resolvedResult.success).toBe(true);
    expect(resolvedResult.grvId).toBe('grv_unit_test');
    expect(resolvedResult.participants).toEqual(['char_bog', 'char_spleen']);

    const consoleCalls = calls.filter((c) => c.action === '[Console action] Update Console');
    expect(consoleCalls.length).toBeGreaterThan(0);
    const sealedCall = consoleCalls.find((c) => c.payload?.src?.includes('written to disk at Byte 0'));
    expect(sealedCall).toBeDefined();

    // Clean up created file in series/test-series if written
    if (resolvedResult.filePath && fs.existsSync(resolvedResult.filePath)) {
      fs.unlinkSync(resolvedResult.filePath);
      const parentDir = path.dirname(resolvedResult.filePath);
      if (fs.existsSync(parentDir)) fs.rmdirSync(parentDir);
    }
  });
});
