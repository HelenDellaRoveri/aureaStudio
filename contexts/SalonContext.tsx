"use client";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { appointments as initialAppointments, professionals as initialProfessionals, services as initialServices } from "@/lib/data";
import { api } from "@/lib/api";
import { Appointment, Professional, ScheduleBlock, Service } from "@/lib/types";

type SalonContextValue = {
  services:Service[]; setServices:(v:Service[])=>void;
  professionals:Professional[]; setProfessionals:(v:Professional[])=>void;
  blocks:ScheduleBlock[]; setBlocks:(v:ScheduleBlock[])=>void;
  appointments:Appointment[]; setAppointments:(v:Appointment[])=>void;
  toast:string; notify:(message:string)=>void;
};
const SalonContext=createContext<SalonContextValue|null>(null);
const key="aurea-studio-v1";

export function SalonProvider({children}:{children:ReactNode}){
  const [services,setServices]=useState(initialServices);
  const [professionals,setProfessionals]=useState(initialProfessionals);
  const [blocks,setBlocks]=useState<ScheduleBlock[]>([]);
  const [appointments,setAppointments]=useState(initialAppointments);
  const [toast,setToast]=useState("");
  const [ready,setReady]=useState(false);
  useEffect(()=>{ try{const saved=localStorage.getItem(key); if(saved){const v=JSON.parse(saved); setServices(v.services||initialServices); setProfessionals(v.professionals||initialProfessionals);setBlocks(v.blocks||[]);setAppointments(v.appointments||initialAppointments);}}catch{}Promise.allSettled([api<{professionals:Professional[]}>("/professionals"),api<{blocks:ScheduleBlock[]}>("/blocks")]).then(([pros,resultBlocks])=>{if(pros.status==='fulfilled'&&pros.value.professionals.length)setProfessionals(pros.value.professionals);if(resultBlocks.status==='fulfilled')setBlocks(resultBlocks.value.blocks)}).finally(()=>setReady(true))},[]);
  useEffect(()=>{if(ready)localStorage.setItem(key,JSON.stringify({services,professionals,blocks,appointments}));},[ready,services,professionals,blocks,appointments]);
  const notify=(message:string)=>{setToast(message); window.setTimeout(()=>setToast(""),3200)};
  return <SalonContext.Provider value={{services,setServices,professionals,setProfessionals,blocks,setBlocks,appointments,setAppointments,toast,notify}}>{children}</SalonContext.Provider>;
}
export const useSalon=()=>{const v=useContext(SalonContext); if(!v)throw new Error("SalonProvider ausente"); return v};
