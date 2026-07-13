export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  /** Prix en centimes d'euro (utilisé tel quel par Stripe). */
  amount: number;
}

/** Grille à prix coûtant (couvre l'appel Gemini + les frais Stripe, sans marge). */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "decouverte", label: "Découverte", credits: 10, amount: 299 },
  { id: "standard", label: "Standard", credits: 30, amount: 799 },
  { id: "cave", label: "Cave", credits: 100, amount: 1999 },
];

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
