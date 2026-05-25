import { useState, useCallback } from 'react';
import W9Form from './W9Form';
import LeadCapture from './LeadCapture';
import type { W9FormData } from '@/lib/generateW9PDF';

type Stage = 'form' | 'lead-capture';

export default function W9FormIsland() {
  const [stage, setStage] = useState<Stage>('form');
  const [completedData, setCompletedData] = useState<W9FormData | null>(null);

  const handlePdfReady = useCallback((data: W9FormData) => {
    setCompletedData(data);
    setStage('lead-capture');
  }, []);

  async function handleDirectDownload() {
    if (!completedData) return;
    const { generateW9PDF, downloadPDF } = await import('@/lib/generateW9PDF');
    const pdfBytes = await generateW9PDF(completedData);
    const safeName = completedData.legalName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadPDF(pdfBytes, `w9_${safeName}.pdf`);
  }

  if (stage === 'lead-capture' && completedData) {
    return (
      <LeadCapture
        formData={completedData}
        pdfData={completedData}
        onDirectDownload={handleDirectDownload}
      />
    );
  }

  return <W9Form onPdfReady={handlePdfReady} />;
}
