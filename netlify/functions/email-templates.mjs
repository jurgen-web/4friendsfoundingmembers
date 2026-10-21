const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
export function emailMessages(order) {
 const c=order.customer, name=clean(c.naam), number=String(order.member_number).padStart(3,'0');
 const tier=String(order.tier);
 if(order.mode!=='live'||order.state!=='paid'||!order.member_number||!['99','259','459'].includes(tier)) return [];
 const discount={'99':5,'259':10,'459':15}[tier];
 const voucher=tier==='99'?'Een bon van €25 bij aankoop vanaf €100.':'Een bon van €50 bij aankoop vanaf €200.';
 const benefits=[`Je persoonlijke Founding-nummer #${number}.`,...(c.wallConsent?[`Een plek op onze Founding Wall als ${clean(c.wall)}.`]:[]),'Een gepersonaliseerde Founding patch.',...(tier!=='99'?[`Een gepersonaliseerd Founding T-shirt — ${clean(c.maat)}.`]:[]),...(tier==='459'?[`Een gepersonaliseerde premium Founding softshell — ${clean(c.softshell)}.`]:[]),'Lidmaatschap van de 4 Friends-community.','Een uitnodiging voor de VIP-opening.',`${discount}% voordeel op accessoires en kledij in 2027.`,voucher];
 const from='4 Friends <jurgen@hondamotogent.be>', reply_to='jurgen@hondamotogent.be';
 return [
 {kind:'customer',payload:{from,reply_to,to:[c.email],subject:`Welkom ${name}, Founding Member #${number} van 4 Friends!`,text:`Dag ${name},\n\nJe bent erbij: Founding Member #${number} van 4 Friends!\n\nWe hebben je betaling van €${tier} goed ontvangen. Bedankt om vanaf het begin mee je schouders onder ons verhaal te zetten.\n\nDit zit in jouw pakket:\n${benefits.map(x=>'• '+x).join('\n')}\n\nWe houden je op de hoogte van de opening en de praktische afspraken rond je pakket.\n\nVragen? Antwoord gerust op deze mail.\n\nMerci voor je vertrouwen. Jij kunt straks zeggen: “Ik was erbij toen het begon.”\n\nJurgen\nNamens Anke, Katrien, Mike en mezelf\n4 Friends BV\nHundelgemsesteenweg 288, 9820 Merelbeke-Melle`}},
 {kind:'owner',payload:{from,reply_to,to:['jurgen@hondamotogent.be'],subject:`Nieuwe Founding Member #${number} — ${name} — €${tier}`,text:`Nieuwe betaalde inschrijving\n\nNummer: #${number}\nNaam: ${name}\nE-mail: ${c.email}\nTelefoon: ${clean(c.telefoon)}\nPakket: €${tier}\nNaam op Founding Wall: ${clean(c.wall)}\nToestemming publicatie: ${c.wallConsent?'Ja':'Nee'}\nT-shirtmaat: ${tier==='99'?'Niet inbegrepen':clean(c.maat)}\nSoftshellmaat: ${tier==='459'?clean(c.softshell):'Niet inbegrepen'}\nBetaling: ${order.payment_id}\n\nDe betaling is bevestigd.`}}
 ];
}
export async function queueEmails(tx,order){
 for(const m of emailMessages(order)) await tx`INSERT INTO fm_email_outbox(order_id,kind,payload) VALUES(${order.id},${m.kind},${tx.json(m.payload)}) ON CONFLICT DO NOTHING`;
}
