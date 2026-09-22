import { Professional } from "@/lib/types";
export function ProfessionalCard({professional,onBook}:{professional:Professional;onBook:(id:string)=>void}){return <article className="professional-card"><div className={`avatar-xl tone-${professional.tone}`}>{professional.initials}</div><small>{professional.specialty}</small><h3>{professional.name}</h3><p>{professional.description}</p><button className="outline-button" onClick={()=>onBook(professional.id)}>Ver horários</button></article>}

