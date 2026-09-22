export class ApiError extends Error {
  status:number;
  constructor(message:string,status:number){super(message);this.status=status}
}

export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(`/api${path}`,{
    ...options,
    credentials:"include",
    headers:{"Content-Type":"application/json",...options.headers},
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new ApiError(data.message||"Não foi possível concluir a solicitação.",response.status);
  return data as T;
}
