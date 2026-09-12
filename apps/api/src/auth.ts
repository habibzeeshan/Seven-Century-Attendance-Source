import {createHmac,randomBytes} from 'node:crypto';
import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import type {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import {z} from 'zod';
import {loginSchema,passwordSchema,type UserDto} from '../../../packages/shared/src/index.js';
import type {Env} from './env.js';
import {ApiError} from './errors.js';
export const userSelect={id:true,fullName:true,email:true,role:true,active:true,phone:true,avatarUrl:true,lastLoginAt:true} as const;
declare module 'fastify' {interface FastifyRequest{user:UserDto;sessionId:string}}
export function tokenHash(token:string,env:Env){return createHmac('sha256',env.SESSION_SECRET).update(token).digest('hex');}
export function cookieName(env:Env){return env.NODE_ENV==='production'&&!env.COOKIE_DOMAIN?'__Host-sc_session':'sc_session';}
export function authTools(db:PrismaClient,env:Env){
 async function session(token:string|undefined){if(!token||token.length>200)return null;return db.session.findFirst({where:{id:tokenHash(token,env),expiresAt:{gt:new Date()},user:{active:true}},include:{user:{select:userSelect}}});}
 async function requireAuth(req:FastifyRequest){const found=await session(req.cookies[cookieName(env)]);if(!found)throw new ApiError(401,'UNAUTHORIZED','Your session has expired. Please sign in again.');req.user={...found.user,lastLoginAt:found.user.lastLoginAt?.toISOString()??null};req.sessionId=found.id;}
 async function requireAdmin(req:FastifyRequest){await requireAuth(req);if(req.user.role!=='ADMIN')throw new ApiError(403,'FORBIDDEN','You do not have permission to access this resource.');}
 async function requireTeamLeader(req:FastifyRequest){await requireAuth(req);if(req.user.role!=='TEAM_LEADER')throw new ApiError(403,'FORBIDDEN','Team Leader access required.');}
 return {session,requireAuth,requireAdmin,requireTeamLeader};
}
export async function authRoutes(app:FastifyInstance,db:PrismaClient,env:Env){const auth=authTools(db,env);const cookie={httpOnly:true,secure:env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',...(env.COOKIE_DOMAIN?{domain:env.COOKIE_DOMAIN}:{})};
 const dummyHash=await bcrypt.hash(randomBytes(32).toString('hex'),12);
 app.post('/api/auth/login',{config:{rateLimit:{max:10,timeWindow:'15 minutes'}}},async(req,reply)=>{const input=loginSchema.parse(req.body);const user=await db.user.findUnique({where:{email:input.email}});const valid=await bcrypt.compare(input.password,user?.passwordHash??dummyHash);if(!valid||!user?.active)throw new ApiError(401,'INVALID_LOGIN','Email or password is incorrect.');const token=randomBytes(32).toString('base64url');const expiresAt=new Date(Date.now()+12*60*60*1000);await db.$transaction([db.session.create({data:{id:tokenHash(token,env),userId:user.id,expiresAt}}),db.user.update({where:{id:user.id},data:{lastLoginAt:new Date()}})]);reply.setCookie(cookieName(env),token,{...cookie,expires:expiresAt});return {ok:true};});
 app.get('/api/auth/me',{preHandler:auth.requireAuth},async req=>({user:req.user}));
 app.post('/api/auth/logout',async(req,reply)=>{const token=req.cookies[cookieName(env)];if(token)await db.session.deleteMany({where:{id:tokenHash(token,env)}});reply.clearCookie(cookieName(env),cookie);return {ok:true};});
 app.post('/api/auth/forgot-password',{config:{rateLimit:{max:5,timeWindow:'15 minutes'}}},async req=>{const {email}=z.object({email:z.email().transform(v=>v.toLowerCase())}).parse(req.body);const user=await db.user.findUnique({where:{email},select:{id:true,active:true,email:true}});if(user?.active&&env.SMTP_HOST&&env.SMTP_FROM){const token=randomBytes(32).toString('base64url');await db.$transaction([db.passwordReset.deleteMany({where:{userId:user.id}}),db.passwordReset.create({data:{id:tokenHash(token,env),userId:user.id,expiresAt:new Date(Date.now()+30*60*1000)}})]);try{await nodemailer.createTransport({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:env.SMTP_PORT===465,auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASSWORD}:undefined}).sendMail({from:env.SMTP_FROM,to:user.email,subject:'Reset your Seven Century password',text:`Reset your password within 30 minutes: ${env.WEB_URL}/reset-password?token=${encodeURIComponent(token)}\nIf you did not request this, ignore this email.`});}catch{app.log.error('Password reset delivery failed');}}return {message:'If an active account exists, a reset link will be sent.'};});
 app.post('/api/auth/reset-password',{config:{rateLimit:{max:10,timeWindow:'15 minutes'}}},async req=>{const {token,password}=z.object({token:z.string().min(20).max(200),password:passwordSchema}).parse(req.body);const hash=await bcrypt.hash(password,12);await db.$transaction(async tx=>{const id=tokenHash(token,env);const reset=await tx.passwordReset.findUnique({where:{id},include:{user:true}});if(!reset||reset.expiresAt<new Date()||!reset.user.active)throw new ApiError(400,'INVALID_TOKEN','This reset link is invalid or expired.');const removed=await tx.passwordReset.deleteMany({where:{id}});if(removed.count!==1)throw new ApiError(400,'INVALID_TOKEN','This reset link has already been used.');await tx.user.update({where:{id:reset.userId},data:{passwordHash:hash}});await tx.session.deleteMany({where:{userId:reset.userId}});});return {ok:true};});
}
export function clearSession(reply:FastifyReply,env:Env){reply.clearCookie(cookieName(env),{path:'/',...(env.COOKIE_DOMAIN?{domain:env.COOKIE_DOMAIN}:{})});}
