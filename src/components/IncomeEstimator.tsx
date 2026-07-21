import { useState } from 'react';
import { IconCurrencyDollar, IconArrowRight, IconSparkles } from '@tabler/icons-react';
import type { UpsellVariant } from '@/lib/upsellVariant';
import { estimateSCorpSavings, estimateDeductionSavings, usd } from '@/lib/taxEstimate';

interface IncomeEstimatorProps {
  variant: UpsellVariant;
  onContinue: (estimatedIncome: number) => void;
  onSkip: () => void;
}

const FONT = "'Inter', system-ui, sans-serif";
const FONT_HEADING = "'Poppins', system-ui, sans-serif";

const COPY: Record<UpsellVariant, { title: string; body: string; savingsLabel: string }> = {
  'form-entity': {
    title: 'One quick number before you go',
    body: "Roughly how much do you expect to earn this year from this work? We'll estimate what forming an LLC with an S-corp election could save you in self-employment tax.",
    savingsLabel: 'Estimated savings with an S-corp election',
  },
  'optimize-taxes': {
    title: 'One quick number before you go',
    body: "Roughly how much net income does your business bring in this year? We'll estimate what proactive tax planning could put back in your pocket.",
    savingsLabel: 'Estimated savings with proactive tax planning',
  },
};

function estimateSavings(variant: UpsellVariant, income: number): number {
  return variant === 'form-entity' ? estimateSCorpSavings(income) : estimateDeductionSavings(income);
}

export default function IncomeEstimator({ variant, onContinue, onSkip }: IncomeEstimatorProps) {
  const [incomeRaw, setIncomeRaw] = useState('');
  const copy = COPY[variant];
  const income = Math.max(0, parseFloat(incomeRaw) || 0);
  const savings = estimateSavings(variant, income);

  function handleContinue() {
    onContinue(income);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 600, fontSize: 22, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
          {copy.title}
        </h3>
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          {copy.body}
        </p>
      </div>

      <div className="flex flex-col gap-1.5" style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Estimated annual income
        </label>
        <div style={{ position: 'relative' }}>
          <IconCurrencyDollar
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
          />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1000"
            placeholder="e.g. 75000"
            autoFocus
            value={incomeRaw}
            onChange={e => setIncomeRaw(e.target.value)}
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 500,
              border: '1.5px solid var(--color-border-brand)',
              borderRadius: 8,
              padding: '10px 14px 10px 32px',
              outline: 'none',
              width: '100%',
              backgroundColor: '#fff',
              color: 'var(--color-text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {income > 0 && savings > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 18px',
            background: 'linear-gradient(145deg, var(--color-navy) 0%, #071b30 100%)',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconSparkles size={16} color="#fff" />
          </span>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: 'rgba(200,213,232,0.85)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {copy.savingsLabel}
            </p>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
              {usd(savings)}/year
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={income <= 0}
        style={{
          fontFamily: FONT_HEADING,
          fontWeight: 600,
          fontSize: 15,
          backgroundColor: income > 0 ? 'var(--color-teal)' : 'var(--color-slate-mid)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '13px 24px',
          cursor: income > 0 ? 'pointer' : 'not-allowed',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background-color 0.15s',
          boxShadow: income > 0 ? '0 4px 16px rgba(15,118,110,0.30)' : 'none',
        }}
      >
        {income > 0 ? 'See my full savings estimate' : 'Enter your income to continue'}
        <IconArrowRight size={16} />
      </button>

      <p style={{ textAlign: 'center', margin: '16px 0 0' }}>
        <button
          type="button"
          onClick={onSkip}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, fontSize: 12.5, textDecoration: 'underline', fontFamily: FONT, fontWeight: 500 }}
        >
          Skip this, just show me my next step
        </button>
      </p>

      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginTop: 14, lineHeight: 1.6, textAlign: 'center' }}>
        Ballpark estimate only, not tax advice. This number stays on this screen and isn't saved or sent anywhere unless you choose to continue.
      </p>
    </div>
  );
}
