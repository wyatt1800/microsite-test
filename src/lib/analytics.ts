declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushFormStepView(step: number, stepName: string): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: 'w9_form_step_view', step, stepName });
}

export function pushUpsellView(variant: 'form-entity' | 'optimize-taxes'): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: 'w9_upsell_view', variant });
}

export function pushUpsellClick(variant: 'form-entity' | 'optimize-taxes', destination: string): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: 'w9_upsell_click', variant, destination });
}
