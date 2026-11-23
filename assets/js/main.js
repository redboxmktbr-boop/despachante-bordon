/**
 * Despachante Bordon — Script Principal (Leve, Zero Dependências, Core Web Vitals Ready)
 * - Captura automática de UTMs, GCLID (Google Ads) e FBCLID (Meta Ads)
 * - Disparo de eventos para dataLayer (GTM / Google Ads) e fbq (Meta Pixel)
 * - Formulários rápidos integrados diretamente ao WhatsApp oficial (19) 98205-4355
 * - Menu mobile acessível + banner LGPD leve
 */
(function () {
  'use strict';

  const WHATSAPP_NUMBER = '5519982054355';
  const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

  /* 1. Persistir parâmetros de campanhas Google Ads & Meta Ads */
  function captureCampaignParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const saved = JSON.parse(sessionStorage.getItem('bordon_ads_params') || '{}');
      let updated = false;

      TRACKING_KEYS.forEach((key) => {
        const val = params.get(key);
        if (val) {
          saved[key] = val;
          updated = true;
        }
      });

      if (updated) {
        sessionStorage.setItem('bordon_ads_params', JSON.stringify(saved));
      }
      return saved;
    } catch (e) {
      return {};
    }
  }

  const adsParams = captureCampaignParams();

  /* 2. Helper de rastreamento de conversões (Google Ads / GTM / GA4 / Meta Pixel) */
  function trackConversion(eventName, payload) {
    const eventData = Object.assign(
      {
        event: eventName,
        page_path: window.location.pathname,
        page_title: document.title,
      },
      adsParams,
      payload || {}
    );

    // Google Tag Manager / GA4 / Google Ads dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);

    // Meta Pixel (se configurado no site)
    if (typeof window.fbq === 'function') {
      if (eventName === 'generate_lead') {
        window.fbq('track', 'Lead', { content_name: eventData.service || 'Orcamento' });
      } else if (eventName === 'whatsapp_click' || eventName === 'phone_click') {
        window.fbq('track', 'Contact', { content_name: eventData.label || eventName });
      }
    }
  }

  /* 3. Rastrear cliques em WhatsApp e Telefone */
  document.addEventListener('click', function (e) {
    const waLink = e.target.closest('a[data-track="whatsapp"]');
    if (waLink) {
      trackConversion('whatsapp_click', {
        label: waLink.getAttribute('data-label') || 'whatsapp_cta',
        service: waLink.getAttribute('data-service') || 'geral',
      });
      return;
    }

    const phoneLink = e.target.closest('a[data-track="phone"]');
    if (phoneLink) {
      trackConversion('phone_click', {
        label: phoneLink.getAttribute('data-label') || 'phone_cta',
      });
    }
  });

  /* 4. Formulários de Cotação / Contato integrados ao WhatsApp + Tracking */
  const leadForms = document.querySelectorAll('form[data-bordon-form]');
  leadForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nome = (form.querySelector('[name="nome"]')?.value || '').trim();
      const telefone = (form.querySelector('[name="telefone"]')?.value || '').trim();
      const servico = (form.querySelector('[name="servico"]')?.value || 'Atendimento Geral').trim();
      const cidade = (form.querySelector('[name="cidade"]')?.value || '').trim();
      const placa = (form.querySelector('[name="placa"]')?.value || '').trim().toUpperCase();
      const mensagem = (form.querySelector('[name="mensagem"]')?.value || '').trim();

      if (!nome || !telefone) {
        alert('Por favor, informe seu nome e WhatsApp para agilizar o atendimento.');
        return;
      }

      // Dispara evento de conversão para Google Ads e Meta Ads
      trackConversion('generate_lead', {
        form_id: form.getAttribute('data-bordon-form'),
        service: servico,
        city: cidade || 'nao_informada',
      });

      const linhas = [
        'Olá, Despachante Bordon! Vim pelo site e gostaria de um orçamento:',
        '',
        '• *Nome:* ' + nome,
        '• *WhatsApp:* ' + telefone,
        '• *Serviço:* ' + servico,
      ];

      if (cidade) linhas.push('• *Cidade:* ' + cidade);
      if (placa) linhas.push('• *Placa / Veículo:* ' + placa);
      if (mensagem) linhas.push('• *Detalhes:* ' + mensagem);

      if (adsParams.utm_source || adsParams.gclid || adsParams.fbclid) {
        const origem = adsParams.gclid
          ? 'Google Ads'
          : adsParams.fbclid
          ? 'Meta Ads'
          : adsParams.utm_source;
        linhas.push('', '_Origem: ' + origem + '_');
      }

      const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(linhas.join('\n'));

      const feedback = form.querySelector('.form-feedback');
      if (feedback) {
        feedback.textContent = 'Redirecionando para o WhatsApp da Despachante Bordon...';
        feedback.style.color = '#15803D';
        feedback.style.fontWeight = '700';
        feedback.style.marginTop = '10px';
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  /* 5. Máscara simples para telefone/WhatsApp */
  document.querySelectorAll('input[name="telefone"]').forEach(function (input) {
    input.addEventListener('input', function () {
      let v = input.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      }
      input.value = v;
    });
  });

  /* 6. Header com sombra ao rolar */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 12) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      },
      { passive: true }
    );
  }

  /* 7. Menu Mobile acessível */
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* 8. Banner LGPD / Cookies (Google Ads & Meta Ads Compliance) */
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');
  if (cookieBanner && cookieAccept) {
    try {
      if (!localStorage.getItem('bordon_lgpd_ok')) {
        cookieBanner.classList.add('show');
      }
      cookieAccept.addEventListener('click', function () {
        localStorage.setItem('bordon_lgpd_ok', '1');
        cookieBanner.classList.remove('show');
      });
    } catch (e) {
      // ignore storage errors
    }
  }

  /* 9. Animação quadro a quadro da Timeline Horizontal ao entrar na tela */
  const timelines = document.querySelectorAll('[data-timeline]');
  if (timelines.length) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      timelines.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      timelines.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  /* 10. Scroll Reveal progressivo para seções e cards (leve, 60fps GPU) */
  const revealSelectors = [
    '.section-header',
    '.stat-item',
    '.service-card',
    '.why-visual',
    '.why-bordon-section .why-check-list li',
    '.pfpj-card',
    '.testimonial-card',
    '.faq-item',
    '.info-card',
    '.cta-box',
  ];

  const revealTargets = document.querySelectorAll(revealSelectors.join(', '));
  if (revealTargets.length) {
    // Aplicar stagger por grupo pai
    const parentCounters = new WeakMap();
    revealTargets.forEach(function (el) {
      const parent = el.parentElement;
      const idx = parent ? (parentCounters.get(parent) || 0) : 0;
      if (parent) parentCounters.set(parent, idx + 1);
      el.classList.add('reveal-item');
      el.style.setProperty('--reveal-delay', Math.min(idx * 0.08, 0.48).toFixed(2) + 's');
    });

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
      );

      revealTargets.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      revealTargets.forEach(function (el) {
        el.classList.add('is-revealed');
      });
    }
  }
})();
