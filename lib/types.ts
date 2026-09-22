export type Role = "client" | "professional" | "admin";
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  professionalId?: string | null;
}
export type AppointmentStatus =
  "Agendado" | "Confirmado" | "Concluído" | "Cancelado" | "Não compareceu";

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  professionalIds: string[];
  active: boolean;
  icon: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  description: string;
  initials: string;
  tone: string;
  serviceIds: string[];
  active: boolean;
  workDays: number[];
  start: string;
  end: string;
}

export interface ScheduleBlock {
  id: string;
  professionalId: string | null;
  date: string;
  reason: string;
  wholeDay: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface BusinessHour {
  day: number;
  active: boolean;
  start: string;
  end: string;
}

export interface Appointment {
  id: string;
  client: string;
  phone: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  duration?: number;
  serviceName?: string;
  professionalName?: string;
}
