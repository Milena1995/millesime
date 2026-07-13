export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  /** Prix en centimes d'euro (utilisé tel quel par Stripe). */
  amount: number;
}

/** Grille à prix coûtant, calibrée sur un coût observé réel d'environ 0,12€/crédit
 * (voir mesure du 2026-07-13 : 10 bouteilles = 1,20€ facturés côté Gemini),
 * plus une petite marge de sécurité pour les frais Stripe et la variabilité
 * (recherche web, régénération d'image). */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "decouverte", label: "Découverte", credits: 20, amount: 299 },
  { id: "standard", label: "Standard", credits: 60, amount: 799 },
  { id: "cave", label: "Cave", credits: 150, amount: 1999 },
];

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
