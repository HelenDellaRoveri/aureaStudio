import { AppointmentStatus } from "@/lib/types";
export function StatusBadge({status}:{status:AppointmentStatus}){return <span className={`status status-${status.toLowerCase().replaceAll(" ","-").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}`}>{status}</span>}

