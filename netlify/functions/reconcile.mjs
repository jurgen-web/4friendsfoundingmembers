import {db,mollie,lock} from './shared.mjs';
import {verifiedPayment} from './domain.mjs';
export async function reconcile(id,mode){
 const sql=db();const [order]=await sql`SELECT * FROM fm_orders WHERE payment_id=${id} AND mode=${mode}`;
 if(!order)return null;
 const p=await mollie('payments/'+encodeURIComponent(id));
 if(!verifiedPayment(p,order,mode))throw Error('Betaalgegevens komen niet overeen');
 return sql.begin(async tx=>{
 await lock(tx,mode);
 const [current]=await tx`SELECT * FROM fm_orders WHERE id=${order.id} FOR UPDATE`;
 if(current.member_number)return current; // A paid number is never reused, including after a refund.
 let number=null;
 if(p.status==='paid'){
 const [{next}]=await tx`SELECT coalesce(max(member_number),0)+1 AS next FROM fm_orders WHERE mode=${mode}`;
 if(next>100)throw Error('Handmatige opvolging vereist');number=next;
 }
 const [updated]=await tx`UPDATE fm_orders SET state=${p.status},member_number=${number},paid_at=${p.paidAt||null},updated_at=now() WHERE id=${order.id} RETURNING *`;
 return updated;
 });
}
