<script lang="ts">
	/**
	 * Personenauswahl mit Suchfeld: tippen filtert die Liste, Klick oder Enter wählt.
	 * Der gewählte Wert wandert über ein verstecktes Feld ins Formular.
	 */
	type Option = { id: number; label: string; hint: string };
	let {
		id,
		name,
		options,
		value = null,
		form = undefined,
		placeholder = 'Name tippen …',
		emptyLabel = '– niemand –',
		serialize = (id: number | null) => (id === null ? '' : String(id))
	}: {
		id: string;
		name: string;
		options: Option[];
		value?: number | null;
		form?: string;
		placeholder?: string;
		/** Text des Eintrags, der die Auswahl leert (z.B. "automatisch: …"). */
		emptyLabel?: string;
		/** Formularwert für die gewählte Kennung; erlaubt Sonderfälle wie Freitext-Namen. */
		serialize?: (id: number | null) => string;
	} = $props();

	let selected = $state<number | null>(null);
	let query = $state('');
	let open = $state(false);
	let active = $state(0);
	let root: HTMLDivElement;
	let syncedValue = $state<number | null | undefined>(undefined);

	// Wenn die Seite einen anderen Sonntag lädt, den gewählten Wert nachziehen.
	$effect(() => {
		if (value !== syncedValue) {
			selected = value ?? null;
			syncedValue = value;
			query = '';
			open = false;
		}
	});

	const current = $derived(options.find((o) => o.id === selected) ?? null);
	const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	const matches = $derived.by(() => {
		const q = fold(query.trim());
		const words = q.split(/\s+/).filter(Boolean);
		const list = words.length ? options.filter((o) => words.every((w) => fold(o.label).includes(w))) : options;
		return list.slice(0, 60);
	});

	function choose(o: Option | null) {
		selected = o?.id ?? null;
		query = '';
		open = false;
	}
	function onInput(e: Event) {
		query = (e.currentTarget as HTMLInputElement).value;
		open = true;
		active = 0;
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			open = true;
			active = Math.min(active + 1, matches.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (e.key === 'Enter') {
			if (open) {
				e.preventDefault();
				if (matches[active]) choose(matches[active]);
			}
		} else if (e.key === 'Escape') {
			open = false;
			query = '';
		}
	}
	function onFocusOut(e: FocusEvent) {
		if (root.contains(e.relatedTarget as Node | null)) return;
		open = false;
		query = '';
	}
</script>

<div class="combo" bind:this={root} onfocusout={onFocusOut}>
	<input type="hidden" {name} {form} value={serialize(selected)} />
	<input
		{id}
		type="text"
		class="combo-input"
		role="combobox"
		aria-expanded={open}
		aria-controls="{id}-list"
		aria-autocomplete="list"
		autocomplete="off"
		value={open ? query : (current?.label ?? '')}
		placeholder={current ? current.label : placeholder}
		oninput={onInput}
		onfocus={() => (open = true)}
		onclick={() => (open = true)}
		onkeydown={onKey}
	/>
	{#if current && !open}
		<button type="button" class="combo-clear" aria-label="Auswahl entfernen" onclick={() => choose(null)}>✕</button>
	{/if}
	{#if open}
		<!-- Tastatur läuft über das Eingabefeld (Pfeile, Enter, Escape); die Einträge selbst sind nur für Maus und Touch. -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<ul class="combo-list" id="{id}-list" role="listbox">
			{#if current}
				<li class="combo-item combo-none" role="option" aria-selected="false" tabindex="-1" onmousedown={(e) => e.preventDefault()} onclick={() => choose(null)}>{emptyLabel}</li>
			{/if}
			{#each matches as o, i (o.id)}
				<li
					class="combo-item"
					class:active={i === active}
					class:chosen={o.id === selected}
					role="option"
					aria-selected={i === active}
					tabindex="-1"
					onmousedown={(e) => e.preventDefault()}
					onmouseenter={() => (active = i)}
					onclick={() => choose(o)}
				>
					<span>{o.label}</span>{#if o.hint}<span class="combo-hint">{o.hint}</span>{/if}
				</li>
			{/each}
			{#if matches.length === 0}
				<li class="combo-empty">Kein Treffer. Andere Schreibweise versuchen.</li>
			{:else if matches.length === 60}
				<li class="combo-empty">Mehr Treffer vorhanden, bitte weiter tippen.</li>
			{/if}
		</ul>
	{/if}
</div>
