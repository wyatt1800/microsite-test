import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';

type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';
type Bracket = [number, number];

const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 14600,
  mfj: 29200,
  mfs: 14600,
  hoh: 21900,
};

const TAX_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    [11600, 0.10], [47150, 0.12], [100525, 0.22],
    [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37],
  ],
  mfj: [
    [23200, 0.10], [94300, 0.12], [201050, 0.22],
    [383900, 0.24], [487450, 0.32], [731200, 0.35], [Infinity, 0.37],
  ],
  mfs: [
    [11600, 0.10], [47150, 0.12], [100525, 0.22],
    [191950, 0.24], [243725, 0.32], [365600, 0.35], [Infinity, 0.37],
  ],
  hoh: [
    [16550, 0.10], [63100, 0.12], [100500, 0.22],
    [191950, 0.24], [243700, 0.32], [609350, 0.35], [Infinity, 0.37],
  ],
};

const SS_WAGE_BASE = 168600;

function calcFederalIncomeTax(taxableIncome: number, brackets: Bracket[]): number {
  let tax = 0;
  let lowerBound = 0;
  for (const [upperBound, rate] of brackets) {
    if (taxableIncome <= lowerBound) break;
    const effectiveUpper = upperBound === Infinity ? taxableIncome : upperBound;
    const slice = Math.min(taxableIncome, effectiveUpper) - lowerBound;
    tax += slice * rate;
    lowerBound = upperBound;
  }
  return tax;
}

function calcSETax(grossSEIncome: number): number {
  const netSE = grossSEIncome * 0.9235;
  const ssTax = Math.min(netSE, SS_WAGE_BASE) * 0.124;
  const medTax = netSE * 0.029;
  return ssTax + medTax;
}

function estimateTax(seIncome: number, w2Income: number, status: FilingStatus) {
  const seTax = calcSETax(seIncome);
  const seDeduction = seTax * 0.5;
  const agi = seIncome + w2Income - seDeduction;
  const taxableIncome = Math.max(0, agi - STANDARD_DEDUCTIONS[status]);
  const federalTax = calcFederalIncomeTax(taxableIncome, TAX_BRACKETS[status]);
  const totalTax = seTax + federalTax;
  const totalIncome = seIncome + w2Income;
  return {
    seTax,
    federalTax,
    totalTax,
    quarterlyPayment: totalTax / 4,
    effectiveRate: totalIncome > 0 ? totalTax / totalIncome : 0,
  };
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const BASE_FONT: CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" };

const INPUT_STYLE: CSSProperties = {
  ...BASE_FONT,
  width: '100%',
  padding: '10px 12px 10px 28px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};

const LABEL_STYLE: CSSProperties = {
  ...BASE_FONT,
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

export default function TaxCalculator() {
  const [incomeRaw, setIncomeRaw] = useState('75000');
  const [w2Raw, setW2Raw] = useState('');
  const [status, setStatus] = useState<FilingStatus>('single');

  const seIncome = Math.max(0, parseFloat(incomeRaw) || 0);
  const w2Income = Math.max(0, parseFloat(w2Raw) || 0);
  const hasIncome = seIncome > 0 || w2Income > 0;

  const result = useMemo(
    () => estimateTax(seIncome, w2Income, status),
    [seIncome, w2Income, status],
  );

  return (
    <div style={BASE_FONT}>
      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        }}
      >
        {/* Inputs */}
        <div className="border-b sm:border-b-0 sm:border-r border-slate-200" style={{ padding: 32 }}>
          <p style={{ ...BASE_FONT, fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
            Your income
          </p>
          <p style={{ ...BASE_FONT, fontSize: 13, color: '#64748b', margin: '0 0 28px', lineHeight: 1.5 }}>
            Enter your expected earnings for this year.
          </p>

          <div style={{ marginBottom: 20 }}>
            <span style={LABEL_STYLE}>Freelance / 1099 income</span>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }}>
                $
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="75000"
                value={incomeRaw}
                onChange={e => setIncomeRaw(e.target.value)}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={LABEL_STYLE}>
              W-2 / salary income{' '}
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </span>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }}>
                $
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={w2Raw}
                onChange={e => setW2Raw(e.target.value)}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div>
            <span style={LABEL_STYLE}>Filing status</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as FilingStatus)}
              style={{
                ...BASE_FONT,
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                color: '#0f172a',
                outline: 'none',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="single">Single</option>
              <option value="mfj">Married filing jointly</option>
              <option value="mfs">Married filing separately</option>
              <option value="hoh">Head of household</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: 32, backgroundColor: '#f8fafc' }}>
          <p style={{ ...BASE_FONT, fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
            Your estimate
          </p>
          <p style={{ ...BASE_FONT, fontSize: 13, color: '#64748b', margin: '0 0 28px', lineHeight: 1.5 }}>
            Based on 2024 federal tax rates.
          </p>

          {!hasIncome ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 14,
              border: '1.5px dashed #e2e8f0',
              borderRadius: 12,
              ...BASE_FONT,
            }}>
              Enter your income on the left to see an estimate
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 10, padding: '14px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ ...BASE_FONT, fontSize: 13, color: '#475569' }}>Self-employment tax</span>
                  <span style={{ ...BASE_FONT, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{usd(result.seTax)}</span>
                </div>
                <div style={{ ...BASE_FONT, fontSize: 11, color: '#94a3b8' }}>Social Security + Medicare (15.3%)</div>
              </div>

              <div style={{ marginBottom: 10, padding: '14px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ ...BASE_FONT, fontSize: 13, color: '#475569' }}>Federal income tax</span>
                  <span style={{ ...BASE_FONT, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{usd(result.federalTax)}</span>
                </div>
                <div style={{ ...BASE_FONT, fontSize: 11, color: '#94a3b8' }}>After standard deduction & SE deduction</div>
              </div>

              <div style={{ marginBottom: 10, padding: '16px', background: '#0f172a', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ ...BASE_FONT, fontSize: 13, color: 'rgba(203,213,225,0.9)', fontWeight: 500 }}>Total estimated tax</span>
                  <span style={{ ...BASE_FONT, fontSize: 18, fontWeight: 700, color: '#fff' }}>{usd(result.totalTax)}</span>
                </div>
                <div style={{ ...BASE_FONT, fontSize: 11, color: 'rgba(203,213,225,0.45)' }}>Effective rate: {pct(result.effectiveRate)}</div>
              </div>

              <div style={{ padding: '14px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ ...BASE_FONT, fontSize: 13, color: '#1d4ed8', fontWeight: 500 }}>Quarterly payment</span>
                  <span style={{ ...BASE_FONT, fontSize: 16, fontWeight: 700, color: '#1d4ed8' }}>{usd(result.quarterlyPayment)}</span>
                </div>
                <div style={{ ...BASE_FONT, fontSize: 11, color: '#3b82f6' }}>Set aside this amount every 3 months</div>
              </div>
            </>
          )}
        </div>
      </div>

      <p style={{ ...BASE_FONT, fontSize: 11, color: '#94a3b8', marginTop: 12, lineHeight: 1.6 }}>
        Estimate only. Based on 2024 federal tax rates, standard deduction, and self-employment tax rules. Does not include state taxes, deductions, credits, or the 0.9% Medicare surtax on high earners. Not tax advice — consult a professional for your specific situation.
      </p>
    </div>
  );
}
