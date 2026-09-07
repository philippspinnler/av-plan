export const AFFILIATION_PREFIXES: Record<string, string> = {
	HR: 'Hoherat',
	PP: 'Pfahlpräsidentschaft',
	TP: 'Tempelpräsidentschaft',
	MP: 'Missionspräsidentschaft'
};

export function normalizeName(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/ß/g, 'ss')
		.toLowerCase()
		.replace(/[^a-z0-9 ]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function stripPrefix(raw: string): { name: string; affiliation: string | null } {
	const t = raw.trim();
	const m = t.match(/^(HR|PP|TP|MP)[-\s]\s*(.+)$/i);
	if (m) return { name: m[2].trim(), affiliation: AFFILIATION_PREFIXES[m[1].toUpperCase()] };
	if (/^(Elder|Sister)\s+\S/i.test(t)) return { name: t, affiliation: 'Missionar' };
	return { name: t, affiliation: null };
}

export function splitFullName(raw: string): { firstName: string; lastName: string; affiliation: string | null } {
	const { name, affiliation } = stripPrefix(raw);
	const parts = name.split(/\s+/).filter(Boolean);
	if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '', affiliation };
	if (affiliation === 'Missionar') return { firstName: parts[0], lastName: parts.slice(1).join(' '), affiliation };
	return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1], affiliation };
}

export function splitListName(raw: string): { firstName: string; lastName: string; affiliation: string | null } {
	const idx = raw.indexOf(',');
	if (idx < 0) return splitFullName(raw);
	const lastName = raw.slice(0, idx).trim();
	const { name: firstName, affiliation } = stripPrefix(raw.slice(idx + 1));
	return { firstName, lastName, affiliation };
}
