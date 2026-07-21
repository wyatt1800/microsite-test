export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';
type Bracket = [number, number];

export const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 14600,
  mfj: 29200,
  mfs: 14600,
  hoh: 21900,
};

export const TAX_BRACKETS: Record<FilingStatus, Bracket[]> = {
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

export function calcFederalIncomeTax(taxableIncome: number, brackets: Bracket[]): number {
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

export function calcSETax(grossSEIncome: number): number {
  const netSE = grossSEIncome * 0.9235;
  const ssTax = Math.min(netSE, SS_WAGE_BASE) * 0.124;
  const medTax = netSE * 0.029;
  return ssTax + medTax;
}

export function estimateTax(seIncome: number, w2Income: number, status: FilingStatus) {
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

// ─── Upsell savings estimates ───────────────────────────────────────────────
// Rough, directional ballparks meant to motivate a conversation with an
// advisor — not a substitute for one. A real S-corp salary/distribution
// split and deduction review depends on facts only a professional can assess.

const SCORP_REASONABLE_SALARY_RATIO = 0.6; // rule-of-thumb salary share of net income
const SCORP_ANNUAL_ADMIN_COST = 1800; // payroll + extra filing/admin overhead

export function estimateSCorpSavings(netSelfEmploymentIncome: number): number {
  if (netSelfEmploymentIncome <= 0) return 0;
  const reasonableSalary = netSelfEmploymentIncome * SCORP_REASONABLE_SALARY_RATIO;
  const seTaxAsSoleProp = calcSETax(netSelfEmploymentIncome);
  const payrollTaxOnSalary = calcSETax(reasonableSalary);
  const grossSavings = seTaxAsSoleProp - payrollTaxOnSalary;
  return Math.max(0, Math.round(grossSavings - SCORP_ANNUAL_ADMIN_COST));
}

const DEDUCTION_DISCOVERY_RATE = 0.08; // share of net income in commonly-missed deductions
const ASSUMED_MARGINAL_RATE = 0.24; // blended federal + SE marginal benefit

export function estimateDeductionSavings(netIncome: number): number {
  if (netIncome <= 0) return 0;
  return Math.round(netIncome * DEDUCTION_DISCOVERY_RATE * ASSUMED_MARGINAL_RATE);
}

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
