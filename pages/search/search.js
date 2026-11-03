const fruit = require('../../utils/fruit.js');

Page({
  data: {
    mode: 'fruit',       // 'fruit' 按水果搜 | 'province' 按省份查
    keyword: '',
    results: [],
    searched: false,
    provinces: [],
    activeProvince: '',
    provinceFruits: []
  },

  onLoad() {
    this.setData({ provinces: fruit.provinces() });
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  doSearch() {
    const kw = this.data.keyword;
    const results = fruit.byName(kw).map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });
    this.setData({ results: results, searched: true });
  },

  clearSearch() {
    this.setData({ keyword: '', results: [], searched: false });
  },

  tapProvince(e) {
    const p = e.currentTarget.dataset.p;
    const provinceFruits = fruit.byProvince(p).map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });
    this.setData({ activeProvince: p, provinceFruits: provinceFruits });
  },

  goFruit(e) {
    getApp().globalData.focusFruitId = e.currentTarget.dataset.id;
    wx.switchTab({ url: '/pages/index/index' });
  }
});
