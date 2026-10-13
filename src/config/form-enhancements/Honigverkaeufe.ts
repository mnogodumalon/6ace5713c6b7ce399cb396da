// Auto-generated. Per-entity form-enhancements config for "Honigverkäufe".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["verkaufsdatum", "ernte", {"row": ["anzahl", "preis_gesamt"], "cols": "1fr 1fr"}, {"row": ["kaeufer_vorname", "kaeufer_nachname"]}, {"row": ["gebindegroesse", "menge_kg"], "cols": "1fr 1fr"}, "bezahlt", "bemerkungen"],
  defaults: {
    'verkaufsdatum': { kind: 'today' },
    'anzahl': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
