---
id: world_conditions_registry
type: conditions_catalog
version: 1
conditions:
  - condition_slug: cnd_severed_left_arm
    title: Severed Left Arm
    arm_penalty_bps: 10000
    velocity_penalty_bps: 0
    chronic_fatigue_floor_bps: 1500
    chronic_pain_floor_bps: 3500
    chronic_refusal_strain_floor_bps: 2000
    chronic_paranoia_floor_bps: 1000
    auditory_debuff_cdb: 0
    banned_verbs:
      - bimanual_lift
      - two_handed_strike
    dsp_deltas:
      pitch_shift_centitones: 0
      formant_warping_bps: 10000
      vocal_fry_density_bps: 2000
      breathiness_pause_bps: 11000
      banned_cadences: []
  - condition_slug: cnd_crushed_larynx
    title: Crushed Laryngeal Cartilage
    arm_penalty_bps: 0
    velocity_penalty_bps: 0
    chronic_fatigue_floor_bps: 2500
    chronic_pain_floor_bps: 4000
    chronic_refusal_strain_floor_bps: 3000
    chronic_paranoia_floor_bps: 2500
    auditory_debuff_cdb: 1500
    banned_verbs:
      - yell
      - shout
    dsp_deltas:
      pitch_shift_centitones: -400
      formant_warping_bps: 7000
      vocal_fry_density_bps: 4500
      breathiness_pause_bps: 15000
      banned_cadences:
        - RAPID_STACCATO
---

# Canonical World Conditions (Under the Floorboards)
