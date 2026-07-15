import { useState } from 'react';

interface LeadCaptureProps {
  onEmailSent: () => void;
  onDownloadRequested: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'error';

const FONT = "'Inter', system-ui, sans-serif";
const FONT_HEADING = "'Poppins', system-ui, sans-serif";

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
};

export default function LeadCapture({ onEmailSent, onDownloadRequested }: LeadCaptureProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function focusStyle(field: string): React.CSSProperties {
    return {
      ...inputStyle,
      borderColor: focusedField === field ? 'var(--color-blue)' : 'var(--color-border-brand)',
      boxShadow: focusedField === field ? '0 0 0 3px rgba(21,84,209,0.10)' : 'none',
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
      });
      if (result.error) throw new Error('Submission failed');
      onEmailSent();
    } catch {
      setSubmitState('error');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 600, fontSize: 22, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
          Get your completed W-9.
        </h3>
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Enter your email to download your PDF and receive a copy, plus a short guide on what freelancers and contractors need to know about taxes.
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
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-error)',
          }}
        >
          Something went wrong sending your email. You can try again, or download your PDF directly below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
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
            <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
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
          <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
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

        <button
          type="submit"
          disabled={submitState === 'submitting'}
          style={{
            fontFamily: FONT_HEADING,
            fontWeight: 600,
            fontSize: 15,
            backgroundColor: submitState === 'submitting' ? 'var(--color-blue-mid)' : 'var(--color-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '13px 24px',
            cursor: submitState === 'submitting' ? 'wait' : 'pointer',
            width: '100%',
            transition: 'background-color 0.15s',
            boxShadow: submitState === 'submitting' ? 'none' : '0 3px 12px rgba(21,84,209,0.28)',
          }}
        >
          {submitState === 'submitting' ? 'Sending...' : 'Email me my W-9'}
        </button>

        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          Or{' '}
          <button
            type="button"
            onClick={onDownloadRequested}
            style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline', fontFamily: FONT, fontWeight: 600 }}
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
