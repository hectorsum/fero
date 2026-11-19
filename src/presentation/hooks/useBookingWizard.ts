"use client";

import { useState } from "react";
import type { BookingMode, ServiceType } from "@/domain/entities/Booking";
import { isValidContactInfo } from "@/domain/value-objects/ContactInfo";
import { buildWhatsAppLink } from "@/application/build-whatsapp-link";
import { BARBER_WHATSAPP } from "@/infrastructure/config/shop";

export interface WizardState {
  mode: BookingMode | null;
  step: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  service: ServiceType | null;
  date: Date | null;
  time: string | null;
  viewY: number;
  viewM: number;
  done: boolean;
}

export type Patch = (p: Partial<WizardState>) => void;

function initialState(): WizardState {
  const t = new Date();
  return {
    mode: null,
    step: 0,
    name: "",
    phone: "",
    email: "",
    notes: "",
    service: null,
    date: null,
    time: null,
    viewY: t.getFullYear(),
    viewM: t.getMonth(),
    done: false,
  };
}

export function validStep(s: WizardState): boolean {
  if (s.step === 0) return s.mode !== null;
  if (s.step === 1) return isValidContactInfo(s);
  if (s.step === 2) return s.service !== null && !!s.date && !!s.time;
  return true;
}

export function useBookingWizard() {
  const [s, setS] = useState<WizardState>(initialState);
  const patch: Patch = (p) => setS((prev) => ({ ...prev, ...p }));

  const isCorte = s.mode === "corte";
  const isTattoo = s.mode === "tatuaje";
  const valid = validStep(s);

  const goBack = () => patch({ step: Math.max(0, s.step - 1) });
  const goNext = () => {
    if (!validStep(s)) return;
    if (s.step === 1 && isTattoo) {
      window.open(buildWhatsAppLink({ barberPhone: BARBER_WHATSAPP, contact: s, notes: s.notes }), "_blank");
      patch({ done: true });
      return;
    }
    if (s.step === 3) {
      patch({ done: true });
    } else {
      patch({ step: s.step + 1 });
    }
  };
  const restart = () => setS(initialState());

  const shiftMonth = (dir: number) => {
    const m = s.viewM + dir;
    patch({ viewM: ((m % 12) + 12) % 12, viewY: s.viewY + Math.floor(m / 12) });
  };

  return { s, patch, valid, isCorte, isTattoo, goNext, goBack, restart, shiftMonth };
}
