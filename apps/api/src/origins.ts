import {z} from 'zod';
import type {Env} from './env.js';
export function allowedOrigins(env:Env):string[]{
 const origins=[env.WEB_URL];
 // Explicit, development-only LAN origin; production remains single-origin.
 if(env.NODE_ENV==='development'&&process.env.MOBILE_PREVIEW_ORIGIN){
  const url=new URL(z.url().parse(process.env.MOBILE_PREVIEW_ORIGIN));
  if(url.pathname!=='/'||url.search||url.hash)throw new Error('Mobile preview must be an origin only');
  origins.push(url.origin);
 }
 return origins;
}
