import { Resend } from 'resend';
import type { Produkty } from '$lib/domena/typy';
import { formatujZl, RZYMSKIE, type Wyliczenie } from '$lib/domena/skladka';

export interface DaneMaila {
	nrWniosku: string;
	branzaNazwa: string;
	wariant: number;
	liczbaOsob: number;
	kompletny: boolean;
	firmaNazwa: string;
	nip: string;
	email: string;
	imie: string;
	telefon: string;
	wyliczenie: Wyliczenie;
	adopcja: number;
	/** załączniki (base64): RODO, informacja o dystrybutorze, ew. arkusz struktury */
	zalaczniki?: { filename: string; content: string }[];
}

const stopka = `<p style="color:#8a8a8a;font-size:12px;margin-top:28px">
Materiał informacyjny — nie jest ofertą w rozumieniu art. 66 k.c. Wiążące są wyłącznie OWU:
EZwB 01/25, MA 01/25, GD-GZ 01/25. Ubezpieczyciel: Sopockie Towarzystwo Ubezpieczeń na Życie ERGO Hestia S.A.</p>`;

function wierszeSkladki(d: DaneMaila): string {
	const w = d.wyliczenie;
	let h = `<tr><td style="padding:6px 0;color:#4a4a4a">Pakiet główny (${d.branzaNazwa} · Wariant ${RZYMSKIE[d.wariant]}) × ${d.liczbaOsob} os.</td><td align="right"><b>${formatujZl(w.min)} / mies.</b></td></tr>`;
	for (const o of w.opcje) {
		h += `<tr><td style="padding:6px 0;color:#4a4a4a">${o.nazwa}</td><td align="right">${formatujZl(o.skladka)} / os.</td></tr>`;
	}
	if (w.opcje.length) {
		h += `<tr><td style="padding:6px 0;color:#4a4a4a">Szacunek przy ${Math.round(d.adopcja * 100)}% adopcji rozszerzeń</td><td align="right"><b>≈ ${formatujZl(w.szacunek)} / mies.</b></td></tr>
<tr><td style="padding:6px 0;color:#4a4a4a">Widełki (0–100% adopcji)</td><td align="right">${formatujZl(w.min)} – ${formatujZl(w.max)}</td></tr>`;
	}
	return h;
}

export function mailDoKlienta(d: DaneMaila): { subject: string; html: string } {
	return {
		subject: `Wniosek ${d.nrWniosku} przyjęty — ERGO Życie w Biznesie`,
		html: `<div style="font-family:Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
<div style="border-bottom:3px solid #C11F31;padding:18px 0"><b style="color:#C11F31;font-size:22px">ERGO</b> <span style="letter-spacing:2px;color:#4a4a4a">HESTIA</span></div>
<h2 style="font-weight:900">Dziękujemy — wniosek ${d.nrWniosku} jest u nas</h2>
<p>Dzień dobry${d.imie ? ` ${d.imie}` : ''},</p>
<p>przyjęliśmy wniosek o grupowe ubezpieczenie na życie <b>ERGO Życie w Biznesie</b> dla firmy
<b>${d.firmaNazwa}</b> (NIP ${d.nip}). Opiekun odezwie się w ciągu jednego dnia roboczego.</p>
<table width="100%" style="border-top:1px solid #dedede;border-bottom:1px solid #dedede;font-size:14px">${wierszeSkladki(d)}</table>
${
	d.kompletny
		? `<p style="background:#E7F5EC;padding:12px 16px;font-size:14px"><b>Wniosek jest kompletny.</b> Strukturę wiekową już mamy — nie musisz nic odsyłać.</p>`
		: `<p style="background:#FFF6E6;padding:12px 16px;font-size:14px"><b>Do wystawienia polisy potrzebujemy jeszcze struktury wiekowej zespołu.</b> W załączniku jest arkusz <b>lista-ubezpieczonych.xlsx</b> — wypełnij go i odeślij odpowiedzią na tę wiadomość. Składka się nie zmieni.</p>`
}
<p style="font-size:14px">Ostateczna składka za rozszerzenia wyjdzie po zebraniu deklaracji od pracowników —
każdy sam wskaże, które rozszerzenia bierze.</p>
<p style="font-size:13px;color:#4a4a4a">W załącznikach przekazujemy informację o przetwarzaniu danych osobowych (RODO)
oraz informację o dystrybutorze ubezpieczeń.</p>
${stopka}</div>`
	};
}

export function mailDoOpiekuna(d: DaneMaila): { subject: string; html: string } {
	return {
		subject: `Nowy wniosek ${d.nrWniosku}: ${d.firmaNazwa} (${d.branzaNazwa}, ${d.liczbaOsob} os.)`,
		html: `<div style="font-family:Roboto,Arial,sans-serif;max-width:640px;color:#1a1a1a">
<h2>Nowy wniosek ${d.nrWniosku}</h2>
<table style="font-size:14px">
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Firma</td><td><b>${d.firmaNazwa}</b> · NIP ${d.nip}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Program</td><td>${d.branzaNazwa} · Wariant ${RZYMSKIE[d.wariant]}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Osób</td><td>${d.liczbaOsob}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Struktura wiekowa</td><td>${d.kompletny ? 'podana w kreatorze (wniosek kompletny)' : 'BRAK — klient odeśle arkusz'}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Koszt pewny</td><td>${formatujZl(d.wyliczenie.min)} / mies.</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Widełki</td><td>${formatujZl(d.wyliczenie.min)} – ${formatujZl(d.wyliczenie.max)} / mies.</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#4a4a4a">Kontakt</td><td>${d.imie} · <a href="mailto:${d.email}">${d.email}</a> · ${d.telefon}</td></tr>
</table></div>`
	};
}

/**
 * Wysyła oba maile. Błąd wysyłki NIE przerywa zapisu wniosku —
 * zwracamy listę błędów do zalogowania w tabeli zdarzenia.
 */
export async function wyslijMaile(
	env: App.Platform['env'],
	d: DaneMaila
): Promise<{ blad: string; adresat: string }[]> {
	const resend = new Resend(env.RESEND_API_KEY);
	const bledy: { blad: string; adresat: string }[] = [];
	const klient = mailDoKlienta(d);
	const opiekun = mailDoOpiekuna(d);

	const wyniki = await Promise.allSettled([
		resend.emails.send({
			from: env.MAIL_OD,
			to: d.email,
			replyTo: env.MAIL_OPIEKUN,
			...klient,
			...(d.zalaczniki?.length ? { attachments: d.zalaczniki } : {})
		}),
		resend.emails.send({ from: env.MAIL_OD, to: env.MAIL_OPIEKUN, replyTo: d.email, ...opiekun })
	]);
	wyniki.forEach((w, i) => {
		const adresat = i === 0 ? d.email : env.MAIL_OPIEKUN;
		if (w.status === 'rejected') bledy.push({ adresat, blad: String(w.reason) });
		else if (w.value.error) bledy.push({ adresat, blad: w.value.error.message });
	});
	return bledy;
}

// eksport typu Produkty używany przez endpoint do przeliczeń
export type { Produkty };
