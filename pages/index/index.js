const fruit = require('../../utils/fruit.js');

const app = getApp();

Page({
  data: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    month: 0,
    monthLabel: '',
    // 地图
    mapLat: 33.5,
    mapLng: 104.5,
    mapScale: 4,
    markers: [],
    // 当月列表
    list: [],
    // 详情卡片
    showDetail: false,
    detail: null,
    detailFav: false
  },

  onLoad() {
    this.setData({ month: fruit.currentMonth() });
    this.refresh();
  },

  onShow() {
    // 从搜索/附近/收藏跳转过来时，定位并高亮指定果实
    const app = getApp();
    if (app.globalData.focusFruitId) {
      const id = app.globalData.focusFruitId;
      app.globalData.focusFruitId = null;
      this.focusFruit(id);
    } else if (this.data.detail) {
      // 返回本页时刷新收藏状态
      this.setData({ detailFav: fruit.isFavorite(this.data.detail.id) });
    }
  },

  refresh() {
    const m = this.data.month;
    const list = fruit.byMonth(m).map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });

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
      // 只给当季果实加名称标签，避免全国尺度过密，也更突出“当季”
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

    this.setData({
      list: list,
      markers: markers,
      monthLabel: m + '月'
    });
  },

  chooseMonth(e) {
    const m = Number(e.currentTarget.dataset.m);
    if (m === this.data.month) return;
    this.setData({ month: m, showDetail: false });
    this.refresh();
  },

  onMarkerTap(e) {
    // markertap / labeltap 都走这里；兼容不同基础库返回 markerId 的位置
    const idx = (e.detail && e.detail.markerId != null) ? e.detail.markerId : e.markerId;
    const f = fruit.all()[idx];
    if (f) this.showDetail(f);
  },

  onListTap(e) {
    const id = e.currentTarget.dataset.id;
    const f = fruit.byId(id);
    if (!f) return;
    this.focusFruit(id);
    this.showDetail(f);
  },

  /** 把地图中心平移到指定果实 */
  focusFruit(id) {
    const f = fruit.byId(id);
    if (!f) return;
    this.setData({
      mapLat: f.lat,
      mapLng: f.lng,
      mapScale: 8
    });
    this.showDetail(f);
  },

  showDetail(f) {
    this.setData({
      showDetail: true,
      detail: Object.assign({}, f, { season: fruit.seasonLabel(f) }),
      detailFav: fruit.isFavorite(f.id)
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

  goPoster() {
    wx.navigateTo({ url: '/pages/poster/poster?month=' + this.data.month });
  },

  onShareAppMessage() {
    return {
      title: '看露天应季水果，拒绝大棚反季',
      path: '/pages/index/index'
    };
  }
});
