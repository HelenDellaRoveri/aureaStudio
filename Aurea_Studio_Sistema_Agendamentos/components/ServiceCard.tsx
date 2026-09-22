import { Clock3 } from "lucide-react";
import { Service } from "@/lib/types";
import { money } from "@/lib/scheduling";
export function ServiceCard({service,onBook}:{service:Service;onBook:(id:string)=>void}){return <article className="service-card"><div className="service-visual"><span>{service.category}</span><strong>{service.name.split(' ')[0]}</strong></div><div className="service-body"><small>{service.category}</small><h3>{service.name}</h3><p>{service.description}</p><div className="service-meta"><span><Clock3 size={16}/>{service.duration} min</span><strong>A partir de {money(service.price)}</strong></div><button className="text-button" onClick={()=>onBook(service.id)}>Agendar este serviço <span>→</span></button></div></article>}

