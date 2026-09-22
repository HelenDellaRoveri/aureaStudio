import {
  Appointment,
  BusinessHour,
  Professional,
  ScheduleBlock,
  Service,
} from "./types";

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
export const prettyDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
export const localDateInput = (value = new Date()) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
export const todayInput = () => localDateInput();
export const currentYearEndInput = () => `${new Date().getFullYear()}-12-31`;

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const time = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

export function availableSlots(
  date: string,
  professional: Professional,
  service: Service,
  items: Appointment[],
  blocks: ScheduleBlock[] = [],
  businessHours: BusinessHour[] = [],
  excludeAppointmentId?: string,
) {
  const weekDay = date ? new Date(`${date}T12:00:00`).getDay() : -1;
  const salonHours = businessHours.find((item) => item.day === weekDay);
  if (
    !date ||
    date < todayInput() ||
    date > currentYearEndInput() ||
    !professional.workDays.includes(weekDay) ||
    !salonHours?.active
  )
    return [];
  const opening = Math.max(
    minutes(professional.start),
    minutes(salonHours.start),
  );
  const closing = Math.min(minutes(professional.end), minutes(salonHours.end));
  const now = new Date();
  const slots: string[] = [];
  for (
    let cursor = opening;
    cursor + service.duration <= closing;
    cursor += 30
  ) {
    const candidate = time(cursor);
    const candidateDate = new Date(`${date}T${candidate}:00`);
    if (candidateDate <= now) continue;
    const blocked = blocks.some(
      (b) =>
        b.date === date &&
        (!b.professionalId || b.professionalId === professional.id) &&
        (b.wholeDay ||
          (cursor < minutes(b.endTime || "23:59") &&
            cursor + service.duration > minutes(b.startTime || "00:00"))),
    );
    if (blocked) continue;
    const conflict = items.some(
      (a) =>
        a.id !== excludeAppointmentId &&
        a.professionalId === professional.id &&
        a.date === date &&
        !["Cancelado", "Não compareceu"].includes(a.status) &&
        cursor < minutes(a.time) + service.duration &&
        cursor + service.duration > minutes(a.time),
    );
    if (!conflict) slots.push(candidate);
  }
  return slots;
}
