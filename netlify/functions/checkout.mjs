import {randomUUID,randomBytes} from 'node:crypto';
import {db,setup,json,mollie,lock} from './shared.mjs';
import {prices,validate} from './domain.mjs';
export default async function(req){
 if(req.method!=='POST')return json({error:'Alleen POST'},405);
 try{
 const {mode,origin}=setup();if(req.headers.get('origin')!==origin)return json({error:'Ongeldige herkomst'},403);
 const text=await req.text();if(text.length>5000)return json({error:'Aanvraag te groot'},413);
 const raw=JSON.parse(text);if(raw.website)return json({error:'Ongeldige aanvraag'},400);
 let data;try{data=validate(raw);}catch(e){return json({error:e.message},400);}
 const id=raw.requestId;if(!/^[0-9a-f-]{36}$/.test(id||''))return json({error:'Ongeldige aanvraag'},400);
 const sql=db();
 const order=await sql.begin(async tx=>{
 await lock(tx,mode);
 const [old]=await tx`SELECT * FROM fm_orders WHERE id=${id}`;
 if(old){if(old.mode!==mode||old.customer.email!==data.email||old.tier!==data.pakket)throw Error('Aanvraagconflict');return old;}
 // Pending/unknown payments retain capacity until Mollie confirms a terminal failure.
 const [{n}]=await tx`SELECT count(*)::int n FROM fm_orders WHERE mode=${mode} AND state NOT IN ('failed','canceled','expired')`;
 if(n>=100)throw Error('Alle plaatsen zijn momenteel bezet. Probeer later opnieuw.');
 const token=randomBytes(32).toString('hex');
 const [o]=await tx`INSERT INTO fm_orders(id,token,tier,customer,mode) VALUES(${id},${token},${data.pakket},${tx.json(data)},${mode}) RETURNING *`;
 return o;
 });
 if(order.checkout_url)return json({checkout:order.checkout_url});
 if(order.state!=='creating')return json({error:'Start een nieuwe inschrijving.'},409);
 const p=await mollie('payments',{method:'POST',headers:{'Idempotency-Key':id},body:JSON.stringify({amount:{currency:'EUR',value:prices[data.pakket]},description:`4 Friends Founding Member €${data.pakket}`,method:raw.method,locale:'nl_BE',redirectUrl:`${origin}/betaling.html?token=${order.token}`,webhookUrl:`${origin}/.netlify/functions/webhook`,metadata:{orderId:id}})});
 const checkout=p._links?.checkout?.href;
 if(!checkout || new URL(checkout).protocol!=='https:')throw Error('Betaallink ontbreekt');
 await sql`UPDATE fm_orders SET payment_id=${p.id},checkout_url=${checkout},state=${p.status},updated_at=now() WHERE id=${id} AND payment_id IS NULL`;
 return json({checkout});
 }catch(e){return json({error:e.message.startsWith('Alle plaatsen')?e.message:'Betalen is tijdelijk niet beschikbaar. Er is nog geen betaling bevestigd. Probeer dezelfde aanvraag opnieuw of neem contact op.'},503);}
}
