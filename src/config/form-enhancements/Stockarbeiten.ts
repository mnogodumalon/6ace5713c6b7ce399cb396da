// Auto-generated. Per-entity form-enhancements config for "Stockarbeiten".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["volk", "datum", "art", {"row": ["volksstaerke", "sanftmut"], "cols": "1fr 1fr"}, {"row": ["brutbild", "varroabefall"], "cols": "1fr 1fr"}, "weiselrichtig", {"row": ["mittel", "menge"], "cols": "2fr 1fr"}, "bemerkungen"],
  defaults: {
    'datum': { kind: 'today', withTime: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
