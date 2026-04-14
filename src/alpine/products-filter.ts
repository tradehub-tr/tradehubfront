import Alpine from 'alpinejs'

Alpine.data('filterSidebar', (initialCollapsed: Record<string, boolean> = {}) => ({
  collapsed: { ...initialCollapsed } as Record<string, boolean>,
  lastRadioValue: {} as Record<string, string | null>,
  isDirty: false as boolean,

  init() {
    (this.$el as HTMLElement).querySelectorAll<HTMLInputElement>('[data-filter-section][type="radio"]').forEach((radio) => {
      const section = radio.dataset.filterSection ?? '';
      if (radio.checked) this.lastRadioValue[section] = radio.value;
      else if (!(section in this.lastRadioValue)) this.lastRadioValue[section] = null;
    });
    // Mark dirty when user types into any filter input (price / min-order)
    (this.$el as HTMLElement).addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (!t.dataset?.filterSection) return;
      if (t.type === 'number' || (t.type === 'text' && t.dataset.filterType !== 'search')) {
        this.isDirty = true;
      }
    });
  },

  toggleSection(sectionId: string) {
    this.collapsed[sectionId] = !this.collapsed[sectionId];
  },

  handleRadioClick(event: Event) {
    const radio = event.target as HTMLInputElement;
    if (radio.type !== 'radio') return;
    const section = radio.dataset.filterSection ?? '';
    if (this.lastRadioValue[section] === radio.value) {
      radio.checked = false;
      this.lastRadioValue[section] = null;
    } else {
      this.lastRadioValue[section] = radio.value;
    }
    this.$dispatch('filter-change');
  },

  handleSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const sectionId = input.dataset.filterSection;
    if (!sectionId) return;
    const query = input.value.toLowerCase();
    const wrapper = input.closest('[data-filter-section-wrapper]') || input.parentElement?.parentElement;
    if (!wrapper) return;
    wrapper.querySelectorAll<HTMLLabelElement>('label[for^="filter-"]').forEach((label) => {
      label.style.display = (label.textContent?.toLowerCase() || '').includes(query) ? '' : 'none';
    });
  },

  /** Arrow button next to price/min-order: commit this section immediately */
  applySection(_sectionId: string) {
    this.isDirty = false;
    this.$dispatch('filter-change');
  },

  /** Global "Ara" footer button: commit all pending filters */
  applyFilters() {
    this.isDirty = false;
    this.$dispatch('filter-change');
    this.$dispatch('filter-apply');
  },

  clearAllFilters() {
    (this.$el as HTMLElement).querySelectorAll<HTMLInputElement>('[data-filter-section]').forEach((input) => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else if (input.type === 'number' || input.type === 'text') {
        input.value = '';
      }
    });
    (this.$el as HTMLElement).querySelectorAll<HTMLLabelElement>('label[for^="filter-"]').forEach((label) => {
      label.style.display = '';
    });
    for (const key in this.lastRadioValue) this.lastRadioValue[key] = null;
    this.isDirty = false;
    this.$dispatch('filter-change');
  },
}));

Alpine.data('filterChips', () => ({
  removeChipFilter(section: string, value: string) {
    const input = document.querySelector<HTMLInputElement>(
      `input[data-filter-section="${section}"][data-filter-value="${value}"]`
    );
    if (input) {
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (section === 'price') {
      document.querySelectorAll<HTMLInputElement>('[data-filter-section="price"][data-filter-type]').forEach(i => { i.value = ''; });
      document.dispatchEvent(new CustomEvent('filter-change'));
      return;
    }

    if (section === 'min-order') {
      document.querySelectorAll<HTMLInputElement>('[data-filter-section="min-order"][data-filter-type]').forEach(i => { i.value = ''; });
      document.dispatchEvent(new CustomEvent('filter-change'));
    }
  },
}));

Alpine.data('searchHeader', ({ selectedSort, viewMode, sortLabel }: { selectedSort: string; viewMode: string; sortLabel: string }) => ({
  sortOpen: false,
  selectedSort,
  viewMode,
  sortLabel,

  selectSort(value: string, label: string) {
    this.selectedSort = value;
    this.sortLabel = label;
    this.sortOpen = false;
    this.$dispatch('sort-change', { value, label });
  },

  setViewMode(mode: string) {
    this.viewMode = mode;
    this.$dispatch('view-mode-change', { mode });
  },
}));
