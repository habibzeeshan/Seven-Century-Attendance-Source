import {Route,Routes,Navigate} from 'react-router-dom';
import Dashboard from './dashboard';
import Attendance from './attendance';
import Management from './management';
import History from './history';
export default function Admin(){return <Routes><Route path="dashboard" element={<Dashboard/>}/><Route path="attendance" element={<Attendance/>}/><Route path="teams" element={<Management kind="teams"/>}/><Route path="teams/:id" element={<Management kind="agents"/>}/><Route path="agents" element={<Management kind="agents"/>}/><Route path="users" element={<Management kind="users"/>}/><Route path="settings" element={<Management kind="settings"/>}/><Route path="history" element={<History/>}/><Route path="history/:agentId" element={<History/>}/><Route path="*" element={<Navigate to="dashboard" replace/>}/></Routes>;}
