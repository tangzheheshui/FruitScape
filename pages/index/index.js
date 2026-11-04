const fruit = require('../../utils/fruit.js');
const checkin = require('../../utils/checkin.js');
const fruitDetail = require('../../data/fruit_detail.js');

// 品类 → emoji
const EMOJI = {
  '青梅': '🍏', '桑葚': '🫐', '枇杷': '🟡', '草莓': '🍓', '樱桃': '🍒',
  '荔枝': '🔴', '杨梅': '🔴', '芒果': '🥭', '杏': '🟠', '桃': '🍑',
  '西瓜': '🍉', '葡萄': '🍇', '甜瓜': '🍈', '龙眼': '🟤', '无花果': '🟣',
  '猕猴桃': '🥝', '梨': '🍐', '石榴': '🔴', '枣': '🟤', '苹果': '🍎',
  '柿子': '🟠', '山楂': '🔴', '柚子': '🍊', '柑橘': '🍊', '橙': '🍊',
  '火龙果': '🟣', '杨桃': '⭐', '番石榴': '🟢', '蓝莓': '🫐', '李子': '🟣',
  '百香果': '🟡', '莲雾': '🔴', '释迦': '🟢', '菠萝蜜': '🟡', '青枣': '🟢',
  '椰子': '🥥', '人参果': '🟠', '板栗': '🟤', '核桃': '🟤'
};

Page({
  data: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    month: 0,
    monthLabel: '',
    mapLat: 33.5,
    mapLng: 104.5,
    mapScale: 4,
    markers: [],
    showDetail: false,
    detail: null,
    detailFav: false,
    detailChecked: false,
    detailEmoji: '',
    canCheckin: true
  },

  onLoad() {
    this.setData({ month: fruit.currentMonth() });
    this.refresh();
  },

  onShow() {
    const app = getApp();
    if (app.globalData.focusFruitId) {
      const id = app.globalData.focusFruitId;
      app.globalData.focusFruitId = null;
      this.focusFruit(id);
    } else if (this.data.detail) {
      this.setData({
        detailFav: fruit.isFavorite(this.data.detail.id),
        detailChecked: checkin.isChecked(this.data.detail.id)
      });
    }
  },

  refresh() {
    const m = this.data.month;
    const markers = fruit.all().map(function (f, i) {
      const active = fruit.inSeason(f, m);
      const marker = {
        id: i,
        latitude: f.lat,
        longitude: f.lng,
        iconPath: active ? '/images/marker-in.png' : '/images/marker-out.png',
        width: 28,
        height: 28,
        anchor: { x: 0.5, y: 0.5 }
      };
      if (active) {
        marker.label = {
          content: f.name,
          color: '#E8853C',
          fontSize: 11,
          bgColor: '#FFFFFF',
          borderRadius: 8,
          padding: 3,
          anchorX: 0,
          anchorY: -26,
          textAlign: 'center'
        };
      }
      return marker;
    });
    this.setData({ markers: markers, monthLabel: m + '月', canCheckin: m === fruit.currentMonth() });
  },

  chooseMonth(e) {
    const m = Number(e.currentTarget.dataset.m);
    if (m === this.data.month) return;
    this.setData({ month: m, showDetail: false });
    this.refresh();
  },

  onMarkerTap(e) {
    const idx = (e.detail && e.detail.markerId != null) ? e.detail.markerId : e.markerId;
    const f = fruit.all()[idx];
    if (f) this.showDetail(f);
  },

  focusFruit(id) {
    const f = fruit.byId(id);
    if (!f) return;
    this.setData({ mapLat: f.lat, mapLng: f.lng, mapScale: 8 });
    this.showDetail(f);
  },

  showDetail(f) {
    const extra = fruitDetail[f.id] || {};
    this.setData({
      showDetail: true,
      detail: Object.assign({}, f, {
        season: fruit.seasonLabel(f),
        pick: extra.pick || '',
        note: extra.note || '',
        identify: extra.identify || ''
      }),
      detailFav: fruit.isFavorite(f.id),
      detailChecked: checkin.isChecked(f.id),
      detailEmoji: EMOJI[f.category] || '🍎'
    });
  },

  closeDetail() {
    this.setData({ showDetail: false });
  },

  onToggleFav() {
    const d = this.data.detail;
    if (!d) return;
    const nowFav = fruit.toggleFavorite(d.id);
    this.setData({ detailFav: nowFav });
    wx.showToast({ title: nowFav ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  onToggleCheckin() {
    if (!this.data.canCheckin) {
      wx.showToast({ title: '仅当月可打卡', icon: 'none' });
      return;
    }
    const d = this.data.detail;
    if (!d) return;
    const now = checkin.toggle(d.id);
    this.setData({ detailChecked: now });
    wx.showToast({ title: now ? '已打卡 🍎' : '已取消打卡', icon: 'none' });
  },

  onShareAppMessage() {
    return { title: '看露天应季水果，拒绝大棚反季', path: '/pages/home/home' };
  }
});
