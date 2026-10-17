import {
  AxialCoord,
  RaycastTraceResult,
  VisualClarityTier,
} from "../../../schemas/acousticLoS.js";

export interface HexCellMetadata {
  coord: AxialCoord;
  opacityPermille: number; // 0 = clear air, 1000 = solid wall
  illuminationLux: number; // e.g., 0 to 300+ lux
}

export interface EdgeOccluderKey {
  qA: number;
  rA: number;
  qB: number;
  rB: number;
}

/**
 * Projects axial coordinate (q, r) to doubled Cartesian coordinates:
 * cx = 4*q + 2*r, cy = 6*r
 * Ensures optical symmetry across diagonal rays with exact integer cross-products.
 */
export function axialToDoubledCartesian(coord: AxialCoord): { cx: number; cy: number } {
  return {
    cx: 4 * coord.q + 2 * coord.r,
    cy: 6 * coord.r,
  };
}

/**
 * Exact 2D integer cross product: (B - A) x (C - A)
 */
export function integerCrossProduct(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

/**
 * Computes axial distance on hex grid: max(|dq|, |dr|, |dq + dr|)
 */
export function getAxialDistance(a: AxialCoord, b: AxialCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

/**
 * Computes deterministic integer supercover ray line connecting A and B.
 */
export function computeIntegerSupercover(a: AxialCoord, b: AxialCoord): AxialCoord[] {
  const N = getAxialDistance(a, b);
  if (N === 0) return [{ ...a }];

  const path: AxialCoord[] = [];
  // Use scaled integer interpolation with NUL-safe midpoint tie-breaking
  for (let i = 0; i <= N; i++) {
    const qFloat = a.q + ((b.q - a.q) * i) / N;
    const rFloat = a.r + ((b.r - a.r) * i) / N;

    // Hex rounding in axial space
    let x = qFloat;
    let z = rFloat;
    let y = -x - z;

    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    path.push({ q: rx, r: rz });
  }

  return path;
}

/**
 * Evaluates Line-of-Sight enforcing the authoritative EDGE_PAIR policy.
 */
export function hasLineOfSight(
  origin: AxialCoord,
  target: AxialCoord,
  cellMap: Map<string, HexCellMetadata>,
  closedEdges: Set<string> = new Set()
): RaycastTraceResult {
  const coordKey = (c: AxialCoord) => `${c.q},${c.r}`;
  const edgeKey = (a: AxialCoord, b: AxialCoord) =>
    (a.q < b.q) || (a.q === b.q && a.r < b.r)
      ? `${a.q},${a.r}<->${b.q},${b.r}`
      : `${b.q},${b.r}<->${a.q},${a.r}`;

  const ray = computeIntegerSupercover(origin, target);
  let accumulatedOpacity = 0;
  let blockedAt: AxialCoord | null = null;
  let blockReason: string | undefined;

  for (let i = 0; i < ray.length; i++) {
    const curr = ray[i];

    // Check closed portal edge between previous and current cell
    if (i > 0) {
      const prev = ray[i - 1];
      if (closedEdges.has(edgeKey(prev, curr))) {
        blockedAt = curr;
        blockReason = `EDGE_PAIR_CLOSED_PORTAL: Crossing closed portal at ${edgeKey(prev, curr)}`;
        break;
      }
    }

    // Endpoint Exemption: Origin and Target are transparent to their own ray
    // We do NOT check opacity for i === 0 or i === ray.length - 1
    if (i === 0 || i === ray.length - 1) {
      continue;
    }

    const cell = cellMap.get(coordKey(curr));
    const opacity = cell ? cell.opacityPermille : 0;

    if (opacity >= 1000) {
      blockedAt = curr;
      blockReason = `INTERIOR_OPAQUE_BLOCK: Cell ${curr.q},${curr.r} is solid obstacle (opacity=1000)`;
      break;
    }

    // Accumulate linear partial opacity
    accumulatedOpacity += opacity;
    if (accumulatedOpacity >= 1000) {
      blockedAt = curr;
      blockReason = `ACCUMULATED_OPACITY_CUTOFF: Fog/steam opacity reached 1000 at ${curr.q},${curr.r}`;
      break;
    }
  }

  const isClear = blockedAt === null;

  // Calculate Visual Clarity Score Q_visual in [0, 1000]
  const distance = getAxialDistance(origin, target);
  const targetCell = cellMap.get(coordKey(target));
  const targetLux = targetCell ? targetCell.illuminationLux : 100;

  let visualClarityScore = 0;
  if (isClear) {
    const distanceFactor = Math.max(0, 1000 - distance * 100);
    const opacityFactor = Math.max(0, 1000 - accumulatedOpacity);
    const illuminationFactor = Math.min(1000, Math.floor((targetLux * 1000) / 300)); // 300 lux = 100%

    // Pure integer product scaled to 1000
    const composite = (distanceFactor * opacityFactor) / 1000;
    visualClarityScore = Math.floor((composite * illuminationFactor) / 1000);
  }

  let clarityTier: VisualClarityTier = "OCCLUDED_BLIND";
  if (visualClarityScore >= 700) {
    clarityTier = "FULLY_RESOLVED";
  } else if (visualClarityScore >= 200) {
    clarityTier = "UNRESOLVED_AMBIGUOUS";
  }

  return {
    clear: isClear,
    visualClarityScore,
    clarityTier,
    traversedCoords: ray,
    blockedAt,
    blockReason,
  };
}
