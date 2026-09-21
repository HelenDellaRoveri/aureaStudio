"use client";
import { useEffect, useState } from "react";
import { SalonProvider, useSalon } from "@/contexts/SalonContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientShell } from "@/components/ClientShell";
import { AdminShell } from "@/components/AdminShell";
import { LoginView, RegisterView } from "@/components/AuthView";
import { BookingView, ClientHome, MyAppointments, ProfileView, ProfessionalsView, ServicesView } from "@/components/ClientViews";
import { AgendaView, AppointmentsAdmin, ClientsAdmin, DashboardView, ManualBooking, ProfessionalsAdmin, ServicesAdmin, SettingsAdmin } from "@/components/AdminViews";

function App(){
 const {toast,notify}=useSalon();const {user,loading,logout}=useAuth();const [page,setPage]=useState('inicio');const [payload,setPayload]=useState<string>();
 useEffect(()=>{const sync=()=>{const hash=location.hash.replace('#/','');if(hash){const [p,param]=hash.split('?item=');setPage(p);setPayload(param)}};sync();addEventListener('hashchange',sync);return()=>removeEventListener('hashchange',sync)},[]);
 const rawNavigate=(target:string,data?:string)=>{setPage(target);setPayload(data);location.hash=`/${target}${data?`?item=${encodeURIComponent(data)}`:''}`;window.scrollTo({top:0,behavior:'smooth'})};
 const navigate=(target:string,data?:string)=>{if((target==='meus-agendamentos'||target==='perfil')&&!user){notify('Entre na sua conta para acessar esta área.');rawNavigate('login',target);return}rawNavigate(target,data)};
 const exitTeam=async()=>{await logout();rawNavigate('inicio')};
 if(loading)return <div className="app-loading"><span>Á</span><p>Preparando sua experiência...</p></div>;
 if(page==='login'||(!user&&(page==='meus-agendamentos'||page==='perfil')))return <><LoginView navigate={rawNavigate} returnTo={payload||page}/>{toast&&<div className="toast" role="status">✓ {toast}</div>}</>;
 if(page==='cadastro')return <RegisterView navigate={rawNavigate}/>;
 if(user&&(user.role==='admin'||user.role==='professional'))return <><AdminShell page={page} onNavigate={rawNavigate} onExit={exitTeam} user={user}>{page==='dashboard'&&<DashboardView navigate={rawNavigate}/>} {page==='agenda'&&<AgendaView/>}{page==='agendamentos'&&<AppointmentsAdmin/>}{user.role==='admin'&&page==='clientes'&&<ClientsAdmin/>}{user.role==='admin'&&page==='profissionais-admin'&&<ProfessionalsAdmin/>}{user.role==='admin'&&page==='servicos-admin'&&<ServicesAdmin/>}{user.role==='admin'&&page==='configuracoes'&&<SettingsAdmin/>}{page==='novo-agendamento'&&<ManualBooking/>}</AdminShell>{toast&&<div className="toast" role="status">✓ {toast}</div>}</>;
 return <><ClientShell page={page} onNavigate={navigate}>{page==='inicio'&&<ClientHome navigate={navigate}/>} {page==='servicos'&&<ServicesView navigate={navigate} initialCategory={payload}/>} {page==='profissionais'&&<ProfessionalsView navigate={navigate}/>} {page==='agendar'&&<BookingView navigate={navigate} initial={payload}/>} {page==='meus-agendamentos'&&user&&<MyAppointments navigate={navigate}/>} {page==='perfil'&&user&&<ProfileView/>}<button className="team-access" onClick={()=>rawNavigate('login','dashboard')}>Acesso da equipe</button></ClientShell>{toast&&<div className="toast" role="status">✓ {toast}</div>}</>;
}

export default function Home(){return <AuthProvider><SalonProvider><App/></SalonProvider></AuthProvider>}
