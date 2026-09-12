import type {FastifyInstance} from 'fastify';
import {Prisma,type PrismaClient} from '@prisma/client';
import {z} from 'zod';
import {filtersSchema,dubaiDate,summarize,statusValues} from '../../../packages/shared/src/index.js';
import {authTools} from './auth.js';
import {attendanceInclude} from './attendance.js';
import type {Env} from './env.js';
import {ApiError} from './errors.js';
export async function historyRoutes(app:FastifyInstance,db:PrismaClient,env:Env){const {requireAdmin}=authTools(db,env);
 async function history(query:unknown,agentId?:string){const f=filtersSchema.parse(query);const from=f.date??f.from??dubaiDate().slice(0,7)+'-01',to=f.date??f.to??dubaiDate();if(from>to)throw new ApiError(400,'INVALID_RANGE','Start date must be before end date.');const where:Prisma.DailyAttendanceWhereInput={attendanceDate:{gte:new Date(from),lte:new Date(to)},...(agentId||f.agentId?{agentId:agentId??f.agentId}:{}),...(f.teamId?{teamId:f.teamId}:{}),...(f.leaderId?{leaderIdSnapshot:f.leaderId}:{}),...(f.status?{currentStatus:f.status}:{}),...(f.search?{agent:{fullName:{contains:f.search,mode:'insensitive'}}}:{})};const [rows,total,groups]=await db.$transaction([db.dailyAttendance.findMany({where,include:attendanceInclude,orderBy:[{attendanceDate:'desc'},{agent:{fullName:'asc'}}],skip:(f.page-1)*f.pageSize,take:f.pageSize}),db.dailyAttendance.count({where}),db.dailyAttendance.groupBy({by:['currentStatus'],orderBy:{currentStatus:'asc'},where,_count:{_all:true}})]);const summary=summarize([]);for(const g of z.array(z.object({currentStatus:z.enum(statusValues),_count:z.object({_all:z.number()})})).parse(groups)){summary.counts[g.currentStatus]=g._count._all;summary.total+=g._count._all;}summary.updated=summary.total-summary.counts.NOT_UPDATED;summary.working=summary.counts.PRESENT_OFFICE+summary.counts.VIEWING+summary.counts.MEETING+summary.counts.DEVELOPER_OFFICE+summary.counts.TRUCHECK;return {rows,total,page:f.page,pageSize:f.pageSize,summary,from,to};}
 app.get('/api/admin/history',{preHandler:requireAdmin},async req=>history(req.query));
 app.get('/api/admin/agents/:id/history',{preHandler:requireAdmin},async req=>history(req.query,z.object({id:z.uuid()}).parse(req.params).id));
 app.get('/api/admin/agents/:id/history/:date',{preHandler:requireAdmin},async req=>{const {id,date}=z.object({id:z.uuid(),date:z.iso.date()}).parse(req.params);return db.attendanceHistory.findMany({where:{agentId:id,attendanceDate:new Date(date)},include:{changedBy:{select:{id:true,fullName:true}}},orderBy:{changedAt:'asc'}});});
}
