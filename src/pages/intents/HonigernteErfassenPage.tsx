/**
 * Honigernte erfassen — 4-Schritt-Wizard.
 * Steps: 1) Bienenvolk wählen → 2) Honigsorte und Menge → 3) Wassergehalt, Gläser, Charge → 4) Prüfen & speichern.
 * Reads: bienenvoelker. Writes: honigernten (Erntedatum = heute, vom Flow gesetzt).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useHonigernteErfassenFlow } from '@/lib/journey/flows/HonigernteErfassen';
import { tx } from '@/i18n';

export default function HonigernteErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useHonigernteErfassenFlow({
    steps: { volk: 1, honigsorte: 2, menge_kg: 2, wassergehalt: 3, anzahl_glaeser: 3, charge: 3, bemerkungen: 3 },
    items: {
      volk: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'volksname'),
        subtitle: ctx.ref('standort'),
        status: fieldLookup(r, 'status') ?? undefined,
      }),
    },
  });
  const f = flow.forms.honigernten;

  return (
    <IntentWizardShell
      title={tx('Honigernte erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Halte die Ernte eines Volkes mit Sorte, Menge und Gläsern fest.'),
        needs: [tx('Volk, von dem geerntet wurde'), tx('Honigsorte und Menge in kg'), tx('Wassergehalt und Gläserzahl')],
      }}
    >
      <WizardStep label={tx('Volk')} description={tx('Von welchem Bienenvolk stammt der Honig?')}>
        <EntitySelectStep
          {...flow.picks.volk.select}
          {...flow.pick('volk')}
          searchPlaceholder={tx('Volksname suchen …')}
          avatar="none"
        />
      </WizardStep>

      <WizardStep label={tx('Sorte & Menge')} description={tx('Welche Honigsorte und wie viele Kilogramm?')} needs={['volk']}>
        <div className="space-y-4">
          <Bound form={f} name="honigsorte" />
          <Bound form={f} name="menge_kg" hint={tx('In Kilogramm, z. B. 12,5')} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Qualität & Gläser')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Qualität & Gläser')} description={tx('Wassergehalt, Gläser und Charge festhalten.')}>
        <div className="space-y-4">
          <Bound form={f} name="wassergehalt" hint={tx('In Prozent, z. B. 17,5')} />
          <Bound form={f} name="anzahl_glaeser" />
          <Bound form={f} name="charge" />
          <Bound form={f} name="bemerkungen" rows={3} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')} description={tx('Alles richtig? Dann speichern.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'erntedatum', label: tx('Erntedatum'), value: format(new Date(), 'dd.MM.yyyy') }]}
            whatHappensNext={tx('Die Ernte wird mit dem heutigen Datum beim Volk gespeichert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Jetzt kannst du den Honig aus dieser Ernte verkaufen.')}
          next={[
            { label: tx('Honigverkauf erfassen'), href: '#/intents/honigverkauf-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
