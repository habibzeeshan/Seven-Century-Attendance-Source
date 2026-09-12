import 'dotenv/config';
import {z} from 'zod';
import bcrypt from 'bcryptjs';
import {createDb} from '../apps/api/src/db.js';
import {passwordSchema} from '../packages/shared/src/index.js';
const input=z.object({ADMIN_EMAIL:z.email().transform(v=>v.toLowerCase()),ADMIN_NAME:z.string().min(1).max(120),ADMIN_PASSWORD:passwordSchema,DATABASE_URL:z.string()}).parse(process.env);
const db=createDb(input.DATABASE_URL);try{if(await db.user.count())throw new Error('Bootstrap only runs on an empty database. Use the existing administrator account.');await db.$transaction([db.user.create({data:{fullName:input.ADMIN_NAME,email:input.ADMIN_EMAIL,passwordHash:await bcrypt.hash(input.ADMIN_PASSWORD,12),role:'ADMIN'}}),db.systemSettings.upsert({where:{id:1},create:{id:1},update:{}})]);console.log('Initial administrator created.');}finally{await db.$disconnect();}
