"use client";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuthUser, Role } from "@/lib/types";

type RegisterData={name:string;phone:string;email:string;password:string};
type AuthContextValue={
  user:AuthUser|null; loading:boolean;
  login:(email:string,password:string,role:Role)=>Promise<AuthUser>;
  register:(data:RegisterData)=>Promise<AuthUser>;
  logout:()=>Promise<void>;
};
const AuthContext=createContext<AuthContextValue|null>(null);

export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<AuthUser|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{api<{user:AuthUser}>("/auth/me").then(r=>setUser(r.user)).catch(()=>setUser(null)).finally(()=>setLoading(false))},[]);
 const login=async(email:string,password:string,role:Role)=>{const r=await api<{user:AuthUser}>("/auth/login",{method:"POST",body:JSON.stringify({email,password,role})});setUser(r.user);return r.user};
 const register=async(data:RegisterData)=>{const r=await api<{user:AuthUser}>("/auth/register",{method:"POST",body:JSON.stringify(data)});setUser(r.user);return r.user};
 const logout=async()=>{await api("/auth/logout",{method:"POST"});setUser(null)};
 return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>{const value=useContext(AuthContext);if(!value)throw new Error("AuthProvider ausente");return value};
