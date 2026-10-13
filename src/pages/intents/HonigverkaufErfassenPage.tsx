/**
 * Honigverkauf erfassen — 5-Schritt-Wizard.
 * Steps: 1) Honigernte wählen → 2) Käufer eintragen → 3) Gebinde, Anzahl, Preis → 4) Bezahlt-Status → 5) Prüfen & speichern.
 * Reads: honigernten. Writes: honigverkaeufe (via useHonigverkaufErfassenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldDate, fieldNumber } from '@/lib/journey';
import { useHonigverkaufErfassenFlow } from '@/lib/journey/flows/HonigverkaufErfassen';
import { tx } from '@/i18n';

export default function HonigverkaufErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useHonigverkaufErfassenFlow({
    steps: {
      ernte: 1,
      kaeufer_vorname: 2, kaeufer_nachname: 2,
      gebindegroesse: 3, anzahl: 3, preis_gesamt: 3,
      bezahlt: 4, bemerkungen: 4,
    },
    items: {
      ernte: (r, ctx) => {
        const datum = fieldDate(r, 'erntedatum');
        const menge = fieldNumber(r, 'menge_kg');
        const sorte = fieldLookup(r, 'honigsorte');
        const charge = fieldText(r, 'charge');
        return {
          id: r.id,
          title: charge || sorte?.label || tx('Honigernte'),
          subtitle: [sorte?.label, datum ? format(parseISO(datum), 'dd.MM.yyyy') : '', menge != null ? `${menge} kg` : '', ctx.ref('volk')]
            .filter(Boolean).join(' · '),
        };
      },
    },
  });
  const f = flow.forms.honigverkaeufe;

  return (
    <IntentWizardShell
      title={tx('Honigverkauf erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Verkauf einer Honigernte an einen Käufer festhalten.'),
        needs: [tx('Die verkaufte Ernte'), tx('Name des Käufers'), tx('Gebinde, Anzahl und Preis')],
      }}
    >
      <WizardStep label={tx('Honigernte')} description={tx('Aus welcher Ernte stammt der verkaufte Honig?')}>
        <EntitySelectStep
          {...flow.picks.ernte.select}
          {...flow.pick('ernte')}
          searchPlaceholder={tx('Charge suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Käufer')} description={tx('Wer hat den Honig gekauft?')} needs={['ernte']}>
        <div className="space-y-4">
          <Bound form={f} name="kaeufer_vorname" />
          <Bound form={f} name="kaeufer_nachname" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Gebinde & Preis')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Gebinde & Preis')} description={tx('Gebindegröße, Anzahl und Gesamtpreis angeben.')} needs={['ernte']}>
        <div className="space-y-4">
          <Bound form={f} name="gebindegroesse" />
          <Bound form={f} name="anzahl" />
          <Bound form={f} name="preis_gesamt" hint={tx('In Euro, z. B. 24,50')} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Bezahlt-Status')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Bezahlt')} description={tx('Ist der Verkauf schon bezahlt?')} needs={['ernte']}>
        <div className="space-y-4">
          <Bound form={f} name="bezahlt" />
          <Bound form={f} name="bemerkungen" rows={3} />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der Verkauf wird mit dem heutigen Datum gespeichert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          restartLabel={tx('Weiteren Verkauf erfassen')}
          next={[{ label: tx('Zum Dashboard'), href: '#/' }]}
        />
      )}
    </IntentWizardShell>
  );
}
