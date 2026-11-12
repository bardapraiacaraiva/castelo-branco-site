const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const BASE_PATH = document.body.dataset.basePath || '';

const toggle = $('.menu-toggle');
const nav = $('#main-nav');

function closeMenu() {
  if (!toggle || !nav) return;
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
    nav.classList.toggle('is-open', !open);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
}

const heroSearch = $('#hero-search');
heroSearch?.addEventListener('submit', event => {
  event.preventDefault();
  const params = new URLSearchParams();
  const neighborhood = $('#hero-neighborhood')?.value;
  const type = $('#hero-type')?.value;
  if (neighborhood) params.set('bairro', neighborhood);
  if (type) params.set('tipo', type);
  window.location.href = `venda.html${params.size ? `?${params}` : ''}`;
});

const neighborhoodFilter = $('#neighborhood-filter');
const typeFilter = $('#type-filter');
const priceFilter = $('#price-filter');
const catalogSearch = $('#catalog-search');
const catalogCount = $('#catalog-count');
const catalogEmpty = $('#catalog-empty');
const favoritesFilter = $('#favorites-filter');
const listingCards = $$('.listing');
let favoritesOnly = false;

function fillFilter(select, values) {
  if (!select) return;
  const unique = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const value of unique) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function filterCatalog() {
  if (!listingCards.length || !catalogCount) return;
  const neighborhood = neighborhoodFilter?.value || '';
  const type = typeFilter?.value || '';
  const maximumPrice = Number(priceFilter?.value || 0);
  const terms = normalize(catalogSearch?.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const card of listingCards) {
    const matchesNeighborhood = !neighborhood || card.dataset.neighborhood === neighborhood;
    const matchesType = !type || card.dataset.type === type;
    const matchesPrice = !maximumPrice || Number(card.dataset.price) <= maximumPrice;
    const words = normalize(card.dataset.search).split(/[^a-z0-9]+/).filter(Boolean);
    const matchesSearch = terms.every(term => words.some(word => term.length < 4 ? word === term : word.startsWith(term)));
    const matchesFavorites = !favoritesOnly || favorites.has(card.dataset.id);
    const show = matchesNeighborhood && matchesType && matchesPrice && matchesSearch && matchesFavorites;
    card.hidden = !show;
    card.classList.toggle('is-filtered-in', show);
    if (show) visible += 1;
  }
  catalogCount.textContent = `${visible} ${visible === 1 ? 'imóvel' : 'imóveis'}`;
  if (catalogEmpty) catalogEmpty.hidden = visible !== 0;
}

if (catalogCount) {
  fillFilter(neighborhoodFilter, listingCards.map(card => card.dataset.neighborhood));
  fillFilter(typeFilter, listingCards.map(card => card.dataset.type));
  const params = new URLSearchParams(window.location.search);
  if (neighborhoodFilter && params.has('bairro')) neighborhoodFilter.value = params.get('bairro');
  if (typeFilter && params.has('tipo')) typeFilter.value = params.get('tipo');
  if (priceFilter && params.has('preco')) priceFilter.value = params.get('preco');
  if (catalogSearch && params.has('q')) catalogSearch.value = params.get('q');
  for (const control of [neighborhoodFilter, typeFilter, priceFilter, catalogSearch]) {
    control?.addEventListener('input', filterCatalog);
    control?.addEventListener('change', filterCatalog);
  }
  $('#catalog-filters')?.addEventListener('submit', event => event.preventDefault());
  function resetCatalogFilters() {
    if (neighborhoodFilter) neighborhoodFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (catalogSearch) catalogSearch.value = '';
    favoritesOnly = false;
    favoritesFilter?.setAttribute('aria-pressed', 'false');
    filterCatalog();
  }
  $('#filter-reset')?.addEventListener('click', resetCatalogFilters);
  $('#empty-reset')?.addEventListener('click', resetCatalogFilters);
  favoritesFilter?.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    favoritesFilter.setAttribute('aria-pressed', String(favoritesOnly));
    filterCatalog();
  });
}

const carousel = $('#featured-track');
const carouselPrev = $('#carousel-prev');
const carouselNext = $('#carousel-next');

function updateCarouselControls() {
  if (!carousel) return;
  if (carouselPrev) carouselPrev.disabled = carousel.scrollLeft <= 4;
  if (carouselNext) carouselNext.disabled = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
}

function moveCarousel(direction) {
  if (!carousel) return;
  const card = $('.listing', carousel);
  const distance = card ? card.getBoundingClientRect().width + 24 : carousel.clientWidth * 0.8;
  carousel.scrollBy({ left: direction * distance, behavior: 'smooth' });
}

carouselPrev?.addEventListener('click', () => moveCarousel(-1));
carouselNext?.addEventListener('click', () => moveCarousel(1));
carousel?.addEventListener('scroll', updateCarouselControls, { passive: true });
window.addEventListener('resize', updateCarouselControls);
updateCarouselControls();

const lightbox = $('#lightbox');
const lightboxImage = $('#lightbox-image');
const lightboxCaption = $('#lightbox-caption');
let lightboxTrigger = null;

for (const button of $$('[data-lightbox-src]')) {
  button.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    lightboxTrigger = button;
    lightboxImage.src = button.dataset.lightboxSrc;
    lightboxImage.alt = button.dataset.lightboxAlt || '';
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.lightboxCaption || '';
    lightbox.showModal();
  });
}

$('.lightbox__close')?.addEventListener('click', () => lightbox?.close());
lightbox?.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});
lightbox?.addEventListener('close', () => {
  if (lightboxImage) lightboxImage.src = '';
  lightboxTrigger?.focus();
});

const FAVORITES_KEY = 'castelo-branco:favorites:v1';
let storageAvailable = true;
let favorites = new Set();
try {
  const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  if (Array.isArray(stored)) favorites = new Set(stored.filter(value => typeof value === 'string'));
} catch {
  storageAvailable = false;
}

const selectionDrawer = $('#selection-drawer');
const selectionItems = $('#selection-items');
const selectionEmpty = $('#selection-empty');
const selectionContact = $('#selection-contact');
const selectionCount = $('#selection-count');
let listingIndex = new Map(listingCards.map(card => [card.dataset.id, {
  id: card.dataset.id,
  title: $('h2, h3', card)?.textContent || card.dataset.id,
  price: $('.listing__price', card)?.textContent || '',
  image: $('.listing__image-button img', card)?.getAttribute('src') || '',
  alt: $('.listing__image-button img', card)?.alt || '',
}]));

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites].sort()));
  } catch {
    storageAvailable = false;
  }
}

function syncFavoriteButtons() {
  for (const button of $$('[data-favorite]')) {
    const selected = favorites.has(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(selected));
    const label = $('.favorite-button__label', button);
    if (label) label.textContent = selected ? 'Guardado' : 'Guardar';
    const title = listingIndex.get(button.dataset.favorite)?.title || button.dataset.favorite;
    button.setAttribute('aria-label', `${selected ? 'Remover' : 'Guardar'} ${title}`);
  }
  if (selectionCount) {
    selectionCount.textContent = String(favorites.size);
    selectionCount.setAttribute('aria-label', `${favorites.size} ${favorites.size === 1 ? 'imóvel favorito' : 'imóveis favoritos'}`);
  }
  if (!storageAvailable) {
    const intro = $('.selection-drawer__intro');
    if (intro) intro.textContent = 'O navegador bloqueou o armazenamento. A seleção ficará disponível apenas nesta sessão.';
  }
}

function renderSelection() {
  if (!selectionItems) return;
  selectionItems.replaceChildren();
  const selected = [...favorites].map(id => listingIndex.get(id)).filter(Boolean);
  for (const item of selected) {
    const article = document.createElement('article');
    article.className = 'selection-item';
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.alt;
    image.width = 80;
    image.height = 80;
    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = item.title;
    const price = document.createElement('p');
    price.textContent = item.price;
    content.append(title, price);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.removeFavorite = item.id;
    remove.setAttribute('aria-label', `Remover ${item.title} da seleção`);
    remove.textContent = '×';
    article.append(image, content, remove);
    selectionItems.appendChild(article);
  }
  if (selectionEmpty) selectionEmpty.hidden = selected.length > 0;
  if (selectionContact) {
    const params = new URLSearchParams();
    if (selected.length) {
      params.set('imoveis', selected.map(item => item.id).join(','));
      selectionContact.href = `${BASE_PATH}contato.html?${params}`;
    } else {
      selectionContact.removeAttribute('href');
    }
    selectionContact.setAttribute('aria-disabled', String(selected.length === 0));
  }
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  saveFavorites();
  syncFavoriteButtons();
  renderSelection();
  if (favoritesOnly) filterCatalog();
}

document.addEventListener('click', event => {
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);
  const removeButton = event.target.closest('[data-remove-favorite]');
  if (removeButton) toggleFavorite(removeButton.dataset.removeFavorite);
});

let selectionTrigger = null;
$('#selection-open')?.addEventListener('click', event => {
  if (!selectionDrawer) return;
  selectionTrigger = event.currentTarget;
  renderSelection();
  selectionDrawer.showModal();
});
$('#selection-close')?.addEventListener('click', () => selectionDrawer?.close());
selectionDrawer?.addEventListener('click', event => {
  if (event.target === selectionDrawer) {
    const rect = selectionDrawer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) selectionDrawer.close();
  }
});
selectionDrawer?.addEventListener('close', () => selectionTrigger?.focus());

syncFavoriteButtons();
renderSelection();
filterCatalog();

const contactForm = $('#contact-form');
const params = new URLSearchParams(window.location.search);
const requestedIds = [...new Set([...(params.get('imoveis') || '').split(','), params.get('imovel') || ''])].filter(Boolean);

fetch(`${BASE_PATH}listings.json`)
  .then(response => {
    if (!response.ok) throw new Error('Catálogo indisponível');
    return response.json();
  })
  .then(items => {
    listingIndex = new Map(items.map(item => [item.id, {
      id: item.id,
      title: item.title,
      price: item.price,
      image: `${BASE_PATH}assets/listings/${item.id}.webp`,
      alt: item.alt,
    }]));
    syncFavoriteButtons();
    renderSelection();
    if (contactForm && requestedIds.length) {
      const selected = requestedIds.map(id => listingIndex.get(id)).filter(Boolean);
      if (selected.length) {
        const message = $('#contact-message');
        const introduction = `Gostaria de conversar sobre ${selected.length === 1 ? 'este imóvel' : 'estes imóveis'}:\n${selected.map(item => `${item.id} — ${item.title} — ${item.price}`).join('\n')}\n\n`;
        if (message && !message.value.trim()) message.value = introduction;
      }
    }
  })
  .catch(() => {
    const intro = $('.selection-drawer__intro');
    if (intro) intro.textContent = 'Não foi possível atualizar os dados dos imóveis. A seleção desta página continua disponível; para confirmar informações, fale com o escritório.';
    if (contactForm && requestedIds.length) {
      const status = $('#contact-status');
      if (status) status.textContent = 'Não foi possível preencher os dados do imóvel automaticamente. Escreva sua mensagem ou ligue para 21 2549.7774.';
    }
  });

contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const name = String(data.get('name') || '');
  const phone = String(data.get('phone') || '');
  const email = String(data.get('email') || '');
  const message = String(data.get('message') || '');
  const subject = encodeURIComponent(`Contato pelo website — ${name}`);
  const body = encodeURIComponent(`Nome: ${name}\nTelefone: ${phone}\nE-mail: ${email}\n\n${message}`);
  const status = $('#contact-status');
  if (status) status.textContent = 'Mensagem preparada no seu programa de email.';
  window.location.href = `mailto:contato@castelobrancoimoveis.com?subject=${subject}&body=${body}`;
});
