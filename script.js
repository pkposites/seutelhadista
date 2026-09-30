window.dataLayer = window.dataLayer || [];

const WHATSAPP_NUMBER = '551150922446';
const ADS_CONVERSION = 'AW-18035199724/lir8ClDj9Y0cEOyd7ZdD';

document.getElementById('year').textContent = new Date().getFullYear();

function track(eventName, extra) {
  window.dataLayer.push(Object.assign({ event: eventName }, extra || {}));
}

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Lead Hub: registra o contato (nome, telefone, respostas e origem do anúncio)
// e devolve a URL do WhatsApp com o código de rastreio. Sem o Lead Hub
// carregado, segue com a URL original.
function openWhatsApp(url, lead, answers) {
  window.LeadHub?.set(answers);
  window.LeadHub?.identify({ name: lead.name, phone: lead.phone });
  const destino = window.LeadHub ? window.LeadHub.whatsappUrl(url) : url;
  window.open(destino, '_blank', 'noopener');
}

// ── Origem do lead: UTMs + parâmetros do Google/Meta Ads ──
// Guardados em sessionStorage assim que aparecem na URL, para não perder a
// origem se o visitante navegar pela página antes de enviar o formulário.
const LEAD_SOURCE_KEY = 'st_lead_source';
const LEAD_SOURCE_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'campaign_name', 'adset_name', 'ad_name', 'gclid', 'fbclid'
];

function getLeadSource() {
  let stored = {};
  try { stored = JSON.parse(sessionStorage.getItem(LEAD_SOURCE_KEY) || '{}'); } catch (e) {}
  const params = new URLSearchParams(window.location.search);
  let changed = false;
  LEAD_SOURCE_PARAMS.forEach((key) => {
    const value = params.get(key);
    if (value) { stored[key] = value; changed = true; }
  });
  if (changed) {
    try { sessionStorage.setItem(LEAD_SOURCE_KEY, JSON.stringify(stored)); } catch (e) {}
  }
  return stored;
}
getLeadSource();

// Resumo em texto da origem, gravado no Netlify Forms junto com o lead.
function leadSourceSummary() {
  const s = getLeadSource();
  const parts = [];
  if (s.gclid) parts.push('Google Ads');
  if (s.fbclid) parts.push('Meta Ads');
  if (s.utm_source || s.utm_medium) parts.push([s.utm_source, s.utm_medium].filter(Boolean).join(' / '));
  const campaign = s.campaign_name || s.utm_campaign;
  if (campaign) parts.push(`campanha: ${campaign}`);
  const ad = s.ad_name || s.utm_content;
  if (ad) parts.push(`anúncio: ${ad}`);
  if (s.utm_term) parts.push(`termo: ${s.utm_term}`);
  return parts.join(' · ') || 'direto / orgânico';
}

// Envia para o Netlify Forms sem bloquear a abertura do WhatsApp.
function saveToNetlify(form) {
  const data = new FormData(form);
  data.set('origem', leadSourceSummary());
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
    keepalive: true
  }).catch(() => {});
}

// ── Máscara de telefone ──
function maskPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function phoneIsValid(value) {
  const n = value.replace(/\D/g, '').length;
  return n === 10 || n === 11;
}
document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener('input', () => { input.value = maskPhone(input.value); });
});
document.querySelectorAll('.field-group input, .field-group select').forEach((el) => {
  el.addEventListener('input', () => el.classList.remove('invalid'));
  el.addEventListener('change', () => el.classList.remove('invalid'));
});

function markInvalid(fields) {
  let ok = true;
  fields.forEach(([el, valid]) => {
    el.classList.toggle('invalid', !valid);
    if (!valid && ok) { el.focus(); ok = false; }
  });
  return ok;
}

// ── Modais ──
let lastFocus = null;
function openModal(overlay) {
  lastFocus = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add('modal-open');
  const first = overlay.querySelector('select, input:not([type="hidden"]):not([name="bot-field"]), a.btn-primary');
  if (first) setTimeout(() => first.focus(), 50);
}
function closeModal(overlay) {
  overlay.hidden = true;
  if (!document.querySelector('.modal-overlay:not([hidden])')) document.body.classList.remove('modal-open');
  if (lastFocus) lastFocus.focus();
}
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) closeModal(overlay);
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay:not([hidden])').forEach(closeModal);
});

// ── Ligações ──
document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
  link.addEventListener('click', () => track('phone_click', { link_location: link.id || 'tel' }));
});

// ── Captura rápida antes do WhatsApp ──
// Todo botão de WhatsApp abre um mini formulário (serviço, nome, WhatsApp).
// O lead fica salvo no Netlify Forms mesmo se o visitante não enviar a mensagem.
const leadModal = document.getElementById('lead-modal');
const leadForm = document.getElementById('lead-form');
const leadService = document.getElementById('lead-servico');
const leadName = document.getElementById('lead-nome');
const leadPhone = document.getElementById('lead-wpp');
const leadError = document.getElementById('lead-error');
let leadOrigin = 'site';

function openLeadModal(origin, service) {
  leadOrigin = origin;
  if (service) {
    const match = Array.from(leadService.options).find((o) => o.value === service);
    if (match) leadService.value = service;
  }
  leadError.hidden = true;
  openModal(leadModal);
}

document.querySelectorAll('[data-wpp]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openLeadModal(link.dataset.wpp, link.dataset.service);
  });
});

leadForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const service = leadService.value;
  const name = leadName.value.trim();
  const phone = leadPhone.value.trim();

  const ok = markInvalid([[leadService, !!service], [leadName, !!name], [leadPhone, phoneIsValid(phone)]]);
  leadError.hidden = ok;
  if (!ok) return;

  saveToNetlify(leadForm);

  // Mantém o evento que o GTM já usa para o botão flutuante/WhatsApp.
  track('form_lead_telhado', { lead_nome: name, lead_wpp: phone, lead_servico: service, lead_origem: leadOrigin });
  track('whatsapp_click', { link_location: leadOrigin, service_type: service });

  const msg =
    `Oi, vim do site e quero um orçamento de telhado.\n\n` +
    `🔧 *Serviço:* ${service}\n` +
    `👤 *Nome:* ${name}\n` +
    `📱 *WhatsApp:* ${phone}`;

  openWhatsApp(whatsappUrl(msg), { name, phone }, { 'Serviço': service, 'Botão': leadOrigin });
  leadForm.reset();
  closeModal(leadModal);
});

// ── Serviços: carrossel (mobile) + modal de detalhes ──
const servicesGrid = document.getElementById('services-grid');
const serviceModal = document.getElementById('service-modal');
const serviceCta = document.getElementById('service-modal-cta');

if (servicesGrid) {
  const cards = Array.from(servicesGrid.querySelectorAll('.service-card'));

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      document.getElementById('service-modal-icon').innerHTML = card.querySelector('.service-icon').innerHTML;
      document.getElementById('service-modal-title').textContent = card.querySelector('h3').textContent;
      document.getElementById('service-modal-text').textContent = card.dataset.detail;
      serviceCta.dataset.service = card.dataset.service;
      track('service_modal_open', { service_name: card.dataset.service });
      openModal(serviceModal);
    });
  });

  // Ao pedir pelo modal do serviço, fecha o detalhe antes de abrir a captura.
  serviceCta.addEventListener('click', () => { serviceModal.hidden = true; }, true);

  const dotsWrap = document.getElementById('services-dots');
  cards.forEach((card, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);
  servicesGrid.addEventListener('scroll', () => {
    window.requestAnimationFrame(() => {
      const center = servicesGrid.scrollLeft + servicesGrid.offsetWidth / 2;
      let closest = 0;
      let min = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (dist < min) { min = dist; closest = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === closest));
    });
  }, { passive: true });
}

// ── Formulário de orçamento ──
const form = document.getElementById('form-orcamento');
const formError = document.getElementById('form-error');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nomeEl = document.getElementById('f-nome');
  const enderecoEl = document.getElementById('f-endereco');
  const wppEl = document.getElementById('f-wpp');
  const nome = nomeEl.value.trim();
  const endereco = enderecoEl.value.trim();
  const wpp = wppEl.value.trim();
  const tipo = form.querySelector('input[name="tipo"]:checked');
  const escada = form.querySelector('input[name="escada"]:checked');
  const agenda = form.querySelector('input[name="agenda"]:checked');

  const ok = markInvalid([[nomeEl, !!nome], [enderecoEl, !!endereco], [wppEl, phoneIsValid(wpp)]]);
  formError.hidden = ok;
  if (!ok) return;

  saveToNetlify(form);

  // ── Google Ads: conversão in-page ──
  gtag('event', 'conversion', { send_to: ADS_CONVERSION });

  // ── GTM: evento de envio de formulário ──
  track('form_lead_telhado', {
    lead_nome: nome,
    lead_wpp: wpp,
    lead_servico: tipo ? tipo.value : 'Não informado',
    lead_origem: 'formulario_sdr'
  });
  track('form_submit', { service_type: tipo ? tipo.value : 'Não informado' });

  const msg =
    `*📋 NOVO PEDIDO DE ORÇAMENTO*\n\n` +
    `👤 *Nome:* ${nome}\n` +
    `📍 *Endereço:* ${endereco}\n` +
    `📱 *WhatsApp:* ${wpp}\n` +
    `🔧 *Serviço:* ${tipo ? tipo.value : 'Não informado'}\n` +
    `🪜 *Escada necessária:* ${escada ? escada.value : 'Não informado'}\n` +
    `📅 *Disponibilidade:* ${agenda ? agenda.value : 'Não informado'}`;

  openWhatsApp(whatsappUrl(msg), { name: nome, phone: wpp }, {
    'Serviço': tipo ? tipo.value : 'Não informado',
    'Precisa de escada': escada ? escada.value : 'Não informado',
    'Disponibilidade': agenda ? agenda.value : 'Não informado'
  });
});

// ── Scroll reveal nos passos do processo ──
try {
  const flowSteps = document.querySelectorAll('.flow-step');
  const flowArrows = document.querySelectorAll('.flow-arrow');
  const progressDots = document.querySelectorAll('.flow-progress-dot');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      const idx = Array.from(flowSteps).indexOf(entry.target);
      if (idx >= 0) progressDots.forEach((dot, i) => dot.classList.toggle('active', i <= idx));
    });
  }, { threshold: 0.25 });

  flowSteps.forEach((step, i) => {
    step.style.transitionDelay = `${i * 0.12}s`;
    observer.observe(step);
  });

  const arrowObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.5 });
  flowArrows.forEach((a) => arrowObserver.observe(a));
} catch (e) {
  document.querySelectorAll('.flow-step, .flow-arrow').forEach((el) => el.classList.add('visible'));
}
