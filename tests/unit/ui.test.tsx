import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
import {Progress,StatusSelector} from '../../apps/web/src/components/ui';
import type {StatusDto} from '../../packages/shared/src/index';
afterEach(cleanup);
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
it('announces completion accessibly',()=>{render(<Progress updated={8} total={10}/>);expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','80');});
it('opens all eight statuses and saves on one selection',()=>{const select=vi.fn();render(<StatusSelector name="Sara Askari" statuses={statuses} statusKey="NOT_UPDATED" onSelect={select}/>);fireEvent.click(screen.getByRole('button',{name:'Change status for Sara Askari'}));expect(screen.getByRole('dialog')).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Viewing'}));expect(select).toHaveBeenCalledWith('VIEWING');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();});
