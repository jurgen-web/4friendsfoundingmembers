export const prices = Object.freeze({'99':'99.00','259':'259.00','459':'459.00'});
export function validate(d) {
 const str=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
 if(!d || !prices[d.pakket] || !str(d.naam,120) || !str(d.email,254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !str(d.wall,120) || d.privacy!==true || d.terms!==true || !['bancontact','creditcard'].includes(d.method)) throw new Error('Controleer je gegevens en bevestig de voorwaarden.');
 if(d.telefoon && (!str(d.telefoon,40))) throw new Error('Controleer je telefoonnummer.');
 if(d.pakket!=='99' && !['XS','S','M','L','XL','XXL','3XL'].includes(d.maat)) throw new Error('Kies je T-shirtmaat.');
 if(d.pakket==='459' && !['XS','S','M','L','XL','XXL','3XL'].includes(d.softshell)) throw new Error('Kies je softshellmaat.');
 return {pakket:d.pakket,naam:d.naam.trim(),email:d.email.trim().toLowerCase(),wall:d.wall.trim(),telefoon:d.telefoon||'',maat:d.maat||'',softshell:d.softshell||'',wallConsent:d.wallConsent===true};
}
export function verifiedPayment(p,order,mode) {
 return p.id===order.payment_id && p.metadata?.orderId===order.id && p.amount?.currency==='EUR' && p.amount?.value===prices[order.tier] && p.mode===mode;
}
