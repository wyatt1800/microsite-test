import { useState } from 'react';
import type { W9FormData } from '@/lib/generateW9PDF';

interface LeadCaptureProps {
  formData: W9FormData;
  pdfData: W9FormData;
  onDirectDownload: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const PERSONA_OPTIONS = [
  { value: 'freelancer', label: 'Freelancer / independent contractor' },
  { value: 'small-biz', label: 'Small business owner (LLC or corp)' },
  { value: 'gig-worker', label: 'Sole proprietor / gig worker' },
  { value: 'other', label: 'Other' },
];

const inputStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: 14,
  border: '1.5px solid var(--color-border-brand)',
  borderRadius: 6,
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
  backgroundColor: '#fff',
  color: 'var(--color-text-primary)',
};

export default function LeadCapture({ pdfData, onDirectDownload }: LeadCaptureProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [persona, setPersona] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function focusStyle(field: string): React.CSSProperties {
    return {
      ...inputStyle,
      borderColor: focusedField === field ? 'var(--color-blue)' : 'var(--color-border-brand)',
      boxShadow: focusedField === field ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState('submitting');

    try {
      const { actions } = await import('astro:actions');
      const result = await (actions as Record<string, (data: unknown) => Promise<{ error?: unknown }>>).captureW9Lead({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        persona,
      });
      if (result.error) throw new Error('Submission failed');
      setSubmitState('success');
      onDirectDownload();
    } catch {
      setSubmitState('error');
    }
  }

  if (submitState === 'success') {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-success-light)',
          border: '1px solid #6ee7b7',
          borderRadius: 12,
          padding: '28px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
        <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
          You're all set.
        </p>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Your W-9 has been downloaded. Check your email for a copy and a short guide on freelance taxes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
          Your W-9 is ready.
        </h3>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Enter your email and we'll send you a copy, plus a short guide on what freelancers and contractors need to know about taxes.
        </p>
      </div>

      {submitState === 'error' && (
        <div
          style={{
            backgroundColor: 'var(--color-error-light)',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 13,
            color: 'var(--color-error)',
          }}
        >
          Something went wrong. Your PDF was already downloaded. You can close this or try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Jane"
              onFocus={() => setFocusedField('first')}
              onBlur={() => setFocusedField(null)}
              style={focusStyle('first')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Smith"
              onFocus={() => setFocusedField('last')}
              onBlur={() => setFocusedField(null)}
              style={focusStyle('last')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Email address <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            style={focusStyle('email')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            How would you describe yourself?
          </label>
          <select
            value={persona}
            onChange={e => setPersona(e.target.value)}
            onFocus={() => setFocusedField('persona')}
            onBlur={() => setFocusedField(null)}
            style={focusStyle('persona')}
          >
            <option value="">Select one (optional)</option>
            {PERSONA_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitState === 'submitting'}
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            backgroundColor: submitState === 'submitting' ? 'var(--color-blue-mid)' : 'var(--color-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '13px 24px',
            cursor: submitState === 'submitting' ? 'wait' : 'pointer',
            width: '100%',
            transition: 'background-color 0.15s',
          }}
        >
          {submitState === 'submitting' ? 'Sending...' : 'Email me my W-9 →'}
        </button>

        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          Or{' '}
          <button
            type="button"
            onClick={onDirectDownload}
            style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit' }}
          >
            download directly without email
          </button>
          . We don't sell your information, ever.{' '}
          <a href="/privacy" style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>Privacy policy</a>.
        </p>
      </form>
    </div>
  );
}
