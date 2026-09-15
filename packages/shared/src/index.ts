import {z} from 'zod';
export type AttendanceStatus=string;
export type UserRole='ADMIN'|'TEAM_LEADER';
export type StatusRole='WORKING'|'ABSENT'|'SICK'|'LEAVE'|'PENDING'|'CUSTOM';
export const statusColors=['green','blue','purple','orange','teal','red','amber','gold','gray'] as const;
export const statusIcons=['Building2','Car','Users','Building','BadgeCheck','UserX','HeartPulse','Sun','Clock3','Briefcase','Home','Plane','Coffee','GraduationCap','Phone','Laptop','MapPin','Bed','Umbrella','Stethoscope','CalendarOff'] as const;
export interface StatusDto{key:string;label:string;color:string;icon:string;role:StatusRole;sortOrder:number;active:boolean}
export const newStatusSchema=z.object({label:z.string().trim().min(1,'Required').max(60),color:z.enum(statusColors),icon:z.enum(statusIcons)});
export const editStatusSchema=z.object({label:z.string().trim().min(1,'Required').max(60),color:z.enum(statusColors),icon:z.enum(statusIcons),active:z.boolean()});
export function dubaiDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dateLabel(date:string){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(date.slice(0,10)+'T12:00:00+04:00'));}
export function timeLabel(value:string|null){return value?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(value)):'—';}
export function isOverdue(deadline:string,now=new Date()){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)>=deadline;}
export function summarizeCounts(counts:Record<string,number>,statuses:StatusDto[]){const byRole=(role:StatusRole)=>statuses.filter(s=>s.role===role).reduce((n,s)=>n+(counts[s.key]??0),0);const total=Object.values(counts).reduce((a,b)=>a+b,0),notUpdated=byRole('PENDING'),updated=total-notUpdated;return {total,updated,percent:total?Math.round(updated/total*100):0,counts,working:byRole('WORKING'),absent:byRole('ABSENT'),sick:byRole('SICK'),leave:byRole('LEAVE'),notUpdated};}
export function summarize(rows:{currentStatus:string}[],statuses:StatusDto[]){const counts:Record<string,number>={};for(const s of statuses)counts[s.key]=0;rows.forEach(r=>{counts[r.currentStatus]=(counts[r.currentStatus]??0)+1;});return summarizeCounts(counts,statuses);}
const name=z.string().trim().min(1,'Required').max(120);
const url=z.union([z.literal(''),z.url().max(1000).refine(v=>v.startsWith('https://'),'Use an HTTPS URL')]).nullable();
const avatarPath=z.union([z.literal(''),z.url().max(1000).refine(v=>v.startsWith('https://'),'Use an HTTPS URL'),z.string().regex(/^\/uploads\/avatars\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/,'Invalid avatar')]).nullable();
export const loginSchema=z.object({email:z.email().transform(s=>s.toLowerCase()),password:z.string().min(1).max(128)});
export const passwordSchema=z.string().min(12,'Use at least 12 characters').max(72,'Use at most 72 characters').refine(s=>new TextEncoder().encode(s).length<=72,'Password must be at most 72 bytes');
export const attendanceSchema=z.object({status:z.string().trim().min(1).max(60),date:z.iso.date().optional()}).strict();
const agentEmail=z.union([z.literal(''),z.email().transform(s=>s.toLowerCase())]).nullable();
export const agentSchema=z.object({fullName:name,jobTitle:name,teamId:z.uuid().nullable(),employeeCode:z.string().trim().max(80).nullable(),email:agentEmail,avatarUrl:avatarPath,active:z.boolean()});
export const teamSchema=z.object({name,teamLeaderId:z.uuid().nullable(),active:z.boolean()});
export const userSchema=z.object({fullName:name,email:z.email().transform(s=>s.toLowerCase()),role:z.enum(['ADMIN','TEAM_LEADER']),active:z.boolean(),phone:z.string().max(40).nullable(),avatarUrl:avatarPath});
export const createUserSchema=userSchema.extend({password:passwordSchema});
export const settingsSchema=z.object({companyName:name,attendanceDeadline:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),logoUrl:url});
export const statusRoles=['WORKING','ABSENT','SICK','LEAVE','PENDING','CUSTOM'] as const;
export const filtersSchema=z.object({date:z.iso.date().optional(),from:z.iso.date().optional(),to:z.iso.date().optional(),teamId:z.uuid().optional(),leaderId:z.uuid().optional(),agentId:z.uuid().optional(),status:z.string().max(60).optional(),role:z.enum(statusRoles).optional(),search:z.string().max(120).optional(),page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(30)});
export const dashboardRangeSchema=z.object({from:z.iso.date().optional(),to:z.iso.date().optional()});
export interface UserDto{id:string;fullName:string;email:string;role:UserRole;active:boolean;phone:string|null;avatarUrl:string|null;lastLoginAt:string|null}
export interface TeamDto{id:string;name:string;teamLeaderId:string|null;active:boolean;teamLeader:UserDto|null;_count?:{agents:number}}
export interface AgentDto{id:string;fullName:string;jobTitle:string;teamId:string|null;employeeCode:string|null;email:string|null;avatarUrl:string|null;active:boolean;team:TeamDto|null}
export interface AttendanceDto{id:string;agentId:string;agent:AgentDto;attendanceDate:string;currentStatus:AttendanceStatus;lastUpdatedAt:string|null;lastUpdatedBy:Pick<UserDto,'id'|'fullName'>|null;team:TeamDto|null;leaderName?:string|null}
export interface HistoryDto{id:string;agentId:string;attendanceDate:string;previousStatus:AttendanceStatus|null;newStatus:AttendanceStatus;changedAt:string;changedBy:Pick<UserDto,'id'|'fullName'>}
export interface SettingsDto{companyName:string;timezone:string;attendanceDeadline:string;logoUrl:string|null}
export interface CompletionDto{team:TeamDto;total:number;updated:number;percent:number;firstUpdate:string|null;latestUpdate:string|null;completedAt:string|null;overdue:boolean}
export interface AttendanceResult{date:string;rows:AttendanceDto[];total:number;page:number;pageSize:number}
export interface DashboardDto{date:string;from:string;to:string;singleDay:boolean;summary:ReturnType<typeof summarize>;completion:CompletionDto[];settings:SettingsDto;statuses:StatusDto[]}
export function csvCell(value:string){const safe=/^[=+\-@\t\r]/.test(value)?`'${value}`:value;return `"${safe.replaceAll('"','""')}"`;}
