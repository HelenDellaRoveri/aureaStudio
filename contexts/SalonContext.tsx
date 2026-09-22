"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  appointments as initialAppointments,
  professionals as initialProfessionals,
  services as initialServices,
} from "@/lib/data";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Appointment,
  BusinessHour,
  Professional,
  ScheduleBlock,
  Service,
} from "@/lib/types";

const defaultBusinessHours: BusinessHour[] = [1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  active: false,
  start: "09:00",
  end: "19:00",
}));
const defaultServiceIds = new Set(
  Array.from({ length: 12 }, (_, i) => `s${i + 1}`),
);
const defaultProfessionalIds = new Set(
  Array.from({ length: 6 }, (_, i) => `p${i + 1}`),
);
const defaultAppointmentIds = new Set(
  Array.from({ length: 5 }, (_, i) => `a${i + 1}`),
);

type SalonContextValue = {
  services: Service[];
  setServices: (v: Service[]) => void;
  professionals: Professional[];
  setProfessionals: (v: Professional[]) => void;
  blocks: ScheduleBlock[];
  setBlocks: (v: ScheduleBlock[]) => void;
  businessHours: BusinessHour[];
  setBusinessHours: (v: BusinessHour[]) => void;
  appointments: Appointment[];
  setAppointments: (v: Appointment[]) => void;
  toast: string;
  notify: (message: string) => void;
};
const SalonContext = createContext<SalonContextValue | null>(null);
const key = "aurea-studio-v1";

export function SalonProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [services, setServices] = useState(initialServices);
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [businessHours, setBusinessHours] =
    useState<BusinessHour[]>(defaultBusinessHours);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const v = JSON.parse(saved);
        setServices(
          (v.services || initialServices).filter(
            (service: Service) => !defaultServiceIds.has(service.id),
          ),
        );
        setProfessionals(
          (v.professionals || initialProfessionals).filter(
            (professional: Professional) =>
              !defaultProfessionalIds.has(professional.id),
          ),
        );
        setBlocks(v.blocks || []);
        setBusinessHours(v.businessHours || defaultBusinessHours);
        setAppointments(
          (v.appointments || initialAppointments).filter(
            (appointment: Appointment) =>
              !defaultAppointmentIds.has(appointment.id),
          ),
        );
      }
    } catch {}
    Promise.allSettled([
      api<{ services: Service[] }>("/services"),
      api<{ professionals: Professional[] }>("/professionals"),
      api<{ blocks: ScheduleBlock[] }>("/blocks"),
      api<{ businessHours: BusinessHour[] }>("/business-hours"),
    ])
      .then(([catalog, pros, resultBlocks, hours]) => {
        if (catalog.status === "fulfilled") setServices(catalog.value.services);
        if (pros.status === "fulfilled")
          setProfessionals(
            pros.value.professionals.filter(
              (professional) => !defaultProfessionalIds.has(professional.id),
            ),
          );
        if (resultBlocks.status === "fulfilled")
          setBlocks(resultBlocks.value.blocks);
        if (hours.status === "fulfilled")
          setBusinessHours(
            defaultBusinessHours.map(
              (fallback) =>
                hours.value.businessHours.find(
                  (item) => item.day === fallback.day,
                ) || fallback,
            ),
          );
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!user || !["admin", "professional"].includes(user.role)) return;
    api<{ appointments: Appointment[] }>("/appointments")
      .then((result) => setAppointments(result.appointments))
      .catch(() => undefined);
  }, [user]);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        key,
        JSON.stringify({
          services,
          professionals,
          blocks,
          businessHours,
          appointments,
        }),
      );
  }, [ready, services, professionals, blocks, businessHours, appointments]);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };
  return (
    <SalonContext.Provider
      value={{
        services,
        setServices,
        professionals,
        setProfessionals,
        blocks,
        setBlocks,
        businessHours,
        setBusinessHours,
        appointments,
        setAppointments,
        toast,
        notify,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
}
export const useSalon = () => {
  const v = useContext(SalonContext);
  if (!v) throw new Error("SalonProvider ausente");
  return v;
};
