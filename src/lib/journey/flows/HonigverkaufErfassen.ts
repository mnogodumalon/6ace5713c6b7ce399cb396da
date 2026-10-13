/**
 * useHonigverkaufErfassenFlow — the plumbing of the flow « Honigverkauf erfassen », generated from the plan.
 *
 * Writes `honigverkaeufe`: asks `ernte`, `kaeufer_vorname`, `kaeufer_nachname`, `gebindegroesse`, `anzahl`, `preis_gesamt`, `bezahlt`, `bemerkungen`; sets `verkaufsdatum` itself.
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
 *   const flow = useHonigverkaufErfassenFlow({
 *     steps: { ernte: 1, kaeufer_vorname: 2, kaeufer_nachname: 2, gebindegroesse: 2, anzahl: 2, preis_gesamt: 2, bezahlt: 2, bemerkungen: 2 },
 *     items: { ernte: r => ({ id: r.id, title: fieldText(r, 'charge') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.ernte.select} {...flow.pick('ernte')} />
 *     <Bound form={flow.forms.honigverkaeufe} name="kaeufer_vorname" />
 *     <Bound form={flow.forms.honigverkaeufe} name="kaeufer_nachname" />
 *     <Bound form={flow.forms.honigverkaeufe} name="gebindegroesse" />
 *     <Bound form={flow.forms.honigverkaeufe} name="anzahl" />
 *     <Bound form={flow.forms.honigverkaeufe} name="preis_gesamt" />
 *     <Bound form={flow.forms.honigverkaeufe} name="bezahlt" />
 *     <Bound form={flow.forms.honigverkaeufe} name="bemerkungen" />
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
export type HonigverkaufErfassenFieldKey = 'anzahl' | 'bemerkungen' | 'bezahlt' | 'ernte' | 'gebindegroesse' | 'kaeufer_nachname' | 'kaeufer_vorname' | 'preis_gesamt';

export interface HonigverkaufErfassenForms {
  honigverkaeufe: StepForm<'honigverkaeufe'>;
}

// Alias so the option generics stay readable.
type Key = HonigverkaufErfassenFieldKey;

export interface HonigverkaufErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    ernte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anzahl": 2, "bemerkungen": 2, "bezahlt": 2, "ernte": 1, "gebindegroesse": 2, "kaeufer_nachname": 2, "kaeufer_vorname": 2, "preis_gesamt": 2};
export const HONIGVERKAUFERFASSEN_REVIEW_STEP = 3;

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

export function useHonigverkaufErfassenFlow(options: HonigverkaufErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const honigverkaeufe = useStepForm('honigverkaeufe', {
    fields: ["ernte", "kaeufer_vorname", "kaeufer_nachname", "gebindegroesse", "anzahl", "preis_gesamt", "bezahlt", "bemerkungen"],
    steps: only(steps, ["ernte", "kaeufer_vorname", "kaeufer_nachname", "gebindegroesse", "anzahl", "preis_gesamt", "bezahlt", "bemerkungen"]) as Record<string, number>,
    // the plan builds a value from these — required here, whatever the app's base view says
    required: { anzahl: true, gebindegroesse: true },
    initial: only(options.initial as FormValues | undefined, ["ernte", "kaeufer_vorname", "kaeufer_nachname", "gebindegroesse", "anzahl", "preis_gesamt", "bezahlt", "bemerkungen"]),
    messages: only(options.messages as Record<string, string> | undefined, ["ernte", "kaeufer_vorname", "kaeufer_nachname", "gebindegroesse", "anzahl", "preis_gesamt", "bezahlt", "bemerkungen"]),
  });
  const forms: HonigverkaufErfassenForms = { honigverkaeufe };
  const formList: StepForm[] = [honigverkaeufe];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    ernte: useRecordSearch(servicePort, 'honigernten', withPickPolicy('ernte', {
      searchFields: ["charge"] as never,
      toItem: options.items?.ernte as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:honigverkauf-erfassen:read:${entity}`);
  const picks = {
    ernte: { ...searches.ernte, select: { ...searches.ernte.select, create: false as boolean, hint: hintFor('ernte', 'honigernten', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'honigverkaeufe', entity: 'honigverkaeufe', form: honigverkaeufe, primary: true,
      values: (): FormValues => ({
        verkaufsdatum: policyFixedValue('honigverkaeufe', 'verkaufsdatum') ?? todayIso(),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'honigverkauf-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: HonigverkaufErfassenFieldKey) => {
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
  const pickMany = (field: HonigverkaufErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'honigverkauf-erfassen' as const,
    draftKey: 'honigverkauf-erfassen' as const,
    entity: 'honigverkaeufe' as const,
    form: honigverkaeufe,
    forms, formList, picks, submit, steps,    reviewStep: HONIGVERKAUFERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type HonigverkaufErfassenFlow = ReturnType<typeof useHonigverkaufErfassenFlow>;
