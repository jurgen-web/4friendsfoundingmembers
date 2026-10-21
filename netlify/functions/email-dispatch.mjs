import {db} from './shared.mjs';
export const config={schedule:'* * * * *'};
export default async function(){
 if(!process.env.RESEND_API_KEY){console.error('RESEND_API_KEY ontbreekt');return;}
 const sql=db();
 // Limit the run to two messages: at most 16 seconds of HTTP time.
 for(let i=0;i<2;i++){
 const claimed=await sql.begin(async tx=>{
 const [m]=await tx`SELECT * FROM fm_email_outbox WHERE sent_at IS NULL AND next_attempt_at<=now() AND (first_attempt_at IS NULL OR first_attempt_at>now()-interval '20 hours') ORDER BY created_at,kind FOR UPDATE SKIP LOCKED LIMIT 1`;
 if(!m)return null;
 const [updated]=await tx`UPDATE fm_email_outbox SET first_attempt_at=coalesce(first_attempt_at,now()), next_attempt_at=now()+interval '2 minutes',attempts=attempts+1 WHERE order_id=${m.order_id} AND kind=${m.kind} RETURNING *`;
 return updated;
 });
 if(!claimed)break;
 try{
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`fm-${claimed.order_id}-${claimed.kind}-v1`},body:JSON.stringify(claimed.payload),signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error(`Resend HTTP ${r.status}`);
 const result=await r.json();if(!result.id)throw Error('Resend gaf geen bericht-ID');
 await sql`UPDATE fm_email_outbox SET sent_at=now(),resend_id=${result.id},last_error=NULL WHERE order_id=${claimed.order_id} AND kind=${claimed.kind}`;
 }catch(e){
 await sql`UPDATE fm_email_outbox SET last_error=${String(e.message).slice(0,200)} WHERE order_id=${claimed.order_id} AND kind=${claimed.kind}`;
 console.error('Mailverzending mislukt; zie fm_email_outbox voor opvolging.');
 }
 }
}
