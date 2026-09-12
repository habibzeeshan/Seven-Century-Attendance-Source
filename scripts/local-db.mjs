import EmbeddedPostgres from 'embedded-postgres';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
const dir=resolve('.local/postgres');mkdirSync('.local',{recursive:true});
const credentialsPath=resolve('.local/db-credentials.json');
const credentials=existsSync(credentialsPath)?JSON.parse(readFileSync(credentialsPath,'utf8')):{user:'attendance',password:randomBytes(24).toString('hex')};
if(!existsSync(credentialsPath))writeFileSync(credentialsPath,JSON.stringify(credentials));
const pg=new EmbeddedPostgres({databaseDir:dir,user:credentials.user,password:credentials.password,port:55432,persistent:true,authMethod:'scram-sha-256',postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:message=>console.error(String(message))});
if(!existsSync(resolve(dir,'PG_VERSION')))await pg.initialise();
await pg.start();const client=pg.getPgClient('postgres','127.0.0.1');await client.connect();for(const name of ['attendance','attendance_test']){const result=await client.query('SELECT 1 FROM pg_database WHERE datname=$1',[name]);if(!result.rowCount)await client.query(`CREATE DATABASE "${name}"`);}await client.end();
if(!existsSync('.env')){const password=randomBytes(15).toString('base64url');writeFileSync('.env',`NODE_ENV=development\nDATABASE_URL=postgresql://${credentials.user}:${credentials.password}@127.0.0.1:55432/attendance\nTEST_DATABASE_URL=postgresql://${credentials.user}:${credentials.password}@127.0.0.1:55432/attendance_test\nWEB_URL=http://127.0.0.1:5173\nAPI_URL=http://127.0.0.1:3001\nPORT=3001\nHOST=127.0.0.1\nSESSION_SECRET=${randomBytes(40).toString('hex')}\nSEED_ALLOW=true\nDEMO_PASSWORD=${password}\n`);writeFileSync('.local/demo-access.txt',`Local development accounts only\nAdmin: admin@sevencentury.test\nTeam Leader: ahmed@sevencentury.test\nPassword: ${password}\n`);}
console.log('Workspace PostgreSQL is running on 127.0.0.1:55432.');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await pg.stop();process.exit(0);});
setInterval(()=>{},60000);
