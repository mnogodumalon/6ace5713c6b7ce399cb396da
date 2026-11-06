/**
 * Honig verkaufen — 4-Schritt-Wizard.
 * Steps: 1) Ernte wählen → 2) Verkauf (Datum, Gebinde, Anzahl, Menge, Preis) → 3) Käufer → 4) Prüfen & anlegen.
 * Reads: honigernten (useRecordSearch, Volk-Name via ctx.ref). Writes: honigverkaeufe (ernte verknüpft).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldDate, todayIso } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { dateFnsLocale, tx } from '@/i18n';

const KG_PRO_GEBINDE: Record<string, number> = { glas_250: 0.25, glas_500: 0.5, glas_1000: 1 };

export default function HonigVerkaufenPage() {
  const [step, setStep] = useState(1);

  const ernten = useRecordSearch(servicePort, 'honigernten', {
    searchFields: ['charge'],
    toItem: (e, ctx) => {
      const datum = fieldDate(e, 'erntedatum');
      const volk = ctx.ref('volk');
      return {
        id: e.id,
        title: fieldText(e, 'charge') || tx('Ernte ohne Charge'),
        subtitle: [
          datum ? format(parseISO(datum), 'dd.MM.yyyy', { locale: dateFnsLocale() }) : '',
          volk ?? '',
        ].filter(Boolean).join(' · '),
      };
    },
  });

  const f = useStepForm('honigverkaeufe', {
    steps: {
      ernte: 1,
      verkaufsdatum: 2, gebindegroesse: 2, anzahl: 2, menge_kg: 2, preis_gesamt: 2, bezahlt: 2,
      kaeufer_vorname: 3, kaeufer_nachname: 3, bemerkungen: 3,
    },
    initial: { verkaufsdatum: todayIso() },
  });

  const submit = useJourneySubmit(servicePort, [
    { key: 'verkauf', entity: 'honigverkaeufe', form: f, primary: true },
  ], { draftKey: 'honig-verkaufen' });

  // Menge aus Gebinde × Anzahl vorschlagen — bleibt editierbar (prefill überschreibt nie Eingaben)
  const gebinde = f.get('gebindegroesse') as string | null | undefined;
  const anzahl = Number(f.get('anzahl'));
  useEffect(() => {
    const kg = gebinde ? KG_PRO_GEBINDE[gebinde] : undefined;
    if (kg && Number.isFinite(anzahl) && anzahl > 0) {
      f.prefill('menge_kg', String(Math.round(anzahl * kg * 1000) / 1000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gebinde, anzahl]);

  return (
    <IntentWizardShell
      title={tx('Honig verkaufen')}
      currentStep={step} onStepChange={setStep}
      forms={[f]} draftKey="honig-verkaufen"
      intro={{ description: tx('Einen Honigverkauf aus einer Ernte erfassen.'), needs: [tx('Chargennummer der Ernte'), tx('Anzahl und Preis')] }}
    >
      <WizardStep label={tx('Ernte')} description={tx('Aus welcher Ernte stammt der verkaufte Honig?')}>
        <EntitySelectStep {...ernten.select}
          selectedId={f.get('ernte') as string | null}
          searchPlaceholder={tx('Charge suchen …')}
          emptyText={tx('Noch keine Ernte erfasst — lege sie zuerst im Ablauf „Honig ernten“ an.')}
          onSelect={id => f.set('ernte', id, ernten.labelOf(id))}
        />
      </WizardStep>

      <WizardStep label={tx('Verkauf')} description={tx('Was wurde wann zu welchem Preis verkauft?') } needs={['ernte']}>
        <div className="space-y-4">
          <Bound form={f} name="verkaufsdatum" />
          <Bound form={f} name="gebindegroesse" allowClear />
          <Bound form={f} name="anzahl" />
          <Bound form={f} name="menge_kg" hint={tx('Wird aus Gebinde und Anzahl vorgeschlagen — du kannst ihn ändern.')} />
          <Bound form={f} name="preis_gesamt" hint={tx('In Euro')} />
          <Bound form={f} name="bezahlt" />
          <StepNav onBack={() => setStep(1)} onNext={() => f.validate(['verkaufsdatum', 'anzahl', 'preis_gesamt'])} nextStepLabel={tx('Käufer')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Käufer')} description={tx('Wer hat den Honig gekauft? Alle Angaben sind freiwillig.')}>
        <div className="space-y-4">
          <Bound form={f} name="kaeufer_vorname" />
          <Bound form={f} name="kaeufer_nachname" />
          <Bound form={f} name="bemerkungen" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => f.validate(['kaeufer_vorname', 'kaeufer_nachname', 'bemerkungen'])} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep forms={[f]} submit={submit}
            whatHappensNext={tx('Der Verkauf wird mit der gewählten Ernte verknüpft gespeichert.')} />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep result={submit.result} submit={submit} forms={[f]}
          next={[
            { label: tx('Honig ernten'), href: '#/intents/honig-ernten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Weitere Verkäufe erfasst du mit „Noch einmal“.')} />
      )}
    </IntentWizardShell>
  );
}
