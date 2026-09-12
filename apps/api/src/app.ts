import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import multipart from '@fastify/multipart';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {Server} from 'socket.io';
import {Prisma,type PrismaClient} from '@prisma/client';
import {ZodError} from 'zod';
import type {Env} from './env.js';
import {ApiError} from './errors.js';
import {authRoutes,authTools,cookieName} from './auth.js';
import {attendanceRoutes} from './attendance.js';
import {managementRoutes} from './management.js';
import {historyRoutes} from './history.js';
import {allowedOrigins} from './origins.js';
export async function buildApp(db:PrismaClient,env:Env){const origins=allowedOrigins(env);const app=Fastify({logger:env.NODE_ENV!=='test'?{redact:['req.headers.cookie','req.headers.authorization','res.headers["set-cookie"]'],serializers:{req:r=>({method:r.method,url:r.url?.split('?')[0]})}}:false,bodyLimit:32768});
 await app.register(cookie);await app.register(cors,{origin:origins,credentials:true});await app.register(helmet,{contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'https:','data:'],connectSrc:["'self'"],objectSrc:["'none'"],frameAncestors:["'none'"]}}});await app.register(rateLimit,{max:300,timeWindow:'1 minute'});await app.register(multipart,{throwFileSizeLimit:false,limits:{fileSize:3*1024*1024,files:1,fields:0}});
 app.addHook('onRequest',async(req,reply)=>{if(req.url.startsWith('/api'))reply.header('Cache-Control','no-store');if(!['GET','HEAD','OPTIONS'].includes(req.method)&&!origins.includes(req.headers.origin??''))throw new ApiError(403,'CSRF_BLOCKED','Request origin is not allowed.');});
 app.setErrorHandler((error,req,reply)=>{if(error instanceof ZodError)return reply.code(400).send({error:{code:'VALIDATION',message:error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')}});if(error instanceof ApiError)return reply.code(error.statusCode).send({error:{code:error.code,message:error.message}});if(error instanceof Prisma.PrismaClientKnownRequestError){if(error.code==='P2002')return reply.code(409).send({error:{code:'CONFLICT',message:'That value is already in use.'}});if(error.code==='P2025')return reply.code(404).send({error:{code:'NOT_FOUND',message:'The record was not found.'}});if(error.code==='P2003')return reply.code(400).send({error:{code:'INVALID_REFERENCE',message:'That status no longer exists. Refresh and try again.'}});}const status=(error as {statusCode?:number}).statusCode;if(status&&status<500)return reply.code(status).send({error:{code:'REQUEST_ERROR',message:status===429?'Too many requests. Please try again later.':'Invalid request.'}});req.log.error({err:error},'Request failed');return reply.code(500).send({error:{code:'INTERNAL',message:'Unable to complete the request. Please try again.'}});});
 const auth=authTools(db,env);const io=new Server(app.server,{cors:{origin:origins,credentials:true},allowRequest:(req,done)=>done(null,req.headers.origin===undefined||origins.includes(req.headers.origin))});
 io.use(async(socket,next)=>{try{const token=app.parseCookie(socket.handshake.headers.cookie??'')[cookieName(env)];const session=await auth.session(token);if(!session||session.user.role!=='ADMIN')return next(new Error('Unauthorized'));socket.data.token=token;next();}catch{next(new Error('Unauthorized'));}});
 async function broadcast(){for(const socket of io.sockets.sockets.values()){try{const session=await auth.session(socket.data.token as string);if(session?.user.role==='ADMIN')socket.emit('attendance:changed');else socket.disconnect(true);}catch{socket.disconnect(true);}}}
 await authRoutes(app,db,env);await attendanceRoutes(app,db,env,broadcast);await managementRoutes(app,db,env,broadcast);await historyRoutes(app,db,env);
 app.get('/api/health',async()=>{await db.$queryRaw`SELECT 1`;return {ok:true};});
 const uploadsRoot=resolve('uploads');await mkdir(uploadsRoot+'/avatars',{recursive:true});await app.register(staticFiles,{root:uploadsRoot,prefix:'/uploads/',decorateReply:false,cacheControl:true,maxAge:'7d',index:false});
 const root=resolve('apps/web/dist');if(existsSync(root)){await app.register(staticFiles,{root});app.setNotFoundHandler((req,reply)=>{if(req.url.startsWith('/api/'))return reply.code(404).send({error:{code:'NOT_FOUND',message:'Endpoint not found.'}});return reply.sendFile('index.html',{cacheControl:false});});}
 app.addHook('onClose',async()=>{io.disconnectSockets(true);await new Promise<void>(resolve=>io.close(()=>resolve()));});return app;
}
