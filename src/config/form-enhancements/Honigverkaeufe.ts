// Auto-generated. Per-entity form-enhancements config for "Honigverkäufe".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["verkaufsdatum", "ernte"], "cols": "1fr 1fr"}, {"row": ["kaeufer_vorname", "kaeufer_nachname"]}, "gebindegroesse", {"row": ["anzahl", "menge_kg"], "cols": "1fr 1fr"}, {"row": ["preis_gesamt", "bezahlt"], "cols": "2fr 1fr"}, "bemerkungen"],
  defaults: {
    'verkaufsdatum': { kind: 'today' },
    'anzahl': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
