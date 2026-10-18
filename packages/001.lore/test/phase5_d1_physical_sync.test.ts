import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import Database from "better-sqlite3";
import { syncPhysicalCoreToD1 } from "../scripts/syncPhysicalCoreToD1.js";

describe("Task GPS-5.3: Gated Upstream D1 Physical Core Migration Bridge", () => {
  let tmpDir: string;
  let dbPath: string;
  let compiledBiblePath: string;
  const mockStateHash = "a".repeat(64);

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "goblin_lore_d1_sync_"));
    dbPath = path.join(tmpDir, "local_pilot.db");
    compiledBiblePath = path.join(tmpDir, "bible-state.json");

    // Initialize local SQLite database with Phase 5 physical schema
    const db = new Database(dbPath);
    const schemaSql = fs.readFileSync(
      path.resolve(__dirname, "../migrations/0002_physical_state_core.sql"),
      "utf8"
    );
    db.exec(schemaSql);

    // Seed valid baseline rows
    db.prepare("INSERT INTO rooms VALUES ('loc_culvert', 'Culvert Sump', 0, 500, 2000)").run();
    db.prepare("INSERT INTO rooms VALUES ('loc_pump_house', 'Pump House', 0, 800, 1500)").run();
    db.prepare("INSERT INTO room_portals VALUES ('loc_culvert', 'loc_pump_house', 1, 3500)").run();
    db.prepare("INSERT INTO room_portals VALUES ('loc_pump_house', 'loc_culvert', 1, 3500)").run();
    db.prepare(
      "INSERT INTO entities_physical VALUES ('char_bog', 'Bog', 'loc_culvert', 10000, 'AWAKE', '[]', '[]', 0)"
    ).run();
    db.prepare(
      "INSERT INTO item_placements VALUES ('item_brass_siphon', 'Brass Siphon', 'ACTOR_SLOT', 'char_bog', 'held', 500, 'IMMUNE', 10000)"
    ).run();
    db.close();

    // Seed compiled bible-state.json
    fs.writeFileSync(
      compiledBiblePath,
      JSON.stringify({
        _meta: {
          seriesSlug: "under-the-floorboards",
          version: 1,
          state_hash: mockStateHash,
        },
        characters: {},
      })
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("HALT: Throws PRECONDITION_FAILED when adversarial test battery has not passed", () => {
    expect(() => {
      syncPhysicalCoreToD1({
        localDbPath: dbPath,
        compiledBiblePath,
        isPhysicalTestSuitePassed: false, // Breach
        d1BindingTarget: "CANON_DB",
      });
    }).toThrow(/ADVERSARIAL_BATTERY_NOT_CLEARED/);
  });

  it("HALT: Throws LOCAL_DB_NOT_FOUND when database file does not exist", () => {
    const missingDbPath = path.join(tmpDir, "missing.db");
    expect(() => {
      syncPhysicalCoreToD1({
        localDbPath: missingDbPath,
        compiledBiblePath,
        isPhysicalTestSuitePassed: true,
      });
    }).toThrow(/LOCAL_DB_NOT_FOUND/);
  });

  it("HALT: Throws COMPILED_HASH_INVALID when state_hash is malformed or absent", () => {
    const corruptBiblePath = path.join(tmpDir, "corrupt_bible.json");
    fs.writeFileSync(
      corruptBiblePath,
      JSON.stringify({ _meta: { state_hash: "invalid_short_hash" } })
    );

    expect(() => {
      syncPhysicalCoreToD1({
        localDbPath: dbPath,
        compiledBiblePath: corruptBiblePath,
        isPhysicalTestSuitePassed: true,
      });
    }).toThrow(/COMPILED_HASH_INVALID/);
  });

  it("HALT: Throws REQUIRED_TABLE_MISSING when a required physical table is dropped", () => {
    const brokenDbPath = path.join(tmpDir, "broken.db");
    const brokenDb = new Database(brokenDbPath);
    brokenDb.exec("CREATE TABLE rooms (id TEXT PRIMARY KEY, name TEXT);");
    // Omit entities_physical, room_portals, item_placements
    brokenDb.close();

    expect(() => {
      syncPhysicalCoreToD1({
        localDbPath: brokenDbPath,
        compiledBiblePath,
        isPhysicalTestSuitePassed: true,
      });
    }).toThrow(/REQUIRED_TABLE_MISSING/);
  });

  it("HALT: Throws UNPARDONABLE_STATE_BREACH if database contains illegal somatic invariants", () => {
    const corruptDb = new Database(dbPath);
    // Inject dead character with living vitality
    corruptDb
      .prepare(
        "INSERT INTO entities_physical VALUES ('char_zombie', 'Ghost', 'loc_culvert', 5000, 'DECEASED', '[]', '[]', 0)"
      )
      .run();
    corruptDb.close();

    expect(() => {
      syncPhysicalCoreToD1({
        localDbPath: dbPath,
        compiledBiblePath,
        isPhysicalTestSuitePassed: true,
      });
    }).toThrow(/UNPARDONABLE_STATE_BREACH/);
  });

  it("SUCCESS: Emits SYNC_READY and returns exact table counts when all preconditions clear", () => {
    const res = syncPhysicalCoreToD1({
      localDbPath: dbPath,
      compiledBiblePath,
      isPhysicalTestSuitePassed: true,
      d1BindingTarget: "CANON_DB",
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("SYNC_READY");
    expect(res.stateHash).toBe(mockStateHash);
    expect(res.counts.rooms).toBe(2);
    expect(res.counts.portals).toBe(2);
    expect(res.counts.entities).toBe(1);
    expect(res.counts.items).toBe(1);
    expect(res.targetBinding).toBe("CANON_DB");
  });
});
