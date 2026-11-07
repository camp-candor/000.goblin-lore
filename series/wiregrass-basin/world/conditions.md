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
  - condition_slug: cnd_elephants_sway
    title: The Elephant Sway Vestibular Oscillations
    arm_penalty_bps: 0
    velocity_penalty_bps: 500
    chronic_fatigue_floor_bps: 1500
    chronic_pain_floor_bps: 800
    chronic_refusal_strain_floor_bps: 1200
    chronic_paranoia_floor_bps: 2800
    auditory_debuff_cdb: 400
    banned_verbs:
      - sit_still
      - freeze_posture
    dsp_deltas:
      pitch_shift_centitones: -200
      formant_warping_bps: 9600
      vocal_fry_density_bps: 1800
      breathiness_pause_bps: 11500
      banned_cadences:
        - RAPID_STACCATO
  - condition_slug: cnd_euclidean_posture
    title: Euclidean Cervical Spine Lock
    arm_penalty_bps: 0
    velocity_penalty_bps: 1000
    chronic_fatigue_floor_bps: 1200
    chronic_pain_floor_bps: 1000
    chronic_refusal_strain_floor_bps: 2400
    chronic_paranoia_floor_bps: 3600
    auditory_debuff_cdb: 0
    banned_verbs:
      - nod
      - head_tilt
      - slouch
    dsp_deltas:
      pitch_shift_centitones: 150
      formant_warping_bps: 10000
      vocal_fry_density_bps: 500
      breathiness_pause_bps: 10500
      banned_cadences:
        - SLOW_DRAWL
  - condition_slug: cnd_third_metatarsal_fracture
    title: Right Ankle Third-Metatarsal Stress Fracture
    arm_penalty_bps: 0
    velocity_penalty_bps: 3500
    chronic_fatigue_floor_bps: 2800
    chronic_pain_floor_bps: 5200
    chronic_refusal_strain_floor_bps: 1800
    chronic_paranoia_floor_bps: 1800
    auditory_debuff_cdb: 0
    banned_verbs:
      - sprint
      - run
      - jump
      - lunge
    dsp_deltas:
      pitch_shift_centitones: -50
      formant_warping_bps: 9500
      vocal_fry_density_bps: 2200
      breathiness_pause_bps: 12500
      banned_cadences: []
---

# Canonical World Conditions (Wiregrass Basin)
