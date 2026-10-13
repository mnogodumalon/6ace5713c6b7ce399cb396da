/**
 * Stockarbeit erfassen — 5-Schritt-Wizard.
 * Steps: 1) Standort wählen → 2) Volk wählen → 3) Art der Arbeit & Beobachtungen → 4) Mittel & Menge → 5) Prüfen & speichern.
 * Reads: standorte (über flow.port), bienenvoelker (Hook-Pick). Writes: stockarbeiten (über useStockarbeitErfassenFlow, datum = jetzt).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useMemo, useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldRef, optionsOf, type JourneyRecord } from '@/lib/journey';
import { useStockarbeitErfassenFlow } from '@/lib/journey/flows/StockarbeitErfassen';
import { tx } from '@/i18n';
import { cn } from '@/lib/utils';

interface StandortOption {
  id: string;
  title: string;
  subtitle: string;
}

export default function StockarbeitErfassenPage() {
  const [step, setStep] = useState(1);
  const [standorte, setStandorte] = useState<StandortOption[] | null>(null);
  const [standortError, setStandortError] = useState<string | null>(null);
  const [standortId, setStandortId] = useState<string | null>(null);

  const flow = useStockarbeitErfassenFlow({
    steps: { volk: 2, art: 3, volksstaerke: 3, sanftmut: 3, brutbild: 3, weiselrichtig: 3, varroabefall: 3, bemerkungen: 3, mittel: 4, menge: 4 },
    items: {
      volk: r => ({
        id: r.id,
        title: fieldText(r, 'volksname'),
        subtitle: fieldLookup(r, 'volksstaerke')?.label,
        status: fieldLookup(r, 'status') ?? undefined,
      }),
    },
  });
  const f = flow.forms.stockarbeiten;
  const volk = flow.picks.volk;

  useEffect(() => {
    let alive = true;
    flow.port
      .list('standorte', { orderby: ['r.v_bezeichnung asc'] })
      .then(rows => {
        if (!alive) return;
        setStandorte(rows.map(r => ({ id: r.id, title: fieldText(r, 'bezeichnung'), subtitle: fieldText(r, 'ort') })));
      })
      .catch(e => {
        if (alive) setStandortError(e instanceof Error ? e.message : String(e));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inStandort = (r: JourneyRecord | undefined) => !standortId || (r ? fieldRef(r, 'standort') === standortId : false);
  const standortItems = volk.select.items.filter(i => inStandort(volk.recordOf(i.id)));
  // Hat der Standort kein Volk, zeigen wir alle statt einer leeren Liste (siehe Beschreibung des Schritts).
  const standortEmpty = Boolean(standortId) && standortItems.length === 0 && volk.select.items.length > 0;
  const volkSelect = useMemo(() => ({
    ...volk.select,
    items: standortEmpty ? volk.select.items : standortItems,
    onSearch: volk.select.onSearch
      ? async (q: string, signal: AbortSignal) => (await volk.select.onSearch!(q, signal)).filter(i => inStandort(volk.recordOf(i.id)))
      : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [volk.select, standortId, standortEmpty]);

  const standortName = standorte?.find(s => s.id === standortId)?.title;
  const artOptions = optionsOf('stockarbeiten', 'art');
  const artValue = Array.isArray(f.get('art')) ? (f.get('art') as string[]) : [];
  const toggleArt = (key: string) => {
    const next = artValue.includes(key) ? artValue.filter(k => k !== key) : [...artValue, key];
    (f.set as unknown as (k: string, v: unknown) => void)('art', next);
  };

  return (
    <IntentWizardShell
      title={tx('Stockarbeit erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Durchsicht, Behandlung oder Fütterung an einem Volk festhalten.'),
        needs: [tx('Standort und Volk'), tx('Deine Beobachtungen am Stock')],
      }}
    >
      <WizardStep label={tx('Standort')} description={tx('Wähle den Standort, um die Völker einzugrenzen.')}>
        <div className="space-y-4">
          {standortError && <p className="text-sm text-destructive">{standortError}</p>}
          {!standorte && !standortError && <p className="text-sm text-muted-foreground">{tx('Standorte werden geladen …')}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(standorte ?? []).map(s => (
              <button
                key={s.id}
                type="button"
                aria-pressed={standortId === s.id}
                onClick={() => { setStandortId(s.id); setStep(2); }}
                className={cn(
                  'min-w-0 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-secondary',
                  standortId === s.id && 'border-primary bg-primary/10',
                )}
              >
                <div className="truncate font-medium">{s.title}</div>
                {s.subtitle && <div className="truncate text-sm text-muted-foreground">{s.subtitle}</div>}
              </button>
            ))}
          </div>
          <StepNav
            hideBack
            onNext={() => { setStandortId(null); }}
            nextLabel={tx('Alle Standorte anzeigen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Volk')}
        description={standortEmpty ? tx('Am gewählten Standort ist kein Volk eingetragen — alle Völker werden gezeigt.') : standortName ? tx`Völker am Standort ${standortName}` : tx('Wähle das Bienenvolk, an dem du gearbeitet hast.')}
      >
        <EntitySelectStep
          {...volkSelect}
          {...flow.pick('volk')}
          searchPlaceholder={tx('Volksname suchen …')}
        />
        <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Arbeit')} />
      </WizardStep>

      <WizardStep label={tx('Arbeit')} description={tx('Was hast du gemacht und wie sah das Volk aus?')} needs={['volk']}>
        <div className="space-y-4">
          <Field form={f} name="art">
            <div id={f.fieldId('art')} className="flex flex-wrap gap-2">
              {artOptions.map(o => {
                const on = artValue.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleArt(o.key)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary',
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Bound form={f} name="volksstaerke" allowClear />
          <Bound form={f} name="sanftmut" allowClear />
          <Bound form={f} name="brutbild" allowClear />
          <Bound form={f} name="weiselrichtig" />
          <Bound form={f} name="varroabefall" />
          <Bound form={f} name="bemerkungen" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Mittel & Menge')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Mittel')} description={tx('Optional: Medikament oder Futter und die Menge angeben.')}>
        <div className="space-y-4">
          <Bound form={f} name="mittel" />
          <Bound form={f} name="menge" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Stockarbeit wird mit dem aktuellen Datum und der Uhrzeit gespeichert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Weitere Stockarbeit erfassen'), onClick: () => { flow.reset(); setStandortId(null); setStep(1); } },
            { label: tx('Honigernte erfassen'), href: '#/intents/honigernte-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
