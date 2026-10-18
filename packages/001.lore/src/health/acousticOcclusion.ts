import {
  EdgeOccluder,
  AcousticEmission,
  AuditoryPerceptReceipt,
} from "../../schemas/acousticLoS.js";

export interface RoomAcousticNode {
  roomId: string;
  ambientNoiseFloorCdB: number; // e.g., 2,500 cdB = 25 dB
  adjacentPortals: Array<{
    targetRoomId: string;
    portalId: string;
    dampingCdB: number;
    isClosed: boolean;
  }>;
}

export interface AcousticObserverProfile {
  actorId: string;
  roomId: string;
  hearingThresholdCdB: number; // e.g., standard 2,000 cdB (20 dB)
  facingDirectionHex?: number; // 0 to 5
}

export class AcousticWavefrontSolver {
  private rooms: Map<string, RoomAcousticNode>;
  private snrMinMarginCdB: number;

  constructor(
    rooms: RoomAcousticNode[] = [],
    snrMinMarginCdB: number = 600 // 6.0 dB standard SNR margin
  ) {
    this.rooms = new Map(rooms.map((r) => [r.roomId, r]));
    this.snrMinMarginCdB = snrMinMarginCdB;
  }

  public registerRoom(room: RoomAcousticNode): void {
    this.rooms.set(room.roomId, room);
  }

  /**
   * Propagates acoustic energy across room boundaries using maximum-energy BFS.
   * Total loss is calculated via exact integer addition: Loss_total = sum(damping_i).
   */
  public propagateWavefront(
    emission: AcousticEmission
  ): Map<string, { arrivalIntensityCdB: number; primaryPath: string[] }> {
    const arrivalMap = new Map<string, { arrivalIntensityCdB: number; primaryPath: string[] }>();
    const queue: Array<{ roomId: string; currentPowerCdB: number; path: string[] }> = [
      {
        roomId: emission.originRoomId,
        currentPowerCdB: emission.sourcePowerCdB,
        path: [emission.originRoomId],
      },
    ];

    arrivalMap.set(emission.originRoomId, {
      arrivalIntensityCdB: emission.sourcePowerCdB,
      primaryPath: [emission.originRoomId],
    });

    while (queue.length > 0) {
      // Deterministic BFS traversal sorted by highest remaining power
      queue.sort((a, b) => b.currentPowerCdB - a.currentPowerCdB);
      const current = queue.shift()!;
      const room = this.rooms.get(current.roomId);
      if (!room) continue;

      for (const portal of room.adjacentPortals) {
        const neighbor = this.rooms.get(portal.targetRoomId);
        if (!neighbor) continue;

        // Additive attenuation: portal loss + closed door penalty if closed
        const doorPenalty = portal.isClosed ? 2500 : 0; // Extra 25 dB if shut
        const stepLoss = portal.dampingCdB + doorPenalty;
        const arrivalPower = current.currentPowerCdB - stepLoss;

        // Attenuation cutoff: drop instantly if power is below ambient noise floor
        if (arrivalPower <= neighbor.ambientNoiseFloorCdB) {
          continue;
        }

        const existing = arrivalMap.get(portal.targetRoomId);
        if (!existing || existing.arrivalIntensityCdB < arrivalPower) {
          const nextPath = [...current.path, portal.targetRoomId];
          arrivalMap.set(portal.targetRoomId, {
            arrivalIntensityCdB: arrivalPower,
            primaryPath: nextPath,
          });
          queue.push({
            roomId: portal.targetRoomId,
            currentPowerCdB: arrivalPower,
            path: nextPath,
          });
        }
      }
    }

    return arrivalMap;
  }

  /**
   * Evaluates auditory perception for an observer based on the dual audibility criterion.
   */
  public evaluateObserverAudibility(
    emission: AcousticEmission,
    observer: AcousticObserverProfile,
    arrivalMap: Map<string, { arrivalIntensityCdB: number; primaryPath: string[] }>
  ): AuditoryPerceptReceipt {
    const arrival = arrivalMap.get(observer.roomId);
    const room = this.rooms.get(observer.roomId);
    const ambientNoiseCdB = room ? room.ambientNoiseFloorCdB : 1500;

    if (!arrival) {
      return {
        observerId: observer.actorId,
        sourceEventId: emission.eventId,
        observerRoomId: observer.roomId,
        arrivalIntensityCdB: 0,
        receivedSnrCdB: -ambientNoiseCdB,
        witnessCategory: "ACOUSTIC_CUTOFF",
        isAudible: false,
      };
    }

    const arrivalPower = arrival.arrivalIntensityCdB;
    const receivedSnrCdB = arrivalPower - ambientNoiseCdB;

    // Dual-Condition Audibility Check
    const clearsHearingThreshold = arrivalPower >= observer.hearingThresholdCdB;
    const clearsSnrMargin = receivedSnrCdB >= this.snrMinMarginCdB;
    const isAudible = clearsHearingThreshold && clearsSnrMargin;

    let witnessCategory: AuditoryPerceptReceipt["witnessCategory"] = "ACOUSTIC_CUTOFF";

    if (isAudible) {
      if (arrivalPower >= 3500) {
        witnessCategory = "DIRECT_AUDITORY_WITNESS";
      } else {
        witnessCategory = "MUFFLED_EAVESDROPPING";
      }
    }

    return {
      observerId: observer.actorId,
      sourceEventId: emission.eventId,
      observerRoomId: observer.roomId,
      arrivalIntensityCdB: arrivalPower,
      receivedSnrCdB,
      witnessCategory,
      isAudible,
    };
  }
}
