// JAVASCRIPT PRINCIPAL

// ===== FIREBASE CONFIG =====
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== DATA =====
const DEFAULT_PRODUCTS = [
  { id: 1, order: 0, name: 'Whey Gold Standard', cat: 'whey', desc: '100% Whey Protein, 24g de proteína por dose. Sabor Baunilha e Chocolate.', price: 219.90, oldPrice: 259.90, emoji: '🥛', badge: 'hot' },
  { id: 2, order: 1, name: 'Whey Isolado Premium', cat: 'whey', desc: 'Whey isolado de alta pureza, zero lactose, 27g proteína por dose.', price: 289.90, oldPrice: null, emoji: '💪', badge: 'new' },
  { id: 3, order: 2, name: 'Whey Concentrado 3kg', cat: 'whey', desc: 'Excelente custo-benefício, 22g proteína por dose, 3kg de resultado.', price: 179.90, oldPrice: 199.90, emoji: '🏋️', badge: 'sale' },
  { id: 4, order: 3, name: 'Whey Concentrado 3kg', cat: 'whey', desc: 'Excelente custo-benefício, 22g proteína por dose, 3kg de resultado.', price: 179.90, oldPrice: 199.90, emoji: '🏋️', badge: 'sale' },
  { id: 5, order: 4, name: 'Creatina Monohidratada', cat: 'creatina', desc: '5g por dose, pureza superior a 99,9%, sem sabor, fácil dissolução.', price: 89.90, oldPrice: null, emoji: '⚡', badge: 'hot' },
  { id: 6, order: 5, name: 'Creatina HCL', cat: 'creatina', desc: 'Forma mais concentrada e absorvível de creatina. Sem retenção hídrica.', price: 129.90, oldPrice: 149.90, emoji: '🔋', badge: 'new' },
  { id: 7, order: 6, name: 'Creatina + Cafeína', cat: 'creatina', desc: 'Stack de pré-treino com creatina e cafeína natural para máxima performance.', price: 119.90, oldPrice: null, emoji: '💥', badge: null },
  { id: 8, order: 7, name: 'Creatina + Cafeína', cat: 'creatina', desc: 'Stack de pré-treino com creatina e cafeína natural para máxima performance.', price: 119.90, oldPrice: null, emoji: '💥', badge: null },
  { id: 9, order: 8, name: 'Vitamina D3 + K2', cat: 'vitaminas', desc: 'Combo essencial para saúde óssea, imunidade e performance muscular.', price: 49.90, oldPrice: null, emoji: '☀️', badge: 'new' },
  { id: 10, order: 9, name: 'Multivitamínico Sport', cat: 'vitaminas', desc: 'Complexo completo com 23 vitaminas e minerais para atletas.', price: 69.90, oldPrice: 89.90, emoji: '🌿', badge: 'sale' },
  { id: 11, order: 10, name: 'Ômega 3 Fish Oil', cat: 'vitaminas', desc: '2000mg por dose, alta concentração de EPA e DHA, sem gosto de peixe.', price: 59.90, oldPrice: null, emoji: '🐟', badge: null },
  { id: 12, order: 11, name: 'Vitamina C 1000mg', cat: 'vitaminas', desc: 'Imunidade reforçada, ação antioxidante poderosa, liberação prolongada.', price: 39.90, oldPrice: null, emoji: '🍊', badge: null },
  { id: 13, order: 12, name: 'Kit Iniciante Power', cat: 'kits', desc: 'Whey Concentrado + Creatina + Multivitamínico. Tudo que você precisa para começar.', price: 299.90, oldPrice: 369.70, emoji: '📦', badge: 'kit' },
  { id: 14, order: 13, name: 'Kit Performance Elite', cat: 'kits', desc: 'Whey Isolado + Creatina HCL + Vitamina D3 + Ômega 3. Para atletas sérios.', price: 479.90, oldPrice: 589.60, emoji: '🏆', badge: 'kit' },
  { id: 15, order: 14, name: 'Kit Saúde & Força', cat: 'kits', desc: 'Whey Gold + Multivitamínico Sport + Vitamina C. Saúde completa.', price: 319.90, oldPrice: 389.70, emoji: '💚', badge: 'kit' },
  { id: 16, order: 15, name: 'Kit Creatina & Energia', cat: 'kits', desc: 'Creatina Monohidratada + Creatina + Cafeína. Dupla de performance.', price: 199.90, oldPrice: 249.80, emoji: '⚡', badge: 'kit' },
];

const WHATSAPP_NUMBER = '5581986953009';
const INITIAL_SHOW = 8;

// ===== CLOUDINARY =====
const CLOUDINARY_CLOUD_NAME = 'ddojjqwky';
const CLOUDINARY_UPLOAD_PRESET = 'powernutri_upload';

// ===== STATE =====
let products = [];
let cart = JSON.parse(localStorage.getItem('pn_cart') || '[]');
let currentFilter = 'all';
let shownCount = INITIAL_SHOW;
let editingId = null;
let currentUser = null;
let sortableInstance = null;

function saveCart() { localStorage.setItem('pn_cart', JSON.stringify(cart)); }

// ===== FIRESTORE - PRODUTOS =====
function loadProductsFromFirestore() {
  db.collection('products').orderBy('order').onSnapshot(snapshot => {
    if (snapshot.empty) {
      const batch = db.batch();
      DEFAULT_PRODUCTS.forEach(p => {
        const ref = db.collection('products').doc(String(p.id));
        batch.set(ref, p);
      });
      batch.commit().then(() => showToast('Produtos inicializados!'));
    } else {
      products = snapshot.docs.map(doc => doc.data());
      renderProducts();
      if (document.getElementById('adminOverlay').classList.contains('show')) {
        renderAdminList();
      }
    }
  });
}

function saveProductToFirestore(product) {
  return db.collection('products').doc(String(product.id)).set(product);
}

function deleteProductFromFirestore(id) {
  return db.collection('products').doc(String(id)).delete();
}

// Salva a nova ordem de todos os produtos no Firestore
function saveOrderToFirestore(orderedProducts) {
  const batch = db.batch();
  orderedProducts.forEach((p, index) => {
    const ref = db.collection('products').doc(String(p.id));
    batch.update(ref, { order: index });
  });
  return batch.commit();
}

// ===== AUTH =====
function openLoginModal() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginError').textContent = '';
  document.getElementById('login_email').value = '';
  document.getElementById('login_password').value = '';
}

function closeLoginModal() {
  document.getElementById('loginOverlay').style.display = 'none';
}

function doLogin() {
  const email = document.getElementById('login_email').value.trim();
  const password = document.getElementById('login_password').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Preencha email e senha.'; return; }
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      closeLoginModal();
      openAdmin();
    })
    .catch(() => {
      errEl.textContent = 'Email ou senha incorretos.';
    });
}

function doLogout() {
  auth.signOut().then(() => {
    closeAdmin();
    showToast('Logout realizado!');
  });
}

auth.onAuthStateChanged(user => {
  currentUser = user;
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';
});

// ===== RENDER =====
function getFiltered() {
  if (currentFilter === 'all') return products;
  return products.filter(p => p.cat === currentFilter);
}

function getCategories() {
  const cats = ['whey', 'creatina', 'vitaminas', 'pre-treino', 'kits'];
  const labels = { whey: '💪 Whey Protein', creatina: '⚡ Creatina', vitaminas: '🌿 Vitaminas', pretreino: '🏋️‍♂️ Pré-Treino', kits: '📦 Kits' };
  return cats.map(c => ({ id: c, label: labels[c] }));
}


function renderProducts() {
  const root = document.getElementById('catalogRoot');
  const filtered = getFiltered();
  const toShow = filtered.slice(0, shownCount);
  const loadWrap = document.getElementById('loadMoreWrap');
  const countEl = document.getElementById('productCount');

  countEl.textContent = `${filtered.length} produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

  root.innerHTML = `<div class="product-grid">${toShow.map(p => productCard(p)).join('')}</div>`;
  loadWrap.style.display = filtered.length > shownCount ? 'flex' : 'none';
}


function productCard(p) {
  const badgeHtml = p.badge ? `<div class="product-badge badge-${p.badge}">${{ new: 'Novo', hot: 'Hot', kit: 'Kit', sale: 'Oferta' }[p.badge]}</div>` : '';
  const oldPriceHtml = p.oldPrice ? `<div class="product-price-old">R$ ${p.oldPrice.toFixed(2).replace('.', ',')}</div>` : '';
  const imgHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : `<span style="font-size:48px">${p.emoji || '📦'}</span>`;
  return `<div class="product-card" data-id="${p.id}">
    <div class="product-img">${imgHtml}${badgeHtml}</div>
    <div class="product-info">
      <div class="product-category">${{ whey: 'Whey Protein', creatina: 'Creatina', vitaminas: 'Vitaminas', pretreino: 'Pré-Treino', kits: 'Kits' }[p.cat]}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-footer">
        <div>
          ${oldPriceHtml}
          <div class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
        </div>
        <button class="add-cart-btn" onclick="addToCart(${p.id},event)" title="Adicionar ao carrinho">Adicionar</button>
      </div>
    </div>
  </div>`;
}

function loadMore() {
  shownCount += 8;
  renderProducts();
}

// ===== FILTER =====
function filterCat(cat, el) {
  currentFilter = cat;
  shownCount = INITIAL_SHOW;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.mobile-menu a').forEach(a => a.classList.remove('active'));
  if (el) {
    el.classList.add('active');
    document.querySelectorAll('.cat-tab').forEach(t => {
      const tcb = t.getAttribute('onclick');
      if (tcb && tcb.includes(`'${cat}'`)) t.classList.add('active');
    });
  }
  renderProducts();
  setTimeout(() => { document.getElementById('produtos').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

// ===== CART =====
function addToCart(id, e) {
  e.stopPropagation();
  const prod = products.find(p => p.id === id);
  if (!prod) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, name: prod.name, cat: prod.cat, price: prod.price, emoji: prod.emoji || '📦', imageUrl: prod.imageUrl || null, qty: 1 });
  saveCart();
  updateCartIcon();
  showToast(`${prod.imageUrl ? '🛒' : (prod.emoji || '📦')} ${prod.name} adicionado!`);
}

function updateCartIcon() {
  const total = cart.reduce((a, c) => a + c.qty, 0);
  const el = document.getElementById('cartCount');
  el.textContent = total;
  el.classList.toggle('show', total > 0);
}

function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('show');
  document.getElementById('cartPanel').classList.toggle('show');
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (cart.length === 0) {
    el.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Seu carrinho está vazio.<br>Adicione produtos para continuar.</p></div>`;
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  el.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${c.imageUrl
          ? `<img src="${c.imageUrl}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`
          : (c.emoji || '📦')}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-cat">${{ whey: 'Whey', creatina: 'Creatina', vitaminas: 'Vitamina', kits: 'Kit' }[c.cat]}</div>
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-price">R$ ${(c.price * c.qty).toFixed(2).replace('.', ',')}</div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
          <button class="remove-btn" onclick="removeItem(${c.id})">Remover</button>
        </div>
      </div>
    </div>`).join('');
  document.getElementById('cartSummary').innerHTML = `
    <div class="cart-row"><span>Subtotal</span><span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span></div>
    <div class="cart-row"><span>Frete</span><span>${subtotal >= 150 ? 'Grátis' : 'A calcular'}</span></div>
    <div class="cart-row total"><span>Total</span><span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span></div>`;
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartIcon();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartIcon();
  renderCart();
}

// ===== CHECKOUT =====
function openCheckout() {
  if (cart.length === 0) return;
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  document.getElementById('orderSummaryBox').innerHTML = `
    <div class="order-summary-title">Resumo do Pedido</div>
    ${cart.map(c => `<div class="order-item-line"><span>${c.emoji || '📦'} ${c.name} x${c.qty}</span><span>R$ ${(c.price * c.qty).toFixed(2).replace('.', ',')}</span></div>`).join('')}
    <div class="order-total-line"><span>Total</span><span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span></div>`;
  document.getElementById('checkoutOverlay').classList.add('show');
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('show');
}

function onPaymentChange() {
  const val = document.getElementById('f_payment').value;
  document.getElementById('pixNotice').classList.toggle('show', val === 'pix');
}

function sendWhatsApp() {
  const name = document.getElementById('f_name').value.trim();
  const addr = document.getElementById('f_addr').value.trim();
  const payment = document.getElementById('f_payment').value;
  const obs = document.getElementById('f_obs').value.trim();
  if (!name || !addr || !payment) { showToast('⚠ Preencha todos os campos obrigatórios!'); return; }
  const paymentLabels = { pix: 'Pix (5% desconto)', cartao: 'Cartão de Crédito', boleto: 'Boleto Bancário' };
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discount = payment === 'pix' ? subtotal * 0.05 : 0;
  const total = subtotal - discount;
  let msg = `🛒 *NOVO PEDIDO - PowerNutri*\n\n`;
  msg += `👤 *Cliente:* ${name}\n`;
  msg += `📍 *Endereço:* ${addr}\n`;
  msg += `💳 *Pagamento:* ${paymentLabels[payment]}\n\n`;
  msg += `*PRODUTOS:*\n`;
  cart.forEach(c => { msg += `${c.emoji || '📦'} ${c.name} x${c.qty} — R$ ${(c.price * c.qty).toFixed(2).replace('.', ',')}\n`; });
  msg += `\n💰 *Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  if (discount > 0) msg += `\n🎉 *Desconto Pix (5%):* -R$ ${discount.toFixed(2).replace('.', ',')}`;
  msg += `\n✅ *Total:* R$ ${total.toFixed(2).replace('.', ',')}`;
  if (obs) msg += `\n\n📝 *Obs:* ${obs}`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cart = []; saveCart(); updateCartIcon();
  closeCheckout();
  document.getElementById('cartOverlay').classList.remove('show');
  document.getElementById('cartPanel').classList.remove('show');
  showToast('✅ Pedido enviado com sucesso!');
}

// ===== MOBILE MENU =====
function toggleMobile() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('hamburger');
  menu.classList.toggle('show');
  btn.classList.toggle('open');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('show');
  document.getElementById('hamburger').classList.remove('open');
}

// ===== ADMIN =====
function openAdmin() {
  if (!currentUser) { openLoginModal(); return; }
  document.getElementById('adminOverlay').classList.add('show');
  renderAdminList();
}
function closeAdmin() { document.getElementById('adminOverlay').classList.remove('show'); }

function adminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('adminListView').style.display = tab === 'list' ? '' : 'none';
  document.getElementById('adminAddView').style.display = tab === 'add' ? '' : 'none';
  if (tab === 'add') { resetAdminForm(); }
  if (tab === 'list') { initSortable(); }
}

// ===== CLOUDINARY UPLOAD =====
function openCloudinaryUpload() {
  const widget = cloudinary.createUploadWidget(
    {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      sources: ['local', 'camera'],
      multiple: false,
      maxFileSize: 5000000,
      cropping: false,
      language: 'pt',
      styles: { palette: { action: '#4f46e5' } }
    },
    (error, result) => {
      if (!error && result.event === 'success') {
        const url = result.info.secure_url;
        document.getElementById('ap_image').value = url;
        const preview = document.getElementById('ap_image_preview');
        preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;">`;
      }
    }
  );
  widget.open();
}

// ===== ADMIN LIST + SORTABLE =====
function renderAdminList() {
  const el = document.getElementById('adminListView');
  if (products.length === 0) {
    el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:40px">Nenhum produto cadastrado.</p>';
    return;
  }
  el.innerHTML = `
    <p style="color:var(--gray);font-size:13px;text-align:center;padding:8px 0 4px;">
      ☰ Arraste os produtos para reordenar
    </p>
    <div class="admin-grid" id="sortableList">
      ${products.map(p => `
        <div class="admin-product-item" data-id="${p.id}" style="cursor:grab;">
          <div style="color:var(--gray);font-size:18px;padding-right:8px;cursor:grab;">☰</div>
          <div class="admin-product-emoji">
            ${p.imageUrl
              ? `<img src="${p.imageUrl}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">`
              : `<span style="font-size:32px">${p.emoji || '📦'}</span>`}
          </div>
          <div class="admin-product-info">
            <div class="admin-product-cat">${{ whey: 'Whey Protein', creatina: 'Creatina', vitaminas: 'Vitaminas', pretreino: '🏋️‍♂️ Pré-Treino', kits: 'Kits' }[p.cat]}</div>
            <div class="admin-product-name">${p.name}</div>
            <div class="admin-product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
          </div>
          <div class="admin-product-actions">
            <button class="edit-btn" onclick="editProduct(${p.id})">✏ Editar</button>
            <button class="del-btn" onclick="deleteProduct(${p.id})">🗑</button>
          </div>
        </div>`).join('')}
    </div>`;
  initSortable();
}

function initSortable() {
  const listEl = document.getElementById('sortableList');
  if (!listEl) return;
  if (sortableInstance) sortableInstance.destroy();
  sortableInstance = new Sortable(listEl, {
    animation: 150,
    handle: '.admin-product-item',
    ghostClass: 'sortable-ghost',
    delay: 300,           // aguarda 300ms antes de ativar o drag
    delayOnTouchOnly: true, // delay só em dispositivos touch, no desktop funciona normal
    touchStartThreshold: 5,
    onEnd: () => {
      const items = listEl.querySelectorAll('.admin-product-item');
      const orderedProducts = [];
      items.forEach(item => {
        const id = parseInt(item.getAttribute('data-id'));
        const prod = products.find(p => p.id === id);
        if (prod) orderedProducts.push(prod);
      });
      saveOrderToFirestore(orderedProducts).then(() => {
        showToast('Ordem salva!');
      });
    }
  });
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('ap_name').value = p.name;
  document.getElementById('ap_cat').value = p.cat;
  document.getElementById('ap_desc').value = p.desc;
  document.getElementById('ap_price').value = p.price;
  document.getElementById('ap_old').value = p.oldPrice || '';
  document.getElementById('ap_badge').value = p.badge || '';
  document.getElementById('ap_featured').checked = p.featured === true; // ← NOVO
  document.getElementById('ap_editId').value = id;
  const preview = document.getElementById('ap_image_preview');
  if (p.imageUrl) {
    document.getElementById('ap_image').value = p.imageUrl;
    preview.innerHTML = `<img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    document.getElementById('ap_image').value = '';
    preview.innerHTML = `<span style="font-size:28px">📷</span>`;
  }
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab')[1].classList.add('active');
  document.getElementById('adminListView').style.display = 'none';
  document.getElementById('adminAddView').style.display = '';
}

function deleteProduct(id) {
  if (!confirm('Excluir este produto?')) return;
  deleteProductFromFirestore(id).then(() => {
    showToast('Produto excluído!');
  });
}

function saveProduct() {
  const name = document.getElementById('ap_name').value.trim();
  const cat = document.getElementById('ap_cat').value;
  const desc = document.getElementById('ap_desc').value.trim();
  const price = parseFloat(document.getElementById('ap_price').value);
  const old = parseFloat(document.getElementById('ap_old').value) || null;
  const imageUrl = document.getElementById('ap_image').value.trim() || null;
  const badge = document.getElementById('ap_badge').value || null;
  const featured = document.getElementById('ap_featured').checked; // ← NOVO
  if (!name || !cat || !price) { showToast('⚠ Preencha nome, categoria e preço!'); return; }
  const eid = document.getElementById('ap_editId').value;
  const id = eid ? parseInt(eid) : Date.now();
  const existing = eid ? products.find(p => p.id === parseInt(eid)) : null;
  // Novo produto sempre vai para o final da lista
  const order = existing ? existing.order : (products.length > 0 ? Math.max(...products.map(p => p.order ?? 0)) + 1 : 0);
  const product = { ...(existing || {}), id, order, name, cat, desc, price, oldPrice: old, imageUrl, badge, featured }; // ← NOVO: featured adicionado
  saveProductToFirestore(product).then(() => {
    resetAdminForm();
    document.querySelectorAll('.admin-tab')[0].click();
    showToast(eid ? 'Produto atualizado!' : 'Produto adicionado!');
  });
}

function resetAdminForm() {
  editingId = null;
  ['ap_name', 'ap_desc', 'ap_price', 'ap_old', 'ap_editId', 'ap_image'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ap_cat').value = 'whey';
  document.getElementById('ap_badge').value = '';
  document.getElementById('ap_featured').checked = false; // ← NOVO
  document.getElementById('ap_image_preview').innerHTML = `<span style="font-size:28px">📷</span>`;
}

// ===== TOAST =====
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadProductsFromFirestore();
  updateCartIcon();

  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) nav.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,.5)' : 'none';
  });

  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMobile(); });

  const adminOverlay = document.getElementById('adminOverlay');
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const loginOverlay = document.getElementById('loginOverlay');
  if (adminOverlay) adminOverlay.addEventListener('click', function (e) { if (e.target === this) closeAdmin(); });
  if (checkoutOverlay) checkoutOverlay.addEventListener('click', function (e) { if (e.target === this) closeCheckout(); });
  if (loginOverlay) loginOverlay.addEventListener('click', function (e) { if (e.target === this) closeLoginModal(); });
});