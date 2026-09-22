import { Appointment, Professional, Service } from "./types";

export const categories = [
  "Cabelos",
  "Sobrancelhas",
  "Cílios",
  "Maquiagem",
  "Unhas",
  "Estética",
];

// O sistema inicia sem catálogo, equipe, clientes ou agendamentos demonstrativos.
// Esses dados devem ser cadastrados pela área administrativa.
export const services: Service[] = [];
export const professionals: Professional[] = [];
export const appointments: Appointment[] = [];
export const clients: Array<{
  name: string;
  phone: string;
  email: string;
  visits: number;
}> = [];
