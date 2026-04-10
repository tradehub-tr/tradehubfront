import Alpine from 'alpinejs'

Alpine.data('interactiveCard', () => ({
  cardNumber: '',
  firstName: '',
  lastName: '',
  month: '',
  year: '',
  cvv: '',
  focusField: '' as string,
  isFlipped: false,

  get brand(): string {
    const num = this.cardNumber.replace(/\s/g, '');
    if (!num) return '';
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MC';
    if (/^3[47]/.test(num)) return 'AMEX';
    if (/^6(?:011|5)/.test(num)) return 'DISCOVER';
    if (/^35/.test(num)) return 'JCB';
    if (/^9792/.test(num)) return 'TROY';
    return '';
  },

  get cardName(): string {
    return `${this.firstName} ${this.lastName}`.trim().toUpperCase();
  },

  get displayNumber(): string {
    const raw = this.cardNumber.replace(/\s/g, '');
    if (!raw) return '#### #### #### ####';
    // Format with spaces first, then mask middle digits (index 5-14 like reference)
    const padded = raw.padEnd(this.brand === 'AMEX' ? 15 : 16, '#');
    const formatted = this.brand === 'AMEX'
      ? padded.replace(/(.{4})(.{6})(.{5})/, '$1 $2 $3')
      : padded.replace(/(.{4})(.{4})(.{4})(.{4})/, '$1 $2 $3 $4');
    // Mask characters at positions 5-14 (spaces excluded from masking)
    const chars = formatted.split('');
    for (let i = 0; i < chars.length; i++) {
      if (i > 4 && i < 14 && chars[i] !== ' ' && chars[i] !== '#') {
        chars[i] = '*';
      }
    }
    return chars.join('');
  },

  get displayExpiry(): string {
    const m = this.month || 'AA';
    const y = this.year ? this.year.toString().slice(-2) : 'YY';
    return `${m}/${y}`;
  },

  formatCardNumber() {
    let v = this.cardNumber.replace(/\D/g, '');
    const maxLen = this.brand === 'AMEX' ? 15 : 16;
    v = v.substring(0, maxLen);
    this.cardNumber = v.match(/.{1,4}/g)?.join(' ') || '';
    // Sync to DOM for vanilla JS save handler
    const el = document.getElementById('pay-card-num') as HTMLInputElement;
    if (el) el.value = this.cardNumber;
  },
}));
