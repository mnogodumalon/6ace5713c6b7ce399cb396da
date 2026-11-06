/**
 * Stockarbeit erfassen — 4-Schritt-Wizard.
 * Steps: 1) Volk wählen → 2) Arbeit (Datum, Art, Mittel/Menge) → 3) Beobachtungen → 4) Prüfen & anlegen.
 * Reads: bienenvoelker (aktiv|ableger). Writes: stockarbeiten (createStockarbeitenEntry via servicePort).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, ChoiceGroup, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import {
  useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldLookup, nowIso, optionsOf,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

const DRAFT_KEY = 'stockarbeit-erfassen';

export default function StockarbeitErfassenPage() {
  const [step, setStep] = useState(1);

  const voelker = useRecordSearch(servicePort, 'bienenvoelker', {
    filter: "r.v_status in ['aktiv', 'ableger']",
    where: r => ['aktiv', 'ableger'].includes(fieldLookup(r, 'status')?.key ?? ''),
    searchFields: ['volksname'],
    toItem: v => {
      const status = fieldLookup(v, 'status');
      return {
        id: v.id,
        title: fieldText(v, 'volksname'),
        status: status ?? undefined,
      };
    },
  });

  const f = useStepForm('stockarbeiten', {
    fields: [
      'volk', 'datum', 'art', 'mittel', 'menge',
      'volksstaerke', 'sanftmut', 'brutbild', 'weiselrichtig', 'varroabefall', 'bemerkungen',
    ],
    steps: {
      volk: 1, datum: 2, art: 2, mittel: 2, menge: 2,
      volksstaerke: 3, sanftmut: 3, brutbild: 3, weiselrichtig: 3, varroabefall: 3, bemerkungen: 3,
    },
    initial: { datum: nowIso() },
  });

  const submit = useJourneySubmit(servicePort, [
    { key: 'arbeit', entity: 'stockarbeiten', form: f, primary: true },
  ], { draftKey: DRAFT_KEY });

  const arten = (Array.isArray(f.get('art')) ? (f.get('art') as string[]) : []);
  const needsMittel = arten.includes('behandlung') || arten.includes('fuetterung');
  const artOptions = optionsOf('stockarbeiten', 'art');

  const toggleArt = (key: string) => {
    const next = arten.includes(key) ? arten.filter(k => k !== key) : [...arten, key];
    f.set('art', next);
    if (!next.includes('behandlung') && !next.includes('fuetterung')) {
      f.set('mittel', '');
      f.set('menge', '');
    }
  };

  const validateArbeit = () => f.validate(['datum', 'art']);

  return (
    <IntentWizardShell
      title={tx('Stockarbeit erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[f]}
      draftKey={DRAFT_KEY}
      intro={{
        description: tx('Halte fest, was du am Bienenvolk gemacht und beobachtet hast.'),
        needs: [tx('Name des Volks'), tx('Deine Beobachtungen am Stock')],
      }}
    >
      <WizardStep label={tx('Volk')} description={tx('An welchem Volk hast du gearbeitet?')}>
        <EntitySelectStep
          {...voelker.select}
          selectedId={f.get('volk') as string | undefined}
          searchPlaceholder={tx('Volksname suchen …')}
          emptyText={tx('Es gibt kein aktives Volk oder keinen Ableger. Lege hier ein neues Volk an.')}
          onSelect={id => { f.set('volk', id, voelker.labelOf(id)); setStep(2); }}
        />
      </WizardStep>

      <WizardStep label={tx('Arbeit')} description={tx('Wann und was hast du gemacht?')} needs={['volk']}>
        <div className="space-y-4">
          <Bound form={f} name="datum" />
          <Field form={f} name="art">
            <div id={f.fieldId('art')} className="flex flex-wrap gap-2" role="group">
              {artOptions.map(o => {
                const on = arten.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleArt(o.key)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </Field>
          {needsMittel && (
            <>
              <Bound form={f} name="mittel" placeholder={tx('z. B. Ameisensäure oder Zuckerlösung')} />
              <Bound form={f} name="menge" placeholder={tx('z. B. 2 Liter')} />
            </>
          )}
          <StepNav onBack={() => setStep(1)} onNext={validateArbeit} nextStepLabel={tx('Beobachtungen')} />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Beobachtungen')}
        description={tx('Alles optional — trage ein, was dir aufgefallen ist.')}
        needs={['datum', 'art']}
      >
        <div className="space-y-4">
          <Field form={f} name="volksstaerke">
            <ChoiceGroup {...f.choice('volksstaerke')} allowClear />
          </Field>
          <Field form={f} name="sanftmut">
            <ChoiceGroup {...f.choice('sanftmut')} allowClear />
          </Field>
          <Field form={f} name="brutbild">
            <ChoiceGroup {...f.choice('brutbild')} allowClear />
          </Field>
          <Bound form={f} name="weiselrichtig" />
          <Bound form={f} name="varroabefall" />
          <Bound form={f} name="bemerkungen" rows={3} />
          <StepNav onBack={() => setStep(2)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[f]}
            submit={submit}
            whatHappensNext={tx('Die Stockarbeit wird beim gewählten Volk gespeichert.')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          submit={submit}
          forms={[f]}
          next={[
            { label: tx('Honig ernten'), href: '#/intents/honig-ernten' },
            { label: tx('Honig verkaufen'), href: '#/intents/honig-verkaufen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Du kannst gleich die nächste Arbeit erfassen oder Honig ernten.')}
        />
      )}
    </IntentWizardShell>
  );
}
