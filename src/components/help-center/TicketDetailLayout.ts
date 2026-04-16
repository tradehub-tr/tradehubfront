/**
 * TicketDetailLayout — müşteri perspektifi talep detay.
 *
 * Frappe Helpdesk akışı:
 *   - Ticket (+ initial description) üstte
 *   - Communication timeline (agent yanıtları + müşteri yanıtları)
 *   - Müşteri yanıt composer
 *   - Sidebar: durum, öncelik, sipariş, oluşturma/güncelleme tarihleri
 *
 * URL: /pages/help/help-ticket.html?id=<HD Ticket name>
 */

export function TicketDetailLayout(): string {
  return `
    <div class="bg-gray-50 min-h-screen" x-data="ticketDetail()" x-init="init()">
      <div class="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">

        <!-- Breadcrumb + back -->
        <div class="flex items-center gap-2 text-sm mb-4">
          <a href="/pages/help/help-tickets.html"
             class="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Destek Taleplerim
          </a>
          <span class="text-gray-300">/</span>
          <span class="text-gray-700 font-mono">#<span x-text="ticketId"></span></span>
        </div>

        <!-- Loading -->
        <template x-if="loading">
          <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg class="w-6 h-6 mx-auto text-primary-500 animate-spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 018-8V4a8 8 0 018 8h-2a6 6 0 00-6-6 6 6 0 00-6 6H4z"/>
            </svg>
            <p class="text-sm text-gray-400 mt-3">Talep yükleniyor...</p>
          </div>
        </template>

        <!-- Error -->
        <template x-if="!loading && errorMsg">
          <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700" x-text="errorMsg"></div>
        </template>

        <!-- Not found -->
        <template x-if="!loading && !errorMsg && !ticket">
          <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <h3 class="text-base font-semibold text-gray-700 mb-1">Talep bulunamadı</h3>
            <p class="text-sm text-gray-400">Geçersiz veya erişiminiz olmayan bir talep.</p>
          </div>
        </template>

        <!-- Content -->
        <template x-if="!loading && !errorMsg && ticket">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <!-- Sol: konusma -->
            <div class="lg:col-span-2 space-y-3">
              <!-- Header card -->
              <div class="bg-white border border-gray-200 rounded-xl p-5">
                <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <h1 class="text-lg font-bold text-gray-900" x-text="ticket.subject || '(konusuz)'"></h1>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                    :class="statusCls(ticket.status)">
                    <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="statusDotCls(ticket.status)"></span>
                    <span x-text="statusLabel(ticket.status)"></span>
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span class="font-mono">#<span x-text="ticket.name"></span></span>
                  <span>·</span>
                  <span>Açılış: <span x-text="fmtDT(ticket.creation)"></span></span>
                  <span x-show="ticket.priority && ticket.priority !== 'Medium'"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ml-1"
                    :class="priorityChipCls(ticket.priority)"
                    x-text="priorityLabel(ticket.priority)"></span>
                </div>
              </div>

              <!-- Orijinal mesaj -->
              <article class="bubble bubble-user">
                <div class="b-avatar bg-primary-100 text-primary-600" x-text="initial(ticket.raised_by)"></div>
                <div class="b-body">
                  <header class="b-head">
                    <span class="b-author" x-text="ticket.raised_by || '-'"></span>
                    <span class="b-badge b-badge-customer">Müşteri · İlk Talep</span>
                    <span class="b-meta" x-text="fmtDT(ticket.creation)"></span>
                  </header>
                  <div class="b-content prose prose-sm max-w-none" x-html="ticket.description || '<p class=\\'text-gray-400\\'>Açıklama girilmedi</p>'"></div>
                </div>
              </article>

              <!-- Timeline -->
              <template x-for="m in messages" :key="m.id">
                <article class="bubble" :class="m.sender === 'support' ? 'bubble-agent' : 'bubble-user'">
                  <div class="b-avatar"
                    :class="m.sender === 'support' ? 'bg-gray-100 text-gray-600' : 'bg-primary-100 text-primary-600'"
                    x-text="initial(m.from)"></div>
                  <div class="b-body">
                    <header class="b-head">
                      <span class="b-author" x-text="m.from || '-'"></span>
                      <span class="b-badge" :class="m.sender === 'support' ? 'b-badge-agent' : 'b-badge-customer'"
                        x-text="m.sender === 'support' ? 'Destek' : 'Siz'"></span>
                      <span class="b-meta" x-text="m.date"></span>
                    </header>
                    <div class="b-content text-sm text-gray-700 whitespace-pre-wrap" x-text="m.text"></div>
                  </div>
                </article>
              </template>

              <!-- Kapalı uyarısı -->
              <template x-if="ticket.status === 'Closed'">
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500">
                  Bu talep kapatıldı. Yeni bir konu için
                  <a href="/pages/help/help-ticket-new.html" class="text-primary-600 hover:underline">yeni talep açabilirsiniz</a>.
                </div>
              </template>

              <!-- Composer (Open/Replied/Resolved'da aktif) -->
              <template x-if="ticket.status !== 'Closed'">
                <div class="bg-white border border-gray-200 rounded-xl p-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Yanıt yaz</label>
                  <textarea x-model="replyText" rows="4" class="th-input resize-y"
                    placeholder="Destek ekibine mesajınız..."></textarea>
                  <div class="flex items-center justify-between gap-2 mt-3">
                    <p class="text-xs text-gray-400">Ekip yanıtladığında e-posta ve buradan bildirilirsiniz.</p>
                    <button class="th-btn th-btn-sm inline-flex items-center gap-2"
                      :disabled="sending || !replyText.trim()"
                      @click="sendReply()">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                      <span x-text="sending ? 'Gönderiliyor...' : 'Gönder'"></span>
                    </button>
                  </div>
                  <p x-show="sendError" x-text="sendError" class="text-xs text-red-500 mt-2"></p>
                </div>
              </template>

              <!-- Resolved → müşteri onayı -->
              <template x-if="ticket.status === 'Resolved'">
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-emerald-800">Destek ekibi çözüm olarak işaretledi</p>
                      <p class="text-xs text-emerald-700 mt-0.5">Çözümü onaylıyorsanız talebi kapatabilirsiniz.</p>
                    </div>
                    <button class="th-btn-outlined th-btn-sm text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      :disabled="closing" @click="closeTicket()">
                      <span x-text="closing ? 'İşleniyor...' : 'Talebi Kapat'"></span>
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <!-- Sag: sidebar -->
            <aside class="space-y-3">
              <div class="bg-white border border-gray-200 rounded-xl p-4">
                <h3 class="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wide">Talep Bilgileri</h3>
                <dl class="space-y-2.5 text-xs">
                  <div class="flex justify-between gap-2">
                    <dt class="text-gray-500">Durum</dt>
                    <dd class="font-medium text-gray-700" x-text="statusLabel(ticket.status)"></dd>
                  </div>
                  <div class="flex justify-between gap-2" x-show="ticket.priority">
                    <dt class="text-gray-500">Öncelik</dt>
                    <dd class="font-medium text-gray-700" x-text="priorityLabel(ticket.priority)"></dd>
                  </div>
                  <div class="flex justify-between gap-2" x-show="ticket.ticket_type">
                    <dt class="text-gray-500">Tip</dt>
                    <dd class="font-medium text-gray-700" x-text="ticket.ticket_type"></dd>
                  </div>
                  <div class="flex justify-between gap-2" x-show="ticket.agent_group">
                    <dt class="text-gray-500">Destek Ekibi</dt>
                    <dd class="font-medium text-gray-700" x-text="ticket.agent_group"></dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt class="text-gray-500">Açılış</dt>
                    <dd class="font-medium text-gray-700" x-text="fmtDT(ticket.creation)"></dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt class="text-gray-500">Son Güncelleme</dt>
                    <dd class="font-medium text-gray-700" x-text="fmtDT(ticket.modified)"></dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </template>
      </div>
    </div>

    <style>
      .bubble {
        display: flex; gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.75rem;
        background: white;
        border: 1px solid rgb(229 231 235);
      }
      .bubble-user {
        background: rgb(255 247 237);
        border-color: rgb(254 215 170);
      }
      .bubble-agent {
        background: rgb(248 250 252);
        border-color: rgb(226 232 240);
      }
      .b-avatar {
        width: 2.25rem; height: 2.25rem;
        border-radius: 9999px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 700;
        flex-shrink: 0;
      }
      .b-body { flex: 1; min-width: 0; }
      .b-head {
        display: flex; align-items: center; gap: 0.5rem;
        flex-wrap: wrap;
        font-size: 0.6875rem;
        margin-bottom: 0.375rem;
      }
      .b-author { font-weight: 600; color: rgb(55 65 81); }
      .b-meta { color: rgb(156 163 175); }
      .b-badge {
        display: inline-flex; align-items: center;
        padding: 0.0625rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.625rem; font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }
      .b-badge-customer { background: rgb(254 215 170); color: rgb(154 52 18); }
      .b-badge-agent    { background: rgb(226 232 240); color: rgb(51 65 85); }
      .b-content { font-size: 0.875rem; color: rgb(55 65 81); }
    </style>
  `;
}
