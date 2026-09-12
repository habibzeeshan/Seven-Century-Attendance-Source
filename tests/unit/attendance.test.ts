import {describe,it,expect} from 'vitest';
import {dubaiDate,summarize,isOverdue,statusValues,statusConfig,attendanceSchema,csvCell} from '../../packages/shared/src/index';
describe('Dubai attendance rules',()=>{
 it('rolls the business date at 20:00 UTC regardless of host timezone',()=>{expect(dubaiDate(new Date('2026-09-11T19:59:59Z'))).toBe('2026-09-11');expect(dubaiDate(new Date('2026-09-11T20:00:00Z'))).toBe('2026-09-12');});
 it('handles month and year boundaries',()=>{expect(dubaiDate(new Date('2026-12-31T20:00:00Z'))).toBe('2027-01-01');});
 it('starts pending and progresses to complete',()=>{expect(summarize([{currentStatus:'NOT_UPDATED'}]).percent).toBe(0);expect(summarize([{currentStatus:'VIEWING'},{currentStatus:'NOT_UPDATED'}]).percent).toBe(50);expect(summarize([{currentStatus:'VIEWING'},{currentStatus:'SICK'}]).percent).toBe(100);expect(summarize([]).percent).toBe(0);});
 it('classifies all five working statuses and excludes away',()=>{const result=summarize(statusValues.map(currentStatus=>({currentStatus})));expect(result.working).toBe(5);expect(result.total).toBe(9);expect(statusConfig.SICK.category).toBe('away');});
 it('marks overdue at Dubai deadline without restricting status validation',()=>{expect(isOverdue('10:00',new Date('2026-09-12T05:59:00Z'))).toBe(false);expect(isOverdue('10:00',new Date('2026-09-12T06:00:00Z'))).toBe(true);expect(attendanceSchema.safeParse({status:'VIEWING'}).success).toBe(true);});
 it('rejects forged audit actors and invalid statuses',()=>{expect(attendanceSchema.safeParse({status:'VIEWING',changedById:'someone'}).success).toBe(false);expect(attendanceSchema.safeParse({status:'HOLIDAY'}).success).toBe(false);});
 it('quotes CSV and neutralizes spreadsheet formulas',()=>{expect(csvCell('=1+1')).toBe('"\'=1+1"');expect(csvCell('A"B')).toBe('"A""B"');});
});
