// UI — DOM-based overlays (menu, shop, how-to, pause, gameover) + toasts.
// Canvas handles in-game HUD; this file only handles chrome around it.

import { SKINS, getSkin } from './Skins.js';
import { ABILITY_DEFS } from './AbilitySystem.js';
import { Player } from './Player.js';

export class UI {
  constructor(root, storage) {
    this.root = root;
    this.storage = storage;
    this.game = null;

    this.screens = {
      menu: root.querySelector('[data-screen="menu"]'),
      shop: root.querySelector('[data-screen="shop"]'),
      how: root.querySelector('[data-screen="how"]'),
      pause: root.querySelector('[data-screen="pause"]'),
      gameover: root.querySelector('[data-screen="gameover"]'),
    };
    this.pauseBtn = root.querySelector('.pause-btn');
    this.toastStack = root.querySelector('.toast-stack');

    this._bindActions();
  }

  bindGame(game) { this.game = game; }

  _bindActions() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      this._handleAction(action, btn);
    });
  }

  _handleAction(action) {
    switch (action) {
      case 'play':
        this.hideOverlays();
        this.pauseBtn.hidden = false;
        this.game.beginRun();
        break;
      case 'shop':
        this._renderShop();
        this.showScreen('shop');
        break;
      case 'how':
        this.showScreen('how');
        break;
      case 'back':
      case 'menu':
        this.showMenu();
        break;
      case 'pause':
        this.game.togglePause();
        break;
      case 'resume':
        this.game.togglePause();
        break;
      case 'restart':
        this.hideOverlays();
        this.pauseBtn.hidden = false;
        this.game.beginRun();
        break;
    }
  }

  showScreen(name) {
    for (const [k, el] of Object.entries(this.screens)) el.hidden = (k !== name);
    this.pauseBtn.hidden = true;
    this._refreshMenuStats();
  }

  hideOverlays() {
    for (const el of Object.values(this.screens)) el.hidden = true;
  }

  showMenu() {
    this.showScreen('menu');
    this._refreshMenuStats();
  }

  showPause() {
    this.screens.pause.hidden = false;
    this.pauseBtn.hidden = true;
  }

  showGameOver({ score, runCoins, best }) {
    const s = this.screens.gameover;
    s.querySelector('[data-field="score"]').textContent = score.toLocaleString('ar-EG');
    s.querySelector('[data-field="runCoins"]').textContent = runCoins.toLocaleString('ar-EG');
    s.querySelector('[data-field="best"]').textContent = best.toLocaleString('ar-EG');
    this.pauseBtn.hidden = true;
    s.hidden = false;
  }

  onGameStart() {
    this.hideOverlays();
    this.pauseBtn.hidden = false;
  }

  _refreshMenuStats() {
    for (const el of this.root.querySelectorAll('[data-field="coins"]')) {
      el.textContent = (this.storage.get('coins') || 0).toLocaleString('ar-EG');
    }
    for (const el of this.root.querySelectorAll('[data-field="best"]')) {
      el.textContent = (this.storage.get('best') || 0).toLocaleString('ar-EG');
    }
  }

  pingCoin() {
    // Light animation on any visible coin counter
    for (const el of this.root.querySelectorAll('[data-field="coins"]')) {
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
        { duration: 240, easing: 'ease-out' },
      );
    }
  }

  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    this.toastStack.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  // --- Shop rendering ---
  _renderShop() {
    const shop = this.screens.shop;
    this._refreshMenuStats();

    // Skins
    const skinsGrid = shop.querySelector('[data-grid="skins"]');
    skinsGrid.innerHTML = '';
    const equipped = this.storage.get('equippedSkin');
    const owned = this.storage.get('ownedSkins');

    for (const skin of Object.values(SKINS)) {
      const card = document.createElement('div');
      card.className = 'card';
      const isOwned = owned.includes(skin.id);
      const isEquipped = equipped === skin.id;
      if (isOwned) card.classList.add('owned');
      if (isEquipped) card.classList.add('equipped');

      const preview = document.createElement('div');
      preview.className = 'preview';
      const pc = document.createElement('canvas');
      pc.width = 140; pc.height = 90;
      preview.appendChild(pc);
      const pctx = pc.getContext('2d');
      Player.renderPreview(pctx, skin.id, 70, 20, 0.9);

      const name = document.createElement('div'); name.className = 'name'; name.textContent = skin.name;
      const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = skin.desc;
      const footer = document.createElement('div'); footer.className = 'footer';
      const price = document.createElement('div'); price.className = 'price';
      const action = document.createElement('button');

      if (isOwned) {
        price.textContent = '';
        action.textContent = isEquipped ? 'مُجهز' : 'تجهيز';
        action.disabled = isEquipped;
        action.addEventListener('click', () => {
          this.storage.set('equippedSkin', skin.id);
          this.game.player.setSkin(skin.id);
          this._renderShop();
        });
      } else {
        price.textContent = `${skin.price.toLocaleString('ar-EG')} ♦`;
        action.textContent = 'شراء';
        action.disabled = this.storage.get('coins') < skin.price;
        action.addEventListener('click', () => {
          if (!this.storage.spendCoins(skin.price)) return;
          this.storage.ownSkin(skin.id);
          this.storage.set('equippedSkin', skin.id);
          this.game.player.setSkin(skin.id);
          this.toast(`فتحت زيّ ${skin.name}`);
          this._renderShop();
        });
      }

      footer.appendChild(price);
      footer.appendChild(action);
      card.appendChild(preview);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(footer);
      skinsGrid.appendChild(card);
    }

    // Abilities
    const abGrid = shop.querySelector('[data-grid="abilities"]');
    abGrid.innerHTML = '';
    const ownedAb = this.storage.get('ownedAbilities');
    for (const def of Object.values(ABILITY_DEFS)) {
      const card = document.createElement('div');
      card.className = 'card';
      const isOwned = ownedAb.includes(def.id);
      if (isOwned) card.classList.add('owned');

      const preview = document.createElement('div');
      preview.className = 'preview';
      const pc = document.createElement('canvas');
      pc.width = 140; pc.height = 90;
      preview.appendChild(pc);
      this._drawAbilityIcon(pc.getContext('2d'), def.id);

      const name = document.createElement('div'); name.className = 'name'; name.textContent = def.name;
      const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = def.desc;
      const footer = document.createElement('div'); footer.className = 'footer';
      const price = document.createElement('div'); price.className = 'price';
      const action = document.createElement('button');

      if (isOwned) {
        price.textContent = '';
        action.textContent = 'مفتوحة';
        action.disabled = true;
      } else {
        price.textContent = `${def.price.toLocaleString('ar-EG')} ♦`;
        action.textContent = 'فتح';
        action.disabled = this.storage.get('coins') < def.price;
        action.addEventListener('click', () => {
          if (!this.storage.spendCoins(def.price)) return;
          this.storage.ownAbility(def.id);
          this.toast(`فتحت قدرة ${def.name}`);
          this._renderShop();
        });
      }

      footer.appendChild(price);
      footer.appendChild(action);
      card.appendChild(preview);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(footer);
      abGrid.appendChild(card);
    }
  }

  _drawAbilityIcon(ctx, id) {
    ctx.clearRect(0, 0, 140, 90);
    ctx.save();
    ctx.translate(70, 50);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#3cf0d5';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#3cf0d5';
    ctx.lineWidth = 3;
    if (id === 'dash') {
      ctx.beginPath();
      ctx.moveTo(-30, 0); ctx.lineTo(18, 0);
      ctx.moveTo(6, -12); ctx.lineTo(22, 0); ctx.lineTo(6, 12);
      ctx.stroke();
      // speed lines
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-36, -10); ctx.lineTo(-18, -10);
      ctx.moveTo(-40, 10); ctx.lineTo(-20, 10);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-14, 18); ctx.lineTo(0, 4); ctx.lineTo(14, 18);
      ctx.moveTo(-14, -4); ctx.lineTo(0, -18); ctx.lineTo(14, -4);
      ctx.stroke();
    }
    ctx.restore();
  }
}
