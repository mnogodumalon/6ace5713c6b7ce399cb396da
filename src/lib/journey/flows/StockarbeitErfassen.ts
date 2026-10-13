/**
 * useStockarbeitErfassenFlow — the plumbing of the flow « Stockarbeit erfassen », generated from the plan.
 *
 * Writes `stockarbeiten`: asks `volk`, `art`, `volksstaerke`, `sanftmut`, `brutbild`, `weiselrichtig`, `varroabefall`, `mittel`, `menge`, `bemerkungen`; sets `datum` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 3)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useStockarbeitErfassenFlow({
 *     steps: { volk: 1, art: 2, volksstaerke: 2, sanftmut: 2, brutbild: 2, weiselrichtig: 2, varroabefall: 2, mittel: 2, menge: 2, bemerkungen: 2 },
 *     items: { volk: r => ({ id: r.id, title: fieldText(r, 'volksname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.volk.select} {...flow.pick('volk')} />
 *     <Bound form={flow.forms.stockarbeiten} name="art" />
 *     <Bound form={flow.forms.stockarbeiten} name="volksstaerke" />
 *     <Bound form={flow.forms.stockarbeiten} name="sanftmut" />
 *     <Bound form={flow.forms.stockarbeiten} name="brutbild" />
 *     <Bound form={flow.forms.stockarbeiten} name="weiselrichtig" />
 *     <Bound form={flow.forms.stockarbeiten} name="varroabefall" />
 *     <Bound form={flow.forms.stockarbeiten} name="mittel" />
 *     <Bound form={flow.forms.stockarbeiten} name="menge" />
 *     <Bound form={flow.forms.stockarbeiten} name="bemerkungen" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type StockarbeitErfassenFieldKey = 'art' | 'bemerkungen' | 'brutbild' | 'menge' | 'mittel' | 'sanftmut' | 'varroabefall' | 'volk' | 'volksstaerke' | 'weiselrichtig';

export interface StockarbeitErfassenForms {
  stockarbeiten: StepForm<'stockarbeiten'>;
}

// Alias so the option generics stay readable.
type Key = StockarbeitErfassenFieldKey;

export interface StockarbeitErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    volk?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"art": 2, "bemerkungen": 2, "brutbild": 2, "menge": 2, "mittel": 2, "sanftmut": 2, "varroabefall": 2, "volk": 1, "volksstaerke": 2, "weiselrichtig": 2};
export const STOCKARBEITERFASSEN_REVIEW_STEP = 3;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useStockarbeitErfassenFlow(options: StockarbeitErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const stockarbeiten = useStepForm('stockarbeiten', {
    fields: ["volk", "art", "volksstaerke", "sanftmut", "brutbild", "weiselrichtig", "varroabefall", "mittel", "menge", "bemerkungen"],
    steps: only(steps, ["volk", "art", "volksstaerke", "sanftmut", "brutbild", "weiselrichtig", "varroabefall", "mittel", "menge", "bemerkungen"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["volk", "art", "volksstaerke", "sanftmut", "brutbild", "weiselrichtig", "varroabefall", "mittel", "menge", "bemerkungen"]),
    messages: only(options.messages as Record<string, string> | undefined, ["volk", "art", "volksstaerke", "sanftmut", "brutbild", "weiselrichtig", "varroabefall", "mittel", "menge", "bemerkungen"]),
  });
  const forms: StockarbeitErfassenForms = { stockarbeiten };
  const formList: StepForm[] = [stockarbeiten];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    volk: useRecordSearch(servicePort, 'bienenvoelker', withPickPolicy('volk', {
      searchFields: ["volksname"] as never,
      filter: "r.v_status in ['aktiv', 'ableger', 'eingewintert']",
      where: (r: JourneyRecord) => ["aktiv", "ableger", "eingewintert"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.volk as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:stockarbeit-erfassen:read:${entity}`);
  const picks = {
    volk: { ...searches.volk, select: { ...searches.volk.select, create: true as boolean, hint: hintFor('volk', 'bienenvoelker', {"conditions": [{"field": "status", "op": "in", "value": ["aktiv", "ableger", "eingewintert"]}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'stockarbeiten', entity: 'stockarbeiten', form: stockarbeiten, primary: true,
      values: (): FormValues => ({
        datum: policyFixedValue('stockarbeiten', 'datum') ?? nowIso(),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'stockarbeit-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: StockarbeitErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: StockarbeitErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'stockarbeit-erfassen' as const,
    draftKey: 'stockarbeit-erfassen' as const,
    entity: 'stockarbeiten' as const,
    form: stockarbeiten,
    forms, formList, picks, submit, steps,    reviewStep: STOCKARBEITERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type StockarbeitErfassenFlow = ReturnType<typeof useStockarbeitErfassenFlow>;
