<script lang="ts">
	/**
	 * Liederauswahl mit Suchfeld: Nummer oder Titel tippen, aus den Treffern wählen.
	 * Der gewählte Eintrag ("202 – Ich bin ein Kind von Gott") wandert als Text ins Formular.
	 */
	let {
		id,
		name,
		options,
		value = '',
		form = undefined
	}: { id: string; name: string; options: string[]; value?: string; form?: string } = $props();

	let selected = $state('');
	let query = $state('');
	let open = $state(false);
	let active = $state(0);
	let root: HTMLDivElement;
	let syncedValue = $state<string | undefined>(undefined);

	$effect(() => {
		if (value !== syncedValue) {
			selected = value;
			syncedValue = value;
			query = '';
			open = false;
		}
	});

	const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	const numberOf = (label: string) => label.match(/^(\d+)/)?.[1] ?? '';
	const matches = $derived.by(() => {
		const q = query.trim();
		if (!q) return options.slice(0, 40);
		if (/^\d+$/.test(q)) return options.filter((o) => numberOf(o).startsWith(q)).slice(0, 40);
		const words = fold(q).split(/\s+/).filter(Boolean);
		return options.filter((o) => words.every((w) => fold(o).includes(w))).slice(0, 40);
	});

	function choose(label: string) {
		selected = label;
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
	<input type="hidden" {name} {form} value={selected} />
	<input
		{id}
		type="text"
		class="combo-input"
		role="combobox"
		aria-expanded={open}
		aria-controls="{id}-list"
		aria-autocomplete="list"
		autocomplete="off"
		inputmode="search"
		value={open ? query : selected}
		placeholder={selected || 'Nummer oder Titel tippen'}
		oninput={onInput}
		onfocus={() => (open = true)}
		onclick={() => (open = true)}
		onkeydown={onKey}
	/>
	{#if selected && !open}
		<button type="button" class="combo-clear" aria-label="Auswahl entfernen" onclick={() => choose('')}>✕</button>
	{/if}
	{#if open}
		<!-- Tastatur läuft über das Eingabefeld (Pfeile, Enter, Escape); die Einträge selbst sind nur für Maus und Touch. -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<ul class="combo-list" id="{id}-list" role="listbox">
			{#if selected}
				<li class="combo-item combo-none" role="option" aria-selected="false" tabindex="-1" onmousedown={(e) => e.preventDefault()} onclick={() => choose('')}>– kein Lied –</li>
			{/if}
			{#each matches as o, i (o)}
				<li
					class="combo-item"
					class:active={i === active}
					class:chosen={o === selected}
					role="option"
					aria-selected={i === active}
					tabindex="-1"
					onmousedown={(e) => e.preventDefault()}
					onmouseenter={() => (active = i)}
					onclick={() => choose(o)}
				>
					<span>{o}</span>
				</li>
			{/each}
			{#if matches.length === 0}
				<li class="combo-empty">Kein Treffer. Lieder werden unter "Lieder" angelegt.</li>
			{:else if matches.length === 40}
				<li class="combo-empty">Mehr Treffer vorhanden, bitte weiter tippen.</li>
			{/if}
		</ul>
	{/if}
</div>
