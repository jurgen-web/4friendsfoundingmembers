# 4 Friends — Mollie / Netlify

Dit is een voorbereid integratiepakket, geen geactiveerde live checkout.

## Installeren

De vorige upload via Netlify Drop bevat alleen HTML. Dit pakket heeft serverfuncties en moet via een Netlify build uitgerold worden: importeer de uitgepakte map als Git-project in Netlify, of gebruik de Netlify CLI vanuit deze map met `npm ci` en `netlify deploy --build --prod` na koppeling aan de bestaande site. Upload alleen public/ via Drop NIET: dan ontbreken de betaalfuncties.

1. Maak/koppel een PostgreSQL-database (bijvoorbeeld Netlify Database). Voer `schema.sql` één keer uit. Houd de database privé.
2. Stel in Netlify bij Environment variables (scope Functions) in:
   - `MOLLIE_API_KEY`: eerst de test-sleutel van het juiste websiteprofiel. Nooit in HTML, broncode of chat plakken.
   - `DATABASE_URL`: de PostgreSQL-verbindingsstring. De functie accepteert ook `NETLIFY_DB_URL`.
   - `SITE_URL`: het exacte publieke HTTPS-adres, zonder laatste slash. Huidig profiel: https://melodic-platypus-9abd52.netlify.app
   - `SALES_ENABLED`: aanvankelijk `false`. Alleen live openen na definitieve verkoopvoorwaarden, privacycontrole en geslaagde tests. Test-sleutels werken ongeacht deze vlag.
3. Laat Netlify bouwen met `npm run build`, publicatiemap `public`, Functions-map `netlify/functions` (staat in netlify.toml).
4. Test op de gedeployde website met Mollies test-checkout: geslaagd, geannuleerd, mislukt, terugkeren vóór webhook, herhaalde status/webhook, en twee gelijktijdige inschrijvingen. Test en live hebben gescheiden capaciteit en nummering in dezelfde tabel.
5. Activeer Bancontact en kaartbetalingen bij Mollie. Rond ID-/UBO-/bankverificatie en websitebeoordeling af. Live-sleutel configureren, opnieuw deployen en pas na akkoord `SALES_ENABLED=true` instellen. Geen echte betaling nodig tijdens voorbereiding.

## Wat werkt in de code

- Prijzen €99/€259/€459 worden op de server bepaald, niet uit een browserbedrag.
- Contact-, Founding Wall- en afzonderlijke T-shirt/softshellmaten worden privé opgeslagen.
- Bancontact en creditcard worden aangeboden via Mollies hosted checkout.
- De klassieke Payments API-webhook accepteert alleen een ID; de status wordt daarna met de geheime sleutel bij Mollie opgehaald. Bedrag, valuta, payment-ID, order-ID en test/live worden geverifieerd.
- Unieke aanvraag en Mollie-idempotency beperken dubbele checkout-aanvragen. Netwerkfouten behouden dezelfde aanvraag-ID zolang de bezoeker het formulier niet wijzigt.
- Een transactie met databasevergrendeling bewaakt maximaal 100 betaalde of lopende aanvragen per omgeving. Een lopende aanvraag houdt tijdelijk capaciteit bezet tot een terminale status door Mollie wordt bevestigd. Mislukte/geannuleerde/verlopen betalingen geven hun capaciteit terug.
- Nummers worden atomair en eenmalig toegekend na serverbevestiging van `paid`. Herhaalde callbacks wijzigen het nummer niet. Nummers worden nooit hergebruikt, ook niet na terugbetaling.
- De bezoeker ziet de bevestiging op betaling.html. Er worden nog geen automatische bevestigingsmails verstuurd. Beheer/export gebeurt voorlopig via de private database.

## Open punten vóór verkoop

- De meegeleverde pagina vermeldt nog dat de campagne in voorbereiding is en dat definitieve verkoopvoorwaarden volgen. Dit is bewust een blokkade voor live verkoop. Stel eerst definitieve voorwaarden vast (btw, levering/afhaling, herroeping/annulering, bonnen/kortingen). Vervang de voorbereidende tekst pas daarna.
- Exacte nummering volgt de volgorde waarin bevestigde betalingen door de server verwerkt worden. Mollie kan webhooks vertraagd of in andere volgorde afleveren; dit garandeert dus NIET de exacte chronologische Mollie-paidAt-volgorde. Maak deze operationele afspraak expliciet vóór lancering, of laat een afstemmingsproces implementeren.
- De maximale 100 capaciteit telt lopende checkouts mee. Bij een storing tussen database-insert en API-opslag kan een creating-record blijven hangen. Verwijder dat niet blind: controleer eerst in Mollie via de aanvraag-ID of al een betaling bestaat. Volg deze records tijdens lancering handmatig op. Bouw bij groter verkeer periodieke afstemming en misbruikbeperking in.
- Refunds/chargebacks vragen handmatige opvolging. De code voert ze nooit automatisch uit en kent geen nieuwe nummers toe.
- Validatie en syntaxis zijn lokaal getest; geen echte Mollie-API, Netlify-deployment of PostgreSQL-integratietest is uitgevoerd. Test het volledige traject in testmodus vóór activering.

## Beheerquery (privé uitvoeren)

SELECT member_number, tier, state, customer, paid_at FROM fm_orders WHERE mode='live' ORDER BY member_number NULLS LAST, created_at;

Bewaar persoonsgegevens alleen waar nodig, beperk beheerrechten en richt een verwijder-/bewaarprocedure in. Werk de privacyinformatie bij met de daadwerkelijk gekozen databaseprovider.
