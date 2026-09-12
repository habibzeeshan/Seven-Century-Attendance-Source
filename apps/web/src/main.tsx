import React,{Suspense,lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Navigate,Outlet,Route,Routes} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {ApiError,queryClient,useAuth} from './api';
import Login from './pages/login';
import {Shell} from './components/shell';
import {ErrorBox,Loading} from './components/ui';
import Today from './pages/today';
import Profile from './pages/profile';
import './styles.css';
const Admin=lazy(()=>import('./pages/admin'));
function Protected({admin=false}:{admin?:boolean}){const auth=useAuth();if(auth.isPending)return <Loading/>;if(auth.error){if(auth.error instanceof ApiError&&auth.error.status===401)return <Navigate to="/login" replace/>;return <ErrorBox error={auth.error} retry={()=>auth.refetch()}/>;}if(admin&&auth.data!.user.role!=='ADMIN')return <Navigate to="/today" replace/>;return <Outlet/>;}
function Home(){const {data}=useAuth();return <Navigate to={data!.user.role==='ADMIN'?'/admin/dashboard':'/today'} replace/>;}
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><Suspense fallback={<Loading/>}><Routes><Route path="/login" element={<Login/>}/><Route path="/forgot-password" element={<Login mode="forgot"/>}/><Route path="/reset-password" element={<Login mode="reset"/>}/><Route element={<Protected/>}><Route element={<Shell/>}><Route index element={<Home/>}/><Route path="today" element={<Today/>}/><Route path="team" element={<Today teamView/>}/><Route path="profile" element={<Profile/>}/><Route element={<Protected admin/>}><Route path="admin/*" element={<Admin/>}/></Route></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense></BrowserRouter></QueryClientProvider></React.StrictMode>);
