import { useEffect } from 'react';
import {
  IconCircleCheck,
  IconShieldCheck,
  IconReceipt2,
  IconBriefcase,
  IconCalendarStats,
  IconUserCheck,
  IconArrowRight,
} from '@tabler/icons-react';
import type { W9FormData } from '@/lib/fillW9PDF';
import { pushUpsellClick, pushUpsellView } from '@/lib/analytics';

interface UpsellCTAProps {
  formData: W9FormData;
  deliveryMethod: 'email' | 'download';
}

type Variant = 'form-entity' | 'optimize-taxes';

const FONT = "'Inter', system-ui, sans-serif";
const FONT_HEADING = "'Poppins', system-ui, sans-serif";

const VARIANT_CONTENT: Record<
  Variant,
  {
    badge: string;
    headline: string;
    subhead: string;
    bullets: { icon: typeof IconShieldCheck; text: string }[];
    ctaLabel: string;
    ctaHref: string;
    disclaimer: string;
  }
> = {
  'form-entity': {
    badge: 'Your next step',
    headline: "Now that you're earning 1099 income, you're a business.",
    subhead:
      "But right now, you're personally on the hook for it. As a sole proprietor, there's no legal line between you and your business: your assets, your liability, and your tax bill are all tied together. Here's what forming an LLC changes.",
    bullets: [
      { icon: IconShieldCheck, text: 'Separate your personal assets from business liability' },
      { icon: IconReceipt2, text: 'Potential self-employment tax savings with the right entity structure' },
      { icon: IconBriefcase, text: 'Look more credible to clients, banks, and lenders' },
    ],
    ctaLabel: 'Start forming your business',
    ctaHref: 'https://1800accountant.com/get-started/name-3',
    disclaimer: 'Free to start. A business formation specialist walks you through it.',
  },
  'optimize-taxes': {
    badge: 'Your next step',
    headline: "You're running a business. Is it optimized for tax season?",
    subhead:
      "Filing a W-9 as a registered business is just the start. Many business owners overpay simply because no one's proactively managing their bookkeeping and tax strategy year-round.",
    bullets: [
      { icon: IconCalendarStats, text: "Quarterly tax planning so you're never surprised at filing time" },
      { icon: IconReceipt2, text: 'Uncover deductions specific to your entity type' },
      { icon: IconUserCheck, text: 'A dedicated tax advisor who knows your business' },
    ],
    ctaLabel: 'Get a free tax consultation',
    ctaHref: 'https://1800accountant.com/services/tax-advisory',
    disclaimer: 'No obligation. Takes about 15 minutes.',
  },
};

function variantForTaxClassification(taxClassification: string): Variant {
  return taxClassification === 'individual' ? 'form-entity' : 'optimize-taxes';
}

export default function UpsellCTA({ formData, deliveryMethod }: UpsellCTAProps) {
  const variant = variantForTaxClassification(formData.taxClassification);
  const content = VARIANT_CONTENT[variant];
  const confirmationText =
    deliveryMethod === 'email' ? 'Your W-9 has been emailed to you.' : 'Your W-9 has been downloaded.';

  useEffect(() => {
    pushUpsellView(variant);
  }, [variant]);

  function handleCtaClick() {
    pushUpsellClick(variant, content.ctaHref);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
        <IconCircleCheck size={18} color="var(--color-success)" />
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
          {confirmationText}
        </p>
      </div>

      <div
        style={{
          background: 'linear-gradient(145deg, var(--color-navy) 0%, #071b30 100%)',
          borderRadius: 12,
          padding: '36px 30px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 8,
            padding: '5px 14px',
            marginBottom: 18,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#fff' }}>{content.badge}</span>
        </div>

        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontWeight: 600,
            fontSize: 'clamp(20px, 3vw, 26px)',
            color: '#fff',
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}
        >
          {content.headline}
        </h2>

        <p
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(200,213,232,0.85)',
            lineHeight: 1.7,
            margin: '0 auto 26px',
            maxWidth: 460,
          }}
        >
          {content.subhead}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420, margin: '0 auto 28px', textAlign: 'left' }}>
          {content.bullets.map(bullet => (
            <div key={bullet.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <bullet.icon size={13} color="#fff" />
              </span>
              <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,0.92)', lineHeight: 1.6 }}>
                {bullet.text}
              </span>
            </div>
          ))}
        </div>

        <a
          href={content.ctaHref}
          onClick={handleCtaClick}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fff',
            color: 'var(--color-navy)',
            fontFamily: FONT_HEADING,
            fontSize: 15,
            fontWeight: 600,
            padding: '13px 28px',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
          }}
        >
          {content.ctaLabel}
          <IconArrowRight size={15} />
        </a>

        <p style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '14px 0 0' }}>{content.disclaimer}</p>
      </div>

      <p style={{ textAlign: 'center', margin: '20px 0 0' }}>
        <a
          href="/"
          style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-muted)', textDecoration: 'underline' }}
        >
          No thanks, I'm all set
        </a>
      </p>
    </div>
  );
}
