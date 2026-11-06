/**
 * Honig ernten — 3-Schritt-Wizard.
 * Steps: 1) Volk wählen → 2) Ernte erfassen → 3) Prüfen & anlegen.
 * Reads: bienenvoelker (nur aktive Völker), honigernten (Zähler für den Chargenvorschlag).
 * Writes: honigernten (createHonigernten, volk verknüpft).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, SuggestionPicker, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { SuggestionPicker } from '@/components/blocks/SuggestionPicker';
import {
  useStepForm, useJourneySubmit, useRecordSearch, useRecordCount,
  fieldText, fieldLookup, fieldDate, todayIso,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

const WATER_LIMIT = 18;

export default function HonigErntenPage() {
  const [step, setStep] = useState(1);

  const voelker = useRecordSearch(servicePort, 'bienenvoelker', {
    filter: "r.v_status == 'aktiv'",
    where: r => fieldLookup(r, 'status')?.key === 'aktiv',
    searchFields: ['volksname'],
    toItem: v => ({
      id: v.id,
      title: fieldText(v, 'volksname'),
      status: fieldLookup(v, 'status') ?? undefined,
      subtitle: fieldLookup(v, 'rasse')?.label,
    }),
  });

  const ernte = useStepForm('honigernten', {
    fields: ['volk', 'erntedatum', 'honigsorte', 'menge_kg', 'wassergehalt', 'anzahl_glaeser', 'charge', 'bemerkungen'],
    steps: { volk: 1, erntedatum: 2, honigsorte: 2, menge_kg: 2, wassergehalt: 2, anzahl_glaeser: 2, charge: 2, bemerkungen: 2 },
    initial: { erntedatum: todayIso() },
  });

  const volkId = ernte.get('volk') as string | undefined;
  const datum = ernte.get('erntedatum') as string | undefined;

  const gleicherTag = useRecordCount(servicePort, 'honigernten', {
    filter: datum ? `r.v_erntedatum == @(${datum})` : undefined,
    where: r => fieldDate(r, 'erntedatum') === datum,
    enabled: Boolean(datum),
  });

  const submit = useJourneySubmit(servicePort, [
    { key: 'ernte', entity: 'honigernten', form: ernte, primary: true },
  ], { draftKey: 'honig-ernten' });

  const wasser = Number(String(ernte.get('wassergehalt') ?? '').replace(',', '.'));
  const zuNass = ernte.get('wassergehalt') !== undefined && ernte.get('wassergehalt') !== '' && wasser > WATER_LIMIT;

  const chargeVorschlaege: string[] = [];
  if (datum && volkId && gleicherTag.count !== null) {
    const volkName = (voelker.labelOf(volkId) ?? '').replace(/[^A-Za-z0-9ÄÖÜäöü]+/g, '').slice(0, 6).toUpperCase();
    const tag = datum.replace(/-/g, '');
    chargeVorschlaege.push(`H-${tag}-${volkName || 'VOLK'}-${gleicherTag.count + 1}`);
  }

  return (
    <IntentWizardShell
      title={tx('Honig ernten')}
      currentStep={step} onStepChange={setStep}
      forms={[ernte]} draftKey="honig-ernten"
      intro={{ description: tx('Eine Honigernte für ein aktives Bienenvolk erfassen.'), needs: [tx('Name des Volks'), tx('Geerntete Menge in kg')] }}
    >
      <WizardStep label={tx('Volk')} description={tx('Von welchem Volk stammt der Honig? Nur aktive Völker werden angeboten.')}>
        <EntitySelectStep {...voelker.select}
          selectedId={volkId ?? null}
          searchPlaceholder={tx('Volksname suchen …')}
          emptyText={tx('Kein aktives Volk gefunden. Nur Völker mit Status „Aktiv“ geben Honig.')}
          onSelect={id => { ernte.set('volk', id, voelker.labelOf(id)); setStep(2); }}
        />
      </WizardStep>

      <WizardStep label={tx('Ernte')} description={tx('Wann, wie viel und welche Sorte wurde geerntet?')} needs={['volk']}>
        <div className="space-y-4">
          <Bound form={ernte} name="erntedatum" />
          <Bound form={ernte} name="honigsorte" />
          <Bound form={ernte} name="menge_kg" hint={tx('Geerntete Menge in kg')} />
          <Bound form={ernte} name="wassergehalt" hint={tx('In Prozent, z. B. 17,5')} />
          {zuNass && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">
              <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{tx`Wassergehalt über ${WATER_LIMIT} %: Honig kann gären.`}</span>
            </p>
          )}
          <Bound form={ernte} name="anzahl_glaeser" />
          <Bound form={ernte} name="charge" />
          <SuggestionPicker
            suggestions={chargeVorschlaege}
            value={ernte.get('charge')}
            onPick={s => ernte.set('charge', s)}
            label={tx('Chargenvorschlag')}
            emptyText={tx('Sobald Volk und Erntedatum feststehen, gibt es hier einen Vorschlag.')}
          />
          <Bound form={ernte} name="bemerkungen" rows={3} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => ernte.validate(['erntedatum', 'honigsorte', 'menge_kg', 'wassergehalt', 'anzahl_glaeser', 'charge', 'bemerkungen'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep forms={[ernte]} submit={submit}
            whatHappensNext={tx('Die Ernte wird dem Volk zugeordnet und steht danach für den Honigverkauf bereit.')} />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep result={submit.result} submit={submit} forms={[ernte]}
          next={[
            { label: tx('Honig verkaufen'), href: '#/intents/honig-verkaufen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Im Ablauf „Honig verkaufen“ kannst du diese Ernte direkt verkaufen.')} />
      )}
    </IntentWizardShell>
  );
}
