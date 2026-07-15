import { useCallback, useEffect, useState } from 'react';
import W9Form from './W9Form';
import LeadCapture from './LeadCapture';
import UpsellCTA from './UpsellCTA';
import type { W9FormData } from '@/lib/fillW9PDF';
import { pushFormStepView } from '@/lib/analytics';

type Stage = 'form' | 'lead-capture' | 'upsell';
type DeliveryMethod = 'email' | 'download';

const STEP_NAMES = [
  'name-business',
  'tax-classification',
  'exemptions',
  'address',
  'taxpayer-id',
  'review-download',
];

function pathForStage(step: number, stage: Stage): string {
  if (stage === 'upsell') return '/form/next-steps';
  if (stage === 'lead-capture') return '/form/complete';
  return step === 1 ? '/form' : `/form/step-${step}`;
}

function parsePath(pathname: string): { step: number; stage: Stage } | null {
  if (pathname === '/form/next-steps') return { step: 6, stage: 'upsell' };
  if (pathname === '/form/complete') return { step: 6, stage: 'lead-capture' };
  if (pathname === '/form' || pathname === '/form/') return { step: 1, stage: 'form' };
  const match = pathname.match(/^\/form\/step-([1-6])\/?$/);
  if (match) return { step: Number(match[1]), stage: 'form' };
  return null;
}

interface W9FormIslandProps {
  initialStep?: number;
  initialStage?: Stage;
}

export default function W9FormIsland({ initialStep = 1, initialStage = 'form' }: W9FormIslandProps) {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [step, setStep] = useState(initialStep);
  const [completedData, setCompletedData] = useState<W9FormData | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('download');

  useEffect(() => {
    const path = pathForStage(step, stage);
    if (window.location.pathname !== path) {
      window.history.pushState({ step, stage }, '', path);
    }
    if (stage === 'upsell') {
      pushFormStepView(8, 'next-steps');
    } else if (stage === 'lead-capture') {
      pushFormStepView(7, 'get-your-pdf');
    } else {
      pushFormStepView(step, STEP_NAMES[step - 1]);
    }
  }, [step, stage]);

  useEffect(() => {
    function handlePopState() {
      const parsed = parsePath(window.location.pathname);
      if (!parsed) return;
      setStage(parsed.stage);
      setStep(parsed.step);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePdfReady = useCallback((data: W9FormData) => {
    setCompletedData(data);
    setStage('lead-capture');
  }, []);

  const handleEmailSent = useCallback(() => {
    setDeliveryMethod('email');
    setStage('upsell');
  }, []);

  async function handleDownloadRequested() {
    if (!completedData) return;
    const { fillW9PDF, downloadPDF } = await import('@/lib/fillW9PDF');
    const pdfBytes = await fillW9PDF(completedData);
    const safeName = completedData.legalName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadPDF(pdfBytes, `w9_${safeName}.pdf`);
    setDeliveryMethod('download');
    setStage('upsell');
  }

  if (stage === 'upsell' && completedData) {
    return <UpsellCTA formData={completedData} deliveryMethod={deliveryMethod} />;
  }

  if (stage === 'lead-capture' && completedData) {
    return (
      <LeadCapture
        onEmailSent={handleEmailSent}
        onDownloadRequested={handleDownloadRequested}
      />
    );
  }

  return <W9Form step={step} onStepChange={setStep} onPdfReady={handlePdfReady} />;
}
