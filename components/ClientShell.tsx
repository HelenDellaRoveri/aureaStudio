"use client";
import { CalendarDays, LogIn, LogOut, Menu, UserRound } from "lucide-react";
import { ReactNode, useState } from "react";
import { Brand } from "./Brand";
import { useAuth } from "@/contexts/AuthContext";

const links=[['inicio','Início'],['servicos','Serviços'],['profissionais','Profissionais'],['agendar','Agendar'],['meus-agendamentos','Meus horários']];
export function ClientShell({page,onNavigate,children}:{page:string;onNavigate:(p:string)=>void;children:ReactNode}){
 const [open,setOpen]=useState(false);const {user,logout}=useAuth();
 const exit=async()=>{await logout();onNavigate('inicio')};
 return <div className="client-app"><header className="client-header"><button className="brand-button" onClick={()=>onNavigate('inicio')} aria-label="Ir para o início"><Brand/></button><nav className={open?'nav-open':''} aria-label="Navegação principal">{links.map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>{onNavigate(id);setOpen(false)}}>{label}</button>)}</nav><div className="header-actions">{user?<><button className="account-button" onClick={()=>onNavigate('perfil')}><UserRound size={18}/><span>{user.name.split(' ')[0]}</span></button><button className="icon-button" onClick={exit} aria-label="Sair"><LogOut size={18}/></button></>:<button className="account-button" onClick={()=>onNavigate('login')}><LogIn size={18}/><span>Entrar</span></button>}<button className="primary-button compact" onClick={()=>onNavigate('agendar')}><CalendarDays size={17}/> Agendar</button><button className="icon-button menu-button" onClick={()=>setOpen(!open)} aria-label="Abrir menu"><Menu size={20}/></button></div></header><main>{children}</main><footer className="client-footer"><Brand/><p>Beleza, cuidado e tempo para você.</p><span>Dados e valores demonstrativos • © 2026 Áurea Studio</span></footer></div>
}
