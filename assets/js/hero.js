// JS DA SEÇÃO HERO 

// ===== HERO CAROUSEL — DINÂMICO (Firestore) =====
let heroProducts = [];
let heroCurrent = 0;
let heroAutoTimer;

// Aguarda o Firestore estar disponível (carregado pelo script.js)
function waitForFirestore(callback) {
  if (typeof db !== 'undefined') {
    callback();
  } else {
    setTimeout(() => waitForFirestore(callback), 100);
  }
}

// Carrega produtos com featured:true do Firestore
function loadFeaturedProducts() {
  waitForFirestore(() => {
    db.collection('products')
      .where('featured', '==', true)
      .onSnapshot(snapshot => {
        heroProducts = snapshot.docs.map(doc => doc.data());

        // Fallback: se não houver produtos em destaque, pega os 3 primeiros
        if (heroProducts.length === 0) {
          db.collection('products').orderBy('order').limit(3).get().then(snap => {
            heroProducts = snap.docs.map(doc => doc.data());
            renderCarousel();
          });
        } else {
          renderCarousel();
        }
      });
  });
}

// Renderiza os cards e dots do carrossel
function renderCarousel() {
  const track = document.getElementById('track');
  const dotsEl = document.getElementById('dots');
  if (!track || !dotsEl) return;

  heroCurrent = 0;

  // Paleta de gradientes por categoria
  const gradients = {
    whey:     'linear-gradient(135deg,#1a2a1a,#2a4a2a)',
    creatina: 'linear-gradient(135deg,#1a1a2a,#2a2a4a)',
    vitaminas:'linear-gradient(135deg,#1a2a1a,#3a4a1a)',
    pretreino:'linear-gradient(135deg,#2a1a0a,#4a2a0a)',
    kits:     'linear-gradient(135deg,#1a1a2a,#4a1a4a)',
  };

  const catLabels = {
  whey: 'Whey Protein', creatina: 'Creatina',
  vitaminas: 'Vitaminas', pretreino: 'Pré-Treino', kits: 'Kits'
};

  // Renderiza cards
  track.innerHTML = heroProducts.map(p => {
    const gradient = gradients[p.cat] || 'linear-gradient(135deg,#1a1a1a,#2a2a2a)';
    const catLabel = catLabels[p.cat] || p.cat;
    const discountHtml = p.oldPrice
      ? `<div class="discount-tag">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</div>`
      : '';
    const oldPriceHtml = p.oldPrice
      ? `<span class="price-old">R$ ${p.oldPrice.toFixed(2).replace('.', ',')}</span>`
      : '';
    const imgHtml = p.imageUrl
      ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:8px; background-color: #fff;">`
      : `<span style="font-size:64px">${p.emoji || '📦'}</span>`;

    return `
      <div class="product-card" onclick="openHeroModal(${p.id})">
        ${discountHtml}
        <div class="prod-img" style="background:${gradient}">${imgHtml}</div>
        <div class="prod-category">${catLabel}</div>
        <div class="prod-title">${p.name}</div>
        <div class="prod-desc">${p.desc}</div>
        <div class="prod-price">
          ${oldPriceHtml}
          <span class="price-new">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
        </div>
        <button class="btn-buy" onclick="event.stopPropagation();openHeroModal(${p.id})">
          Ver detalhes →
        </button>
      </div>`;
  }).join('');

  // Renderiza dots
  dotsEl.innerHTML = '';
  heroProducts.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goHeroSlide(i);
    dotsEl.appendChild(d);
  });

  updateHeroDots();
  resetHeroAuto();
}

// Navegação
function updateHeroDots() {
  document.querySelectorAll('#dots .dot').forEach((d, i) => {
    d.className = 'dot' + (i === heroCurrent ? ' active' : '');
  });
}

function goHeroSlide(n) {
  heroCurrent = n;
  const track = document.getElementById('track');
  if (track) track.style.transform = `translateX(-${heroCurrent * 280}px)`;
  updateHeroDots();
  resetHeroAuto();
}

function move(dir) {
  heroCurrent = (heroCurrent + dir + heroProducts.length) % (heroProducts.length || 1);
  goHeroSlide(heroCurrent);
}

function resetHeroAuto() {
  clearInterval(heroAutoTimer);
  if (heroProducts.length > 1) {
    heroAutoTimer = setInterval(() => move(1), 4000);
  }
}

// ===== MODAL DO HERO =====
function openHeroModal(productId) {
  // Busca o produto na lista do carrossel OU na lista global
  let p = heroProducts.find(x => x.id === productId);
  if (!p && typeof products !== 'undefined') {
    p = products.find(x => x.id === productId);
  }
  if (!p) return;

  const modal = document.getElementById('heroProductModal');
  const catLabels = {
    whey: 'Whey Protein', creatina: 'Creatina',
    vitaminas: 'Vitaminas', pretreino: 'Pré-Treino', kits: 'Kits'
  };
  const discountHtml = p.oldPrice
    ? `<div class="hero-modal-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}% OFF</div>`
    : '';
  const oldPriceHtml = p.oldPrice
    ? `<div class="hero-modal-old-price">De R$ ${p.oldPrice.toFixed(2).replace('.', ',')}</div>`
    : '';
  const imgHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;border-radius:14px;padding:8px; background-color: #fff;">`
    : `<span style="font-size:80px">${p.emoji || '📦'}</span>`;

  modal.querySelector('.hero-modal-img').innerHTML = imgHtml;
  modal.querySelector('.hero-modal-cat').textContent = catLabels[p.cat] || p.cat;
  modal.querySelector('.hero-modal-name').textContent = p.name;
  modal.querySelector('.hero-modal-desc').textContent = p.desc;
  modal.querySelector('.hero-modal-discount-wrap').innerHTML = discountHtml;
  modal.querySelector('.hero-modal-old-price-wrap').innerHTML = oldPriceHtml;
  modal.querySelector('.hero-modal-price').textContent =
    `R$ ${p.price.toFixed(2).replace('.', ',')}`;
  modal.querySelector('.hero-modal-add-btn').onclick = (e) => {
    if (typeof addToCart === 'function') {
      addToCart(p.id, e);
    }
    closeHeroModal();
  };

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeHeroModal() {
  document.getElementById('heroProductModal').classList.remove('show');
  document.body.style.overflow = '';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();

  // Fecha modal ao clicar no overlay
  const modal = document.getElementById('heroProductModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeHeroModal();
    });
  }

  // Fecha modal com ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeHeroModal();
  });
});