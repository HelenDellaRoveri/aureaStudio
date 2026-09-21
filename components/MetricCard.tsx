import { LucideIcon } from "lucide-react";
export function MetricCard({label,value,detail,icon:Icon,tone='gold'}:{label:string;value:string;detail:string;icon:LucideIcon;tone?:string}){return <article className={`metric-card metric-${tone}`}><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div><span className="metric-icon"><Icon size={20}/></span></article>}

