import {QueryClient,useQuery} from '@tanstack/react-query';
import type {UserDto,StatusDto} from '../../../packages/shared/src/index';
export class ApiError extends Error{constructor(message:string,public status:number){super(message);}}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{const response=await fetch('/api'+path,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new ApiError(data.error?.message??'Unable to connect. Please try again.',response.status);return data as T;}
export const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:15000,retry:(count,error)=>!(error instanceof ApiError&&[401,403].includes(error.status))&&count<1,refetchOnWindowFocus:true}}});
export function useAuth(){return useQuery({queryKey:['auth'],queryFn:()=>api<{user:UserDto}>('/auth/me'),retry:false});}
export function useStatuses(){return useQuery({queryKey:['statuses'],queryFn:()=>api<StatusDto[]>('/statuses'),staleTime:60000});}
export function json(method:string,data:unknown):RequestInit{return {method,body:JSON.stringify(data)};}
export async function uploadFile<T>(path:string,file:File):Promise<T>{const body=new FormData();body.append('file',file);const response=await fetch('/api'+path,{method:'POST',credentials:'include',body});const data=await response.json().catch(()=>({}));if(!response.ok)throw new ApiError(data.error?.message??'Upload failed. Please try again.',response.status);return data as T;}
