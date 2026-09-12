import {z} from 'zod';
export const statusValues=['NOT_UPDATED','PRESENT_OFFICE','VIEWING','MEETING','DEVELOPER_OFFICE','TRUCHECK','ABSENT','SICK','LEAVE'] as const;
export type AttendanceStatus=typeof statusValues[number];
export type UserRole='ADMIN'|'TEAM_LEADER';
export const statusConfig:Record<AttendanceStatus,{label:string;category:'working'|'away'|'absent'|'pending';color:string;icon:string}>={
 NOT_UPDATED:{label:'Not Updated',category:'pending',color:'gray',icon:'Clock3'},
 PRESENT_OFFICE:{label:'Present / Office',category:'working',color:'green',icon:'Building2'},
 VIEWING:{label:'Viewing',category:'working',color:'blue',icon:'Car'},
 MEETING:{label:'Meeting',category:'working',color:'purple',icon:'Users'},
 DEVELOPER_OFFICE:{label:'Developer Office',category:'working',color:'orange',icon:'Building'},
 TRUCHECK:{label:'TruCheck',category:'working',color:'teal',icon:'BadgeCheck'},
 ABSENT:{label:'Absent',category:'absent',color:'red',icon:'UserX'},
 SICK:{label:'Sick',category:'away',color:'amber',icon:'HeartPulse'},
 LEAVE:{label:'Leave',category:'away',color:'gold',icon:'Sun'},
};
export function dubaiDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dateLabel(date:string){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(date.slice(0,10)+'T12:00:00+04:00'));}
export function timeLabel(value:string|null){return value?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(value)):'—';}
export function isOverdue(deadline:string,now=new Date()){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)>=deadline;}
export function summarize(rows:{currentStatus:AttendanceStatus}[]){const counts=Object.fromEntries(statusValues.map(s=>[s,0])) as Record<AttendanceStatus,number>;rows.forEach(r=>counts[r.currentStatus]++);const total=rows.length,updated=total-counts.NOT_UPDATED;return {total,updated,percent:total?Math.round(updated/total*100):0,counts,working:statusValues.filter(s=>statusConfig[s].category==='working').reduce((n,s)=>n+counts[s],0)};}
const name=z.string().trim().min(1,'Required').max(120);
const url=z.union([z.literal(''),z.url().max(1000).refine(v=>v.startsWith('https://'),'Use an HTTPS URL')]).nullable();
const avatarPath=z.union([z.literal(''),z.url().max(1000).refine(v=>v.startsWith('https://'),'Use an HTTPS URL'),z.string().regex(/^\/uploads\/avatars\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/,'Invalid avatar')]).nullable();
export const loginSchema=z.object({email:z.email().transform(s=>s.toLowerCase()),password:z.string().min(1).max(128)});
export const passwordSchema=z.string().min(12,'Use at least 12 characters').max(72,'Use at most 72 characters').refine(s=>new TextEncoder().encode(s).length<=72,'Password must be at most 72 bytes');
export const attendanceSchema=z.object({status:z.enum(statusValues),date:z.iso.date().optional()}).strict();
export const agentSchema=z.object({fullName:name,jobTitle:name,teamId:z.uuid().nullable(),employeeCode:z.string().trim().max(80).nullable(),avatarUrl:avatarPath,active:z.boolean()});
export const teamSchema=z.object({name,teamLeaderId:z.uuid().nullable(),active:z.boolean()});
export const userSchema=z.object({fullName:name,email:z.email().transform(s=>s.toLowerCase()),role:z.enum(['ADMIN','TEAM_LEADER']),active:z.boolean(),phone:z.string().max(40).nullable(),avatarUrl:avatarPath});
export const createUserSchema=userSchema.extend({password:passwordSchema});
export const settingsSchema=z.object({companyName:name,attendanceDeadline:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),logoUrl:url});
export const filtersSchema=z.object({date:z.iso.date().optional(),from:z.iso.date().optional(),to:z.iso.date().optional(),teamId:z.uuid().optional(),leaderId:z.uuid().optional(),agentId:z.uuid().optional(),status:z.enum(statusValues).optional(),search:z.string().max(120).optional(),page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(30)});
export interface UserDto{id:string;fullName:string;email:string;role:UserRole;active:boolean;phone:string|null;avatarUrl:string|null;lastLoginAt:string|null}
export interface TeamDto{id:string;name:string;teamLeaderId:string|null;active:boolean;teamLeader:UserDto|null;_count?:{agents:number}}
export interface AgentDto{id:string;fullName:string;jobTitle:string;teamId:string|null;employeeCode:string|null;avatarUrl:string|null;active:boolean;team:TeamDto|null}
export interface AttendanceDto{id:string;agentId:string;agent:AgentDto;attendanceDate:string;currentStatus:AttendanceStatus;lastUpdatedAt:string|null;lastUpdatedBy:Pick<UserDto,'id'|'fullName'>|null;team:TeamDto|null;leaderName?:string|null}
export interface HistoryDto{id:string;agentId:string;attendanceDate:string;previousStatus:AttendanceStatus|null;newStatus:AttendanceStatus;changedAt:string;changedBy:Pick<UserDto,'id'|'fullName'>}
export interface SettingsDto{companyName:string;timezone:string;attendanceDeadline:string;logoUrl:string|null}
export interface CompletionDto{team:TeamDto;total:number;updated:number;percent:number;firstUpdate:string|null;latestUpdate:string|null;completedAt:string|null;overdue:boolean}
export interface AttendanceResult{date:string;rows:AttendanceDto[];total:number;page:number;pageSize:number}
export interface DashboardDto{date:string;summary:ReturnType<typeof summarize>;completion:CompletionDto[];settings:SettingsDto}
export function csvCell(value:string){const safe=/^[=+\-@\t\r]/.test(value)?`'${value}`:value;return `"${safe.replaceAll('"','""')}"`;}
