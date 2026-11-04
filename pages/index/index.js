const fruit = require('../../utils/fruit.js');
const checkin = require('../../utils/checkin.js');

Page({
  data: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    month: 0,
    monthLabel: '',
    // 搜索 / 省份筛选（原「搜索」页并入）
    keyword: '',
    province: '',
    provinces: [],
    listTitle: '',
    // 地图
    mapLat: 33.5,
    mapLng: 104.5,
    mapScale: 4,
    markers: [],
    // 列表
    list: [],
    // 详情卡片
    showDetail: false,
    detail: null,
    detailFav: false,
    detailChecked: false
  },

  onLoad() {
    this.setData({ month: fruit.currentMonth(), provinces: fruit.provinces() });
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

  /** 按 关键词 / 省份 / 月份 决定当前展示的果实集合 */
  visibleFruits() {
    const kw = this.data.keyword.trim();
    if (kw) return fruit.byName(kw);
    if (this.data.province) return fruit.byProvince(this.data.province);
    return fruit.byMonth(this.data.month);
  },

  refresh() {
    const m = this.data.month;
    const kw = this.data.keyword.trim();
    const hasFilter = !!(kw || this.data.province);
    const base = this.visibleFruits();
    const list = base.map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });

    // 地图源：无筛选时展示全部（当季橙/非当季灰）；有筛选时只展示命中的
    const mapSource = hasFilter ? base : fruit.all();
    this._markerFruits = mapSource;
    const markers = mapSource.map(function (f, i) {
      const active = hasFilter ? true : fruit.inSeason(f, m);
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

    let listTitle;
    if (kw) listTitle = '“' + kw + '” 结果';
    else if (this.data.province) listTitle = this.data.province + ' · 露天应季';
    else listTitle = m + '月露天应季';

    this.setData({
      list: list,
      markers: markers,
      monthLabel: m + '月',
      listTitle: listTitle
    });
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
    this.refresh();
  },

  onProvinceTap(e) {
    const p = e.currentTarget.dataset.p;
    this.setData({ province: p === this.data.province ? '' : p });
    this.refresh();
  },

  chooseMonth(e) {
    const m = Number(e.currentTarget.dataset.m);
    if (m === this.data.month) return;
    this.setData({ month: m, showDetail: false, keyword: '', province: '' });
    this.refresh();
  },

  onMarkerTap(e) {
    // markertap / labeltap 都走这里；兼容不同基础库返回 markerId 的位置
    const idx = (e.detail && e.detail.markerId != null) ? e.detail.markerId : e.markerId;
    const f = this._markerFruits && this._markerFruits[idx];
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
    this.setData({ mapLat: f.lat, mapLng: f.lng, mapScale: 8 });
    this.showDetail(f);
  },

  showDetail(f) {
    this.setData({
      showDetail: true,
      detail: Object.assign({}, f, { season: fruit.seasonLabel(f) }),
      detailFav: fruit.isFavorite(f.id),
      detailChecked: checkin.isChecked(f.id)
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
    const d = this.data.detail;
    if (!d) return;
    const now = checkin.toggle(d.id);
    this.setData({ detailChecked: now });
    wx.showToast({ title: now ? '已打卡 🍎' : '已取消打卡', icon: 'none' });
  },

  goPoster() {
    wx.navigateTo({ url: '/pages/poster/poster?month=' + this.data.month });
  },

  onShareAppMessage() {
    return { title: '看露天应季水果，拒绝大棚反季', path: '/pages/home/home' };
  }
});
