import { useState, useCallback } from 'react';
import {
  IconShieldCheck,
  IconChevronLeft,
  IconChevronRight,
  IconInfoCircle,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconServerOff,
} from '@tabler/icons-react';
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

function InfoTooltip({ text }: { text: string }) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const open = hoverOpen || pinnedOpen;
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        type="button"
        aria-label="More information"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setPinnedOpen(o => !o); }}
        onFocus={() => setPinnedOpen(true)}
        onBlur={() => setPinnedOpen(false)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          color: 'var(--color-text-muted)',
          lineHeight: 0,
        }}
      >
        <IconInfoCircle size={15} />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '135%',
            left: 0,
            zIndex: 20,
            width: 240,
            backgroundColor: 'var(--color-text-primary)',
            color: '#fff',
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.5,
            borderRadius: 8,
            padding: '8px 10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.20)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function FieldWrapper({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        {hint && <InfoTooltip text={hint} />}
      </div>
      {children}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                {cls.label}
              </p>
              <InfoTooltip text={cls.hint} />
            </div>
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
        hint="A code showing you're exempt from backup withholding on 1099 reporting — used by entities like corporations, tax-exempt organizations, and IRAs. Each entity type has its own code (1-13) listed in the IRS W-9 instructions."
      >
        <TextInput
          value={data.exemptPayeeCode}
          onChange={v => onChange('exemptPayeeCode', v)}
          placeholder="Leave blank if unsure"
        />
      </FieldWrapper>
      <FieldWrapper
        label="Exemption from FATCA reporting code (optional)"
        hint="A code showing you're exempt from FATCA (Foreign Account Tax Compliance Act) reporting — generally used by U.S. payees whose accounts are maintained in the United States. Each exempt category has its own code (A-M) listed in the IRS W-9 instructions."
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
      <FieldWrapper label="City" hint="The city for the mailing address above, as it would appear on mail sent to you." error={errors.city}>
        <TextInput value={data.city} onChange={v => onChange('city', v)} placeholder="e.g. Austin" />
      </FieldWrapper>
      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="State" hint="The two-letter abbreviation for the state in your mailing address." error={errors.state}>
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
        <FieldWrapper label="ZIP code" hint="Your 5-digit ZIP code. Add the extra 4 digits (ZIP+4) if you know them." error={errors.zip}>
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
  const [tinVisible, setTinVisible] = useState(false);

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
            <InfoTooltip
              text={
                type === 'ssn'
                  ? 'Use your 9-digit Social Security Number if you are an individual or sole proprietor without a separate business EIN.'
                  : 'Use your 9-digit Employer Identification Number if your business has one, such as an LLC, corporation, or partnership.'
              }
            />
          </label>
        ))}
      </div>

      <FieldWrapper
        label={data.tinType === 'ssn' ? 'Social Security Number' : 'Employer Identification Number'}
        hint="Your SSN/EIN is used only to generate your PDF and is never sent to our servers."
        error={errors.tin}
      >
        <div style={{ position: 'relative' }}>
          <input
            type={tinVisible ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="off"
            value={data.tin}
            onChange={e => handleTinChange(e.target.value)}
            placeholder={data.tinType === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              ...inputStyle,
              paddingRight: 42,
              letterSpacing: '0.08em',
              borderColor: focused ? 'var(--color-blue)' : errors.tin ? 'var(--color-error)' : 'var(--color-border-brand)',
              boxShadow: focused ? '0 0 0 3px rgba(21,84,209,0.10)' : 'none',
            }}
          />
          <button
            type="button"
            aria-label={tinVisible ? 'Hide number' : 'Show number'}
            onClick={() => setTinVisible(v => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 2,
              margin: 0,
              cursor: 'pointer',
              display: 'flex',
              color: 'var(--color-text-muted)',
              lineHeight: 0,
            }}
          >
            {tinVisible ? <IconEyeOff size={17} /> : <IconEye size={17} />}
          </button>
        </div>
      </FieldWrapper>

      <div
        style={{
          padding: '14px 16px',
          backgroundColor: 'var(--color-teal-light)',
          border: '1px solid #99f6e4',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconShieldCheck size={17} color="var(--color-teal)" style={{ flexShrink: 0 }} />
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: 'var(--color-teal)', margin: 0 }}>
            Your {data.tinType === 'ssn' ? 'SSN' : 'EIN'} is protected
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { icon: IconLock, text: 'Hidden by default — masked like a password field until you choose to reveal it.' },
            { icon: IconServerOff, text: 'Processed entirely in your browser. It is never uploaded or transmitted to any server.' },
            { icon: IconEyeOff, text: 'Not stored, logged, or cached anywhere — it disappears when you close this tab.' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <item.icon size={14} color="var(--color-teal)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReviewSectionProps {
  label: string;
  value: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ReviewSection({ label, value, expanded, onToggle, children }: ReviewSectionProps) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border-brand)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', margin: '0 0 2px' }}>{label}</p>
          <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{value || '—'}</p>
        </div>
        <button
          onClick={onToggle}
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
            flexShrink: 0,
          }}
          className="hover:bg-blue-50 transition-colors"
        >
          {expanded ? 'Done' : 'Edit'}
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Step6({ data, onChange, errors, onContinue }: {
  data: W9FormData;
  onChange: (field: keyof W9FormData, value: string) => void;
  errors: Partial<Record<keyof W9FormData, string>>;
  onContinue: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  function toggleSection(id: string) {
    setExpandedSection(current => (current === id ? null : id));
  }

  const classLabel = TAX_CLASSIFICATIONS.find(c => c.value === data.taxClassification)?.label ?? data.taxClassification;
  const address = [data.streetAddress, data.city, data.state, data.zip].filter(Boolean).join(', ');
  const exemptions = [data.exemptPayeeCode && `Payee code: ${data.exemptPayeeCode}`, data.fatcaCode && `FATCA: ${data.fatcaCode}`].filter(Boolean).join(' · ');
  const stepProps: StepProps = { data, onChange, errors };

  return (
    <div className="flex flex-col gap-1">
      <ReviewSection
        label="Legal name & business"
        value={[data.legalName, data.businessName].filter(Boolean).join(' · ')}
        expanded={expandedSection === 'name'}
        onToggle={() => toggleSection('name')}
      >
        <Step1 {...stepProps} />
      </ReviewSection>
      <ReviewSection
        label="Tax classification"
        value={classLabel}
        expanded={expandedSection === 'classification'}
        onToggle={() => toggleSection('classification')}
      >
        <Step2 {...stepProps} />
      </ReviewSection>
      <ReviewSection
        label="Exemptions"
        value={exemptions || '(none)'}
        expanded={expandedSection === 'exemptions'}
        onToggle={() => toggleSection('exemptions')}
      >
        <Step3 {...stepProps} />
      </ReviewSection>
      <ReviewSection
        label="Address"
        value={address}
        expanded={expandedSection === 'address'}
        onToggle={() => toggleSection('address')}
      >
        <Step4 {...stepProps} />
      </ReviewSection>
      <ReviewSection
        label={data.tinType === 'ssn' ? 'Social Security Number' : 'Employer Identification Number'}
        value={maskTin(data.tin, data.tinType)}
        expanded={expandedSection === 'tin'}
        onToggle={() => toggleSection('tin')}
      >
        <Step5 {...stepProps} />
      </ReviewSection>

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
            By clicking Continue, you certify under penalties of perjury that the information above is accurate and complete. Your full legal name,{' '}
            <strong>{data.legalName}</strong>, will be entered as your typed signature on the W-9.
          </p>
        </div>

        <button
          onClick={onContinue}
          style={{
            fontFamily: FONT_HEADING,
            fontWeight: 600,
            fontSize: 15,
            backgroundColor: 'var(--color-teal)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '14px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background-color 0.15s',
            width: '100%',
            boxShadow: '0 4px 16px rgba(15,118,110,0.30)',
          }}
        >
          Continue
          <IconArrowRight size={16} />
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

const STEP_INFO: { title: string; description: string }[] = [
  {
    title: 'Tell us who this W-9 is for',
    description: 'Enter the legal name that matches your tax return, plus a business name if you operate under one.',
  },
  {
    title: 'How is your business taxed?',
    description: 'Choose the federal tax classification that matches your business structure.',
  },
  {
    title: 'Exemptions',
    description: 'Only certain entities need these boxes filled in — most people can leave both blank and continue.',
  },
  {
    title: 'Where should the IRS mail you?',
    description: 'Enter the address you use to receive tax correspondence and information returns.',
  },
  {
    title: 'Your taxpayer identification number',
    description: 'Provide your SSN or EIN so payers can correctly report income paid to you.',
  },
  {
    title: 'Review your W-9',
    description: 'Double-check every field below, click Edit to make changes right here, then continue to get your completed PDF.',
  },
];

interface W9FormProps {
  step: number;
  onStepChange: (step: number) => void;
  onPdfReady: (data: W9FormData) => void;
}

export default function W9Form({ step, onStepChange, onPdfReady }: W9FormProps) {
  const [formData, setFormData] = useState<W9FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof W9FormData, string>>>({});

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
    onStepChange(Math.min(step + 1, TOTAL_STEPS));
  }

  function goBack() {
    setErrors({});
    onStepChange(Math.max(step - 1, 1));
  }

  function handleContinue() {
    onPdfReady(formData);
  }

  const stepProps: StepProps = { data: formData, onChange: updateField, errors };

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Step header */}
      <div className="mb-6" style={{ textAlign: 'left' }}>
        <h2 style={{ fontFamily: FONT_HEADING, fontWeight: 600, fontSize: 20, color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1.3 }}>
          {STEP_INFO[step - 1].title}
        </h2>
        <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: 'var(--color-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Step {step} of {TOTAL_STEPS}
        </span>
        <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '6px 0 14px', lineHeight: 1.6 }}>
          {STEP_INFO[step - 1].description}
        </p>
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
            onChange={updateField}
            errors={errors}
            onContinue={handleContinue}
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
