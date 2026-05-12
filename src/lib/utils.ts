import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Champs manuels Flooz / Yas / compte bancaire (rétrocompat TMoney / Visa). */
export function getDonationPaymentFields(settings: Record<string, unknown> | null | undefined) {
  const s = settings ?? {}
  return {
    flooz: typeof s.donationFlooz === "string" ? s.donationFlooz : "",
    yas: typeof s.donationYas === "string" ? s.donationYas : typeof s.donationTMoney === "string" ? s.donationTMoney : "",
    bank: typeof s.donationBank === "string" ? s.donationBank : typeof s.donationVisa === "string" ? s.donationVisa : "",
  }
}
