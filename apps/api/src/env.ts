import 'dotenv/config';
import {z} from 'zod';
const schema=z.object({NODE_ENV:z.enum(['development','test','production']).default('development'),DATABASE_URL:z.string().startsWith('postgresql://').or(z.string().startsWith('postgres://')),WEB_URL:z.url(),API_URL:z.url().optional(),SESSION_SECRET:z.string().min(32),COOKIE_DOMAIN:z.string().optional(),PORT:z.coerce.number().default(3001),HOST:z.string().default('127.0.0.1'),SMTP_HOST:z.string().optional(),SMTP_PORT:z.coerce.number().default(587),SMTP_USER:z.string().optional(),SMTP_PASSWORD:z.string().optional(),SMTP_FROM:z.string().optional()});
export type Env=z.infer<typeof schema>;
export function readEnv(source=process.env):Env{const env=schema.parse(source);if(env.NODE_ENV==='production'&&(!env.WEB_URL.startsWith('https://')||env.SESSION_SECRET.startsWith('replace-')))throw new Error('Production requires HTTPS and a random SESSION_SECRET');return env;}
