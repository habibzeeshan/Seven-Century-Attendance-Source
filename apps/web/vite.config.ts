import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({root:'apps/web',plugins:[react(),tailwindcss(),VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg','icons/*.png'],manifest:{name:'Seven Century Attendance',short_name:'SC Attendance',display:'standalone',start_url:'/',theme_color:'#080808',background_color:'#ffffff',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},workbox:{navigateFallbackDenylist:[/^\/api/,/^\/socket.io/],globPatterns:['**/*.{js,css,html,png,svg,woff2}'],runtimeCaching:[]}})],server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':'http://127.0.0.1:3001','/uploads':'http://127.0.0.1:3001','/socket.io':{target:'http://127.0.0.1:3001',ws:true}}},build:{outDir:'dist',sourcemap:false}});
