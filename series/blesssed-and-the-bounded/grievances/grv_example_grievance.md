---
id: 'grv_example_grievance'
title: 'Example Dyadic Grievance'
type: 'grievance'
category: 'RESOURCE_HOARDING'
participants_primary:
  - 'char_example_character'
  - 'char_example_rival_character'
intensity_bp: 2500
escalation_ceiling_bp: 7500
cooldown_ticks: 3
spawns_on_max_escalation: []
outcomes:
  clean_win:
    mechanics: 'Example character secures the disputed resource cleanly.'
    somatic_cost_bp: 150
    strings_transferred: 1
  costly_win:
    mechanics:
      'Example character secures the resource with minor somatic fatigue.'
    somatic_cost_bp: 900
    strings_transferred: 1
  mutual_wound:
    mechanics: 'Both participants sustain reciprocal somatic strain.'
    somatic_cost_bp: 1800
    strings_transferred: 0
  backfire:
    mechanics: 'The grievance dispute backfires and the resource is dropped.'
    somatic_cost_bp: 2500
    strings_transferred: -1
---

# Grievance: Example Dyadic Grievance

An exemplar dyadic grievance in 'blesssed-and-the-bounded' between two primary
participants demonstrating intensity scaling and 4-way outcome resolution.
