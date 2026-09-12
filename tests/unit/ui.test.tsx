import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
import {Progress,StatusSelector} from '../../apps/web/src/components/ui';
afterEach(cleanup);
it('announces completion accessibly',()=>{render(<Progress updated={8} total={10}/>);expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','80');});
it('opens all eight statuses and saves on one selection',()=>{const select=vi.fn();render(<StatusSelector name="Sara Askari" status="NOT_UPDATED" onSelect={select}/>);fireEvent.click(screen.getByRole('button',{name:'Change status for Sara Askari'}));expect(screen.getByRole('dialog')).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Viewing'}));expect(select).toHaveBeenCalledWith('VIEWING');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();});
