import {readEnv} from './env.js';
import {createDb} from './db.js';
import {buildApp} from './app.js';
const env=readEnv(),db=createDb(env.DATABASE_URL);await db.$connect();const app=await buildApp(db,env);await app.listen({host:env.HOST,port:env.PORT});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();await db.$disconnect();process.exit(0);});
