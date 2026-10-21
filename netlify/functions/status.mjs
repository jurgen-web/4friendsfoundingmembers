import {db,setup,json} from './shared.mjs';import {reconcile} from './reconcile.mjs';
export default async function(req){
 if(req.method!=='GET')return json({},405);
 try{const {mode}=setup();const token=new URL(req.url).searchParams.get('token');if(!/^[a-f0-9]{64}$/.test(token||''))return json({error:'Onbekende inschrijving'},404);
 const [order]=await db()`SELECT * FROM fm_orders WHERE token=${token} AND mode=${mode}`;
 if(!order)return json({error:'Onbekende inschrijving'},404);
 const o=order.member_number?order:order.payment_id?await reconcile(order.payment_id,mode):order;
 return json({status:o.state,number:o.member_number,mode});
 }catch{return json({error:'Status tijdelijk niet beschikbaar'},503);}
}
