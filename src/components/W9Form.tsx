import { useState, useCallback } from 'react';
import { IconShieldCheck, IconFileDownload, IconRefresh, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { W9FormData } from '@/lib/fillW9PDF';

const TOTAL_STEPS = 6;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
];

const TAX_CLASSIFICATIONS = [
  { value: 'individual', label: 'Individual / sole proprietor', hint: 'This is the right choice for most freelancers and self-employed workers who have not set up a formal business entity.' },
  { value: 'llc-single', label: 'LLC (single-member)', hint: 'A one-person LLC that has not elected S corp or C corp treatment. By default, the IRS treats this like a sole proprietorship.' },
  { value: 'llc-multi', label: 'LLC (multi-member / partnership)', hint: 'An LLC with two or more members that is treated as a partnership for tax purposes.' },
  { value: 'llc-scorp', label: 'LLC (S corporation election)', hint: 'Your LLC has filed Form 2553 and been approved to be taxed as an S corporation.' },
  { value: 'llc-ccorp', label: 'LLC (C corporation election)', hint: 'Your LLC has filed Form 8832 and elected to be taxed as a C corporation.' },
  { value: 'ccorp', label: 'C corporation', hint: 'A traditional corporation taxed separately from its owners. Most large companies are C corps.' },
  { value: 'scorp', label: 'S corporation', hint: 'A corporation that has elected pass-through tax treatment. Common for small incorporated businesses.' },
  { value: 'partnership', label: 'Partnership', hint: 'A business owned by two or more people that reports income on Form 1065.' },
  { value: 'trust', label: 'Trust / estate', hint: 'Select this if you are submitting a W-9 on behalf of a trust or estate.' },
  { value: 'other', label: 'Other', hint: 'If none of the above apply, select Other and describe your situation on the form.' },
];

const emptyForm: W9FormData = {
  legalName: '',
  businessName: '',
  taxClassification: '',
  exemptPayeeCode: '',
  fatcaCode: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  tinType: 'ssn',
  tin: '',
};

function formatSsn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatEin(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

function maskTin(tin: string, tinType: 'ssn' | 'ein'): string {
  const digits = tin.replace(/\D/g, '');
  if (tinType === 'ssn' && digits.length === 9) {
    return `***-**-${digits.slice(5)}`;
  }
  if (tinType === 'ein' && digits.length >= 6) {
    return `**-***${digits.slice(5)}`;
  }
  return tin ? '****' : '—';
}

interface StepProps {
  data: W9FormData;
  onChange: (field: keyof W9FormData, value: string) => void;
  errors: Partial<Record<keyof W9FormData, string>>;
}

const FONT = "'Inter', system-ui, sans-serif";
const FONT_HEADING = "'Poppins', system-ui, sans-serif";

function FieldWrapper({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'var(--color-error)', lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  border: '1.5px solid var(--color-border-brand)',
  borderRadius: 8,
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  backgroundColor: '#fff',
  color: 'var(--color-text-primary)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function TextInput({ value, onChange, placeholder, onFocus, onBlur, style }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => { setFocused(true); onFocus?.(); }}
      onBlur={() => { setFocused(false); onBlur?.(); }}
      style={{
        ...inputStyle,
        ...style,
        borderColor: focused ? 'var(--color-blue)' : 'var(--color-border-brand)',
        boxShadow: focused ? '0 0 0 3px rgba(21,84,209,0.10)' : 'none',
      }}
    />
  );
}

function Step1({ data, onChange, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <FieldWrapper
        label="Your full legal name"
        hint="Enter your name exactly as it appears on your tax return. For most freelancers, that's your first and last name."
        error={errors.legalName}
      >
        <TextInput
          value={data.legalName}
          onChange={v => onChange('legalName', v)}
          placeholder="e.g. Jane Smith"
        />
      </FieldWrapper>
      <FieldWrapper
        label="Business name / DBA (optional)"
        hint="Only fill this in if you do business under a different name than your own. Leave blank if not applicable."
      >
        <TextInput
          value={data.businessName}
          onChange={v => onChange('businessName', v)}
          placeholder="e.g. Bright Studio LLC"
        />
      </FieldWrapper>
    </div>
  );
}

function Step2({ data, onChange, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      {errors.taxClassification && (
        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'var(--color-error)' }}>
          {errors.taxClassification}
        </p>
      )}
      {TAX_CLASSIFICATIONS.map(cls => (
        <label
          key={cls.value}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 16px',
            border: `1.5px solid ${data.taxClassification === cls.value ? 'var(--color-blue)' : 'var(--color-border-brand)'}`,
            borderRadius: 8,
            cursor: 'pointer',
            backgroundColor: data.taxClassification === cls.value ? 'var(--color-blue-light)' : '#fff',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          <input
            type="radio"
            name="taxClassification"
            value={cls.value}
            checked={data.taxClassification === cls.value}
            onChange={() => onChange('taxClassification', cls.value)}
            style={{ marginTop: 3, accentColor: 'var(--color-blue)', flexShrink: 0 }}
          />
          <div>
            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              {cls.label}
            </p>
            {data.taxClassification === cls.value && (
              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {cls.hint}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

function Step3({ data, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        style={{
          backgroundColor: 'var(--color-blue-light)',
          border: '1px solid var(--color-blue-mid)',
          borderRadius: 8,
          padding: '12px 16px',
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}
      >
        Most individuals and small businesses leave both of these fields blank. Only fill them in if a tax professional has told you to.
      </div>
      <FieldWrapper
        label="Exempt payee code (optional)"
        hint="Typically blank. Certain entities listed in IRS W-9 instructions qualify."
      >
        <TextInput
          value={data.exemptPayeeCode}
          onChange={v => onChange('exemptPayeeCode', v)}
          placeholder="Leave blank if unsure"
        />
      </FieldWrapper>
      <FieldWrapper
        label="Exemption from FATCA reporting code (optional)"
        hint="Typically blank. Applies to payments by foreign financial institutions."
      >
        <TextInput
          value={data.fatcaCode}
          onChange={v => onChange('fatcaCode', v)}
          placeholder="Leave blank if unsure"
        />
      </FieldWrapper>
    </div>
  );
}

function Step4({ data, onChange, errors }: StepProps) {
  const [focused, setFocused] = useState<string | null>(null);

  function stateInputStyle(field: string): React.CSSProperties {
    return {
      ...inputStyle,
      borderColor: focused === field ? 'var(--color-blue)' : 'var(--color-border-brand)',
      boxShadow: focused === field ? '0 0 0 3px rgba(21,84,209,0.10)' : 'none',
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldWrapper label="Street address" hint="Include apartment or suite number if applicable." error={errors.streetAddress}>
        <TextInput value={data.streetAddress} onChange={v => onChange('streetAddress', v)} placeholder="e.g. 123 Main St, Apt 4B" />
      </FieldWrapper>
      <FieldWrapper label="City" error={errors.city}>
        <TextInput value={data.city} onChange={v => onChange('city', v)} placeholder="e.g. Austin" />
      </FieldWrapper>
      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="State" error={errors.state}>
          <select
            value={data.state}
            onChange={e => onChange('state', e.target.value)}
            onFocus={() => setFocused('state')}
            onBlur={() => setFocused(null)}
            style={stateInputStyle('state')}
          >
            <option value="">Select state</option>
            {US_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FieldWrapper>
        <FieldWrapper label="ZIP code" error={errors.zip}>
          <TextInput
            value={data.zip}
            onChange={v => onChange('zip', v.replace(/\D/g, '').slice(0, 10))}
            placeholder="e.g. 78701"
          />
        </FieldWrapper>
      </div>
    </div>
  );
}

function Step5({ data, onChange, errors }: StepProps) {
  const [focused, setFocused] = useState(false);

  function handleTinChange(raw: string) {
    const formatted = data.tinType === 'ssn' ? formatSsn(raw) : formatEin(raw);
    onChange('tin', formatted);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        {(['ssn', 'ein'] as const).map(type => (
          <label
            key={type}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              border: `1.5px solid ${data.tinType === type ? 'var(--color-blue)' : 'var(--color-border-brand)'}`,
              borderRadius: 8,
              cursor: 'pointer',
              backgroundColor: data.tinType === type ? 'var(--color-blue-light)' : '#fff',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            <input
              type="radio"
              name="tinType"
              value={type}
              checked={data.tinType === type}
              onChange={() => { onChange('tinType', type); onChange('tin', ''); }}
              style={{ accentColor: 'var(--color-blue)' }}
            />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {type === 'ssn' ? 'Social Security Number (SSN)' : 'Employer Identification Number (EIN)'}
            </span>
          </label>
        ))}
      </div>

      <FieldWrapper
        label={data.tinType === 'ssn' ? 'Social Security Number' : 'Employer Identification Number'}
        hint="Your SSN/EIN is used only to generate your PDF and is never sent to our servers."
        error={errors.tin}
      >
        <input
          type="text"
          inputMode="numeric"
          value={data.tin}
          onChange={e => handleTinChange(e.target.value)}
          placeholder={data.tinType === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputStyle,
            letterSpacing: '0.08em',
            borderColor: focused ? 'var(--color-blue)' : errors.tin ? 'var(--color-error)' : 'var(--color-border-brand)',
            boxShadow: focused ? '0 0 0 3px rgba(21,84,209,0.10)' : 'none',
          }}
        />
      </FieldWrapper>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 16px',
          backgroundColor: 'var(--color-teal-light)',
          border: '1px solid #99f6e4',
          borderRadius: 8,
        }}
      >
        <IconShieldCheck size={16} color="var(--color-teal)" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Your taxpayer ID stays in your browser and is used only to fill your PDF. It is never transmitted to any server.
        </p>
      </div>
    </div>
  );
}

interface ReviewRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function ReviewRow({ label, value, onEdit }: ReviewRowProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border-brand)' }}>
      <div>
        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{value || '—'}</p>
      </div>
      <button
        onClick={onEdit}
        style={{
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-blue)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: 8,
        }}
        className="hover:bg-blue-50 transition-colors"
      >
        Edit
      </button>
    </div>
  );
}

function Step6({ data, onGoToStep, onDownload, isGenerating }: {
  data: W9FormData;
  onGoToStep: (step: number) => void;
  onDownload: () => void;
  isGenerating: boolean;
}) {
  const classLabel = TAX_CLASSIFICATIONS.find(c => c.value === data.taxClassification)?.label ?? data.taxClassification;
  const address = [data.streetAddress, data.city, data.state, data.zip].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col gap-4">
      <ReviewRow label="Legal name" value={data.legalName} onEdit={() => onGoToStep(1)} />
      <ReviewRow label="Business name / DBA" value={data.businessName || '(none)'} onEdit={() => onGoToStep(1)} />
      <ReviewRow label="Tax classification" value={classLabel} onEdit={() => onGoToStep(2)} />
      <ReviewRow label="Address" value={address} onEdit={() => onGoToStep(4)} />
      <ReviewRow
        label={data.tinType === 'ssn' ? 'Social Security Number' : 'Employer Identification Number'}
        value={maskTin(data.tin, data.tinType)}
        onEdit={() => onGoToStep(5)}
      />
      {(data.exemptPayeeCode || data.fatcaCode) && (
        <ReviewRow
          label="Exemptions"
          value={[data.exemptPayeeCode && `Payee code: ${data.exemptPayeeCode}`, data.fatcaCode && `FATCA: ${data.fatcaCode}`].filter(Boolean).join(' · ')}
          onEdit={() => onGoToStep(3)}
        />
      )}

      <div className="mt-2 flex flex-col gap-3">
        <div
          style={{
            backgroundColor: 'var(--color-blue-light)',
            border: '1px solid var(--color-blue-mid)',
            borderRadius: 8,
            padding: '12px 16px',
          }}
        >
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
            Electronic signature certification
          </p>
          <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
            By clicking Download, you certify under penalties of perjury that the information above is accurate and complete. Your full legal name —{' '}
            <strong>{data.legalName}</strong> — will be entered as your typed signature on the W-9.
          </p>
        </div>

        <button
          onClick={onDownload}
          disabled={isGenerating}
          style={{
            fontFamily: FONT_HEADING,
            fontWeight: 600,
            fontSize: 15,
            backgroundColor: isGenerating ? '#7DD3C8' : 'var(--color-teal)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '14px 24px',
            cursor: isGenerating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background-color 0.15s',
            width: '100%',
            boxShadow: isGenerating ? 'none' : '0 4px 16px rgba(15,118,110,0.30)',
          }}
        >
          {isGenerating ? (
            <>
              <IconRefresh size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Generating PDF...
            </>
          ) : (
            <>
              <IconFileDownload size={16} />
              Download your W-9 PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function validateStep(step: number, data: W9FormData): Partial<Record<keyof W9FormData, string>> {
  const errors: Partial<Record<keyof W9FormData, string>> = {};
  if (step === 1 && !data.legalName.trim()) {
    errors.legalName = 'Please enter your full legal name.';
  }
  if (step === 2 && !data.taxClassification) {
    errors.taxClassification = 'Please select a tax classification.';
  }
  if (step === 4) {
    if (!data.streetAddress.trim()) errors.streetAddress = 'Street address is required.';
    if (!data.city.trim()) errors.city = 'City is required.';
    if (!data.state) errors.state = 'State is required.';
    if (!data.zip.trim()) errors.zip = 'ZIP code is required.';
  }
  if (step === 5) {
    const digits = data.tin.replace(/\D/g, '');
    if (digits.length !== 9) {
      errors.tin = data.tinType === 'ssn'
        ? 'Please enter a valid 9-digit SSN (XXX-XX-XXXX).'
        : 'Please enter a valid 9-digit EIN (XX-XXXXXXX).';
    }
  }
  return errors;
}

const STEP_TITLES = [
  'Name & business',
  'Tax classification',
  'Exemptions',
  'Address',
  'Taxpayer ID',
  'Review & download',
];

interface W9FormProps {
  onPdfReady: (data: W9FormData) => void;
}

export default function W9Form({ onPdfReady }: W9FormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<W9FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof W9FormData, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const updateField = useCallback((field: keyof W9FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  function goNext() {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
  }

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const { fillW9PDF, downloadPDF } = await import('@/lib/fillW9PDF');
      const pdfBytes = await fillW9PDF(formData);
      const safeName = formData.legalName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadPDF(pdfBytes, `w9_${safeName}.pdf`);
      onPdfReady(formData);
    } finally {
      setIsGenerating(false);
    }
  }

  const stepProps: StepProps = { data: formData, onChange: updateField, errors };

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Progress bar */}
      <div className="mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
            {STEP_TITLES[step - 1]}
          </span>
        </div>
        <div style={{ height: 6, backgroundColor: 'var(--color-border-brand)', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / TOTAL_STEPS) * 100}%`,
              backgroundColor: 'var(--color-blue)',
              borderRadius: 9999,
              transition: 'width 0.35s ease',
            }}
          />
        </div>
      </div>

      {/* Step content */}
      <div style={{ minHeight: 320 }}>
        {step === 1 && <Step1 {...stepProps} />}
        {step === 2 && <Step2 {...stepProps} />}
        {step === 3 && <Step3 {...stepProps} />}
        {step === 4 && <Step4 {...stepProps} />}
        {step === 5 && <Step5 {...stepProps} />}
        {step === 6 && (
          <Step6
            data={formData}
            onGoToStep={setStep}
            onDownload={handleDownload}
            isGenerating={isGenerating}
          />
        )}
      </div>

      {/* Navigation buttons (skip for step 6) */}
      {step < 6 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          {step > 1 ? (
            <button
              onClick={goBack}
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                background: 'none',
                border: '1.5px solid var(--color-border-brand)',
                borderRadius: 8,
                padding: '10px 22px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IconChevronLeft size={15} />
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={goNext}
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--color-blue)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 26px',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(21,84,209,0.28)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Continue
            <IconChevronRight size={15} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
