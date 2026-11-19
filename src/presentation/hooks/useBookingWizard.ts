"use client";

import { useRef, useState } from "react";
import { buildWhatsAppLink } from "@/application/build-whatsapp-link";
import { createBookingAction, getAvailableSlotsAction } from "@/app/actions";
import type { BookingMode, ServiceType } from "@/domain/entities/Booking";
import { toISODate } from "@/domain/services/scheduling";
import { isValidContactInfo } from "@/domain/value-objects/ContactInfo";
import type { TimeSlot } from "@/domain/value-objects/TimeSlot";
import { BARBER_WHATSAPP } from "@/infrastructure/config/shop";

export type SlotsStatus = "idle" | "loading" | "error";

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
  /** Horarios disponibles para `date` + `service`; null si aún no se han cargado. */
  slots: TimeSlot[] | null;
  slotsStatus: SlotsStatus;
  submitting: boolean;
  error: string | null;
}

export type Patch = (p: Partial<WizardState>) => void;

const NETWORK_ERROR = "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";

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
    slots: null,
    slotsStatus: "idle",
    submitting: false,
    error: null,
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
  // Descarta respuestas de peticiones de horarios que ya no corresponden a la selección actual.
  const slotsRequest = useRef(0);

  const isCorte = s.mode === "corte";
  const isTattoo = s.mode === "tatuaje";
  const valid = validStep(s) && !s.submitting;

  async function loadSlots(date: Date | null, service: ServiceType | null) {
    const id = ++slotsRequest.current;
    if (!date || !service) {
      patch({ slots: null, slotsStatus: "idle" });
      return;
    }
    patch({ slots: null, slotsStatus: "loading" });
    try {
      const res = await getAvailableSlotsAction({ date: toISODate(date), service });
      if (id !== slotsRequest.current) return;
      if (!res.ok) {
        patch({ slotsStatus: "error" });
        return;
      }
      setS((prev) => ({
        ...prev,
        slots: res.slots,
        slotsStatus: "idle",
        time: prev.time && res.slots.includes(prev.time) ? prev.time : null,
      }));
    } catch {
      if (id === slotsRequest.current) patch({ slotsStatus: "error" });
    }
  }

  const selectDate = (date: Date) => {
    patch({ date, time: null, error: null });
    void loadSlots(date, s.service);
  };
  const selectService = (service: ServiceType) => {
    patch({ service, error: null });
    void loadSlots(s.date, service);
  };
  const retrySlots = () => void loadSlots(s.date, s.service);

  async function confirmBooking() {
    if (!s.service || !s.date || !s.time) return;
    patch({ submitting: true, error: null });
    try {
      const res = await createBookingAction({
        service: s.service,
        date: toISODate(s.date),
        time: s.time,
        name: s.name,
        phone: s.phone,
        email: s.email,
        notes: s.notes,
      });
      if (res.ok) {
        patch({ submitting: false, done: true });
      } else if (res.code === "SLOT_UNAVAILABLE") {
        // Alguien tomó el horario: volvemos a elegir hora con la lista actualizada.
        patch({ submitting: false, step: 2, time: null, error: res.message });
        void loadSlots(s.date, s.service);
      } else {
        patch({ submitting: false, error: res.message });
      }
    } catch {
      patch({ submitting: false, error: NETWORK_ERROR });
    }
  }

  const goBack = () => {
    if (s.submitting) return;
    patch({ step: Math.max(0, s.step - 1), error: null });
  };
  const goNext = () => {
    if (!valid) return;
    if (s.step === 1 && isTattoo) {
      window.open(buildWhatsAppLink({ barberPhone: BARBER_WHATSAPP, contact: s, notes: s.notes }), "_blank");
      patch({ done: true });
      return;
    }
    if (s.step === 3) {
      void confirmBooking();
    } else {
      patch({ step: s.step + 1, error: null });
    }
  };
  const restart = () => {
    slotsRequest.current++;
    setS(initialState());
  };

  const shiftMonth = (dir: number) => {
    const m = s.viewM + dir;
    patch({ viewM: ((m % 12) + 12) % 12, viewY: s.viewY + Math.floor(m / 12) });
  };

  return {
    s,
    patch,
    valid,
    isCorte,
    isTattoo,
    goNext,
    goBack,
    restart,
    shiftMonth,
    selectDate,
    selectService,
    retrySlots,
  };
}
