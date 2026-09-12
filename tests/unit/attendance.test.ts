import {describe,it,expect} from 'vitest';
import {dubaiDate,summarize,isOverdue,attendanceSchema,csvCell,type StatusDto} from '../../packages/shared/src/index';
const statuses:StatusDto[]=[
 {key:'NOT_UPDATED',label:'Not Updated',color:'gray',icon:'Clock3',role:'PENDING',sortOrder:0,active:true},
 {key:'PRESENT_OFFICE',label:'Present / Office',color:'green',icon:'Building2',role:'WORKING',sortOrder:1,active:true},
 {key:'VIEWING',label:'Viewing',color:'blue',icon:'Car',role:'WORKING',sortOrder:2,active:true},
 {key:'MEETING',label:'Meeting',color:'purple',icon:'Users',role:'WORKING',sortOrder:3,active:true},
 {key:'DEVELOPER_OFFICE',label:'Developer Office',color:'orange',icon:'Building',role:'WORKING',sortOrder:4,active:true},
 {key:'TRUCHECK',label:'TruCheck',color:'teal',icon:'BadgeCheck',role:'WORKING',sortOrder:5,active:true},
 {key:'ABSENT',label:'Absent',color:'red',icon:'UserX',role:'ABSENT',sortOrder:6,active:true},
 {key:'SICK',label:'Sick',color:'amber',icon:'HeartPulse',role:'SICK',sortOrder:7,active:true},
 {key:'LEAVE',label:'Leave',color:'gold',icon:'Sun',role:'LEAVE',sortOrder:8,active:true},
];
describe('Dubai attendance rules',()=>{
 it('rolls the business date at 20:00 UTC regardless of host timezone',()=>{expect(dubaiDate(new Date('2026-09-11T19:59:59Z'))).toBe('2026-09-11');expect(dubaiDate(new Date('2026-09-11T20:00:00Z'))).toBe('2026-09-12');});
 it('handles month and year boundaries',()=>{expect(dubaiDate(new Date('2026-12-31T20:00:00Z'))).toBe('2027-01-01');});
 it('starts pending and progresses to complete',()=>{expect(summarize([{currentStatus:'NOT_UPDATED'}],statuses).percent).toBe(0);expect(summarize([{currentStatus:'VIEWING'},{currentStatus:'NOT_UPDATED'}],statuses).percent).toBe(50);expect(summarize([{currentStatus:'VIEWING'},{currentStatus:'SICK'}],statuses).percent).toBe(100);expect(summarize([],statuses).percent).toBe(0);});
 it('classifies all five working statuses and separates sick/leave/absent',()=>{const result=summarize(statuses.map(({key:currentStatus})=>({currentStatus})),statuses);expect(result.working).toBe(5);expect(result.total).toBe(9);expect(result.sick).toBe(1);expect(result.leave).toBe(1);expect(result.absent).toBe(1);});
 it('marks overdue at Dubai deadline without restricting status validation',()=>{expect(isOverdue('10:00',new Date('2026-09-12T05:59:00Z'))).toBe(false);expect(isOverdue('10:00',new Date('2026-09-12T06:00:00Z'))).toBe(true);expect(attendanceSchema.safeParse({status:'VIEWING'}).success).toBe(true);});
 it('rejects forged audit actors; unknown status keys are rejected by the database, not this schema',()=>{expect(attendanceSchema.safeParse({status:'VIEWING',changedById:'someone'}).success).toBe(false);expect(attendanceSchema.safeParse({status:'HOLIDAY'}).success).toBe(true);expect(attendanceSchema.safeParse({status:''}).success).toBe(false);});
 it('quotes CSV and neutralizes spreadsheet formulas',()=>{expect(csvCell('=1+1')).toBe('"\'=1+1"');expect(csvCell('A"B')).toBe('"A""B"');});
});
