import {setup,json} from './shared.mjs';
import {reconcile} from './reconcile.mjs';
export default async function(req){
 if(req.method!=='POST')return new Response('',{status:405});
 try{const {mode}=setup();const text=await req.text();if(text.length>1000)return new Response('',{status:413});const id=new URLSearchParams(text).get('id');if(!/^tr_[A-Za-z0-9]+$/.test(id||''))return new Response('',{status:400});const o=await reconcile(id,mode);return new Response('',{status:o?200:503});}catch{return new Response('',{status:503});}
}
