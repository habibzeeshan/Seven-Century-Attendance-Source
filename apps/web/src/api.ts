import {QueryClient,useQuery} from '@tanstack/react-query';
import type {UserDto} from '../../../packages/shared/src/index';
export class ApiError extends Error{constructor(message:string,public status:number){super(message);}}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{const response=await fetch('/api'+path,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new ApiError(data.error?.message??'Unable to connect. Please try again.',response.status);return data as T;}
export const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:15000,retry:(count,error)=>!(error instanceof ApiError&&[401,403].includes(error.status))&&count<1,refetchOnWindowFocus:true}}});
export function useAuth(){return useQuery({queryKey:['auth'],queryFn:()=>api<{user:UserDto}>('/auth/me'),retry:false});}
export function json(method:string,data:unknown):RequestInit{return {method,body:JSON.stringify(data)};}
