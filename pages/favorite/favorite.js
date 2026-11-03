const fruit = require('../../utils/fruit.js');

Page({
  data: {
    list: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const list = fruit.getFavorites()
      .map(function (id) { return fruit.byId(id); })
      .filter(Boolean)
      .map(function (f) { return Object.assign({}, f, { season: fruit.seasonLabel(f) }); });
    this.setData({ list: list });
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    fruit.toggleFavorite(id); // 已收藏则取消
    wx.showToast({ title: '已取消收藏', icon: 'none' });
    this.refresh();
  },

  goFruit(e) {
    getApp().globalData.focusFruitId = e.currentTarget.dataset.id;
    wx.switchTab({ url: '/pages/index/index' });
  }
});
