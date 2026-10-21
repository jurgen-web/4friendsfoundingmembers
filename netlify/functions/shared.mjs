import postgres from 'postgres';
let client;
export function db(){ const url=process.env.DATABASE_URL||process.env.NETLIFY_DB_URL;if(!url)throw Error('Database ontbreekt');return client ||= postgres(url,{max:1,prepare:false,connect_timeout:10,idle_timeout:20}); }
export function setup(){
 const key=process.env.MOLLIE_API_KEY, mode=key?.startsWith('test_')?'test':key?.startsWith('live_')?'live':null;
 const origin=new URL(process.env.SITE_URL||process.env.URL||'https://invalid.invalid').origin;
 if(!mode || origin==='https://invalid.invalid' || (mode==='live' && process.env.SALES_ENABLED!=='true'))throw Error('Betalingen zijn nog niet vrijgegeven');
 return {key,mode,origin};
}
export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function mollie(path,options={}){
 const {key}=setup();const r=await fetch('https://api.mollie.com/v2/'+path,{...options,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('Mollie verzoek mislukt');return r.json();
}
export async function lock(sql,mode){await sql`SELECT pg_advisory_xact_lock(hashtext(${`4friends-${mode}`}))`;}
