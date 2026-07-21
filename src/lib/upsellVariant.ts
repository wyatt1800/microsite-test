export type UpsellVariant = 'form-entity' | 'optimize-taxes';

export function variantForTaxClassification(taxClassification: string): UpsellVariant {
  return taxClassification === 'individual' ? 'form-entity' : 'optimize-taxes';
}
