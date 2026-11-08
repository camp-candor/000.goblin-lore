import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { scaffoldSeriesTree } from '../buz/scaffoldSeriesTree.buzz.js'
import { SeriesModel } from '../series.model.js'
import type { SeriesConfig } from '../fce/series.schema.js'

describe('Task 4.2 Series Tree Directory Scaffolding Buzzer Gauntlet', () => {
  let tempRepoRoot: string

  const mockConfig: SeriesConfig = {
    schema_version: '1.0.0',
    series_slug: 'test-sandbox-series',
    display_name: 'Test Sandbox Series',
    genre_tag: 'LOW_FANTASY_FARCE',
    central_irony: 'Goblins guarding valuable ancient valves without understanding water pressure.',
    state_space: {
      scarcity_index_bp: 8000,
      paranoia_baseline_bp: 6000,
      somatic_fatigue_enabled: true,
      epistemic_ignorance_enabled: true,
      gram_mass_tiers: {
        scrap_max_grams: 50,
        weight_max_grams: 5000,
        bulk_min_grams: 5001,
      },
    },
    action_vocabulary: {
      permitted_kinetic_verbs: ['LIMP', 'SIPHON', 'HOARD'],
      forbidden_verbs_global: ['fly'],
      locomotion_taxonomies: ['BIPEDAL_HUNCHED'],
    },
    invariant_rules: {
      max_farce_ratio_bp: 1500,
      min_grievance_depth_delta: 1,
      global_acoustic_floor_cdb: 1500,
      voiceover_ducking_db: -14,
      min_normalized_category_entropy_bp: 7000,
      thematic_categories: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    },
    medium_projections: {
      target_fps: 24,
      audio_sample_rate_hz: 48000,
      tts_service_port: 8000,
      video_service_port: 8188,
      aspect_ratio: '16:9',
    },
  }

  beforeEach(() => {
    tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin-scaffold-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempRepoRoot)) {
      fs.rmSync(tempRepoRoot, { recursive: true, force: true })
    }
  })

  it('scaffolds all domain subdirectories, ontology/unresolved.json, and series.config.json', async () => {
    const model = new SeriesModel()
    let result: any = null

    const bal = {
      idx: 'test-scaffold',
      dat: {
        seriesSlug: 'test-sandbox-series',
        config: mockConfig,
        repoRoot: tempRepoRoot,
      },
      slv: (res: any) => {
        result = res
      },
    }

    await scaffoldSeriesTree(model, bal as any)

    expect(result).toBeDefined()
    expect(result.seriesBit.val).toBe(1)
    expect(result.seriesBit.dat.initialized).toBe(true)

    const seriesDir = path.join(tempRepoRoot, 'series', 'test-sandbox-series')
    expect(fs.existsSync(path.join(seriesDir, 'characters'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'characters', '_retired'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'locations'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'possessions'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'grievances'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'grievances', '_retired'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'ontology'))).toBe(true)
    expect(fs.existsSync(path.join(seriesDir, 'world'))).toBe(true)
    expect(fs.existsSync(path.join(tempRepoRoot, 'compiled', 'test-sandbox-series'))).toBe(true)

    const unresolvedPath = path.join(seriesDir, 'ontology', 'unresolved.json')
    expect(fs.existsSync(unresolvedPath)).toBe(true)
    expect(fs.readFileSync(unresolvedPath, 'utf8')).toBe('[]\n')

    const configPath = path.join(seriesDir, 'series.config.json')
    expect(fs.existsSync(configPath)).toBe(true)
    const onDiskConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    expect(onDiskConfig.series_slug).toBe('test-sandbox-series')
    expect(onDiskConfig.central_irony).toBe(mockConfig.central_irony)
  })

  it('fails closed when attempting to scaffold an existing series namespace', async () => {
    const model = new SeriesModel()
    const targetDir = path.join(tempRepoRoot, 'series', 'test-sandbox-series')
    fs.mkdirSync(targetDir, { recursive: true })

    let result: any = null
    const bal = {
      idx: 'test-collision',
      dat: {
        seriesSlug: 'test-sandbox-series',
        config: mockConfig,
        repoRoot: tempRepoRoot,
      },
      slv: (res: any) => {
        result = res
      },
    }

    await scaffoldSeriesTree(model, bal as any)

    expect(result).toBeDefined()
    expect(result.seriesBit.val).toBe(0)
    expect(result.seriesBit.dat.error).toContain('CONFLICT_BLOCKED')
  })

  it('fails closed when missing series slug or config', async () => {
    const model = new SeriesModel()
    let result: any = null
    const bal = {
      idx: 'test-missing',
      dat: {},
      slv: (res: any) => {
        result = res
      },
    }

    await scaffoldSeriesTree(model, bal as any)

    expect(result).toBeDefined()
    expect(result.seriesBit.val).toBe(0)
    expect(result.seriesBit.dat.error).toBe('MISSING_SERIES_SLUG')
  })
})
