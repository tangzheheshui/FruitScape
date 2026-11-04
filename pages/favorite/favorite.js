const fruit = require('../../utils/fruit.js');
const checkin = require('../../utils/checkin.js');

Page({
  data: {
    tab: 'checkin', // 'checkin' 已尝打卡 | 'favorite' 收藏
    checkins: [],
    favorites: []
  },

  onShow() {
    this.refresh();
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  refresh() {
    const c = checkin.all();
    const checkinList = Object.keys(c)
      .map(function (id) { return fruit.byId(id); })
      .filter(Boolean)
      .map(function (f) { return Object.assign({}, f, { season: fruit.seasonLabel(f) }); });
    const favList = fruit.getFavorites()
      .map(function (id) { return fruit.byId(id); })
      .filter(Boolean)
      .map(function (f) { return Object.assign({}, f, { season: fruit.seasonLabel(f) }); });
    this.setData({ checkins: checkinList, favorites: favList });
  },

  removeCheckin(e) {
    checkin.toggle(e.currentTarget.dataset.id); // 已打卡则取消
    wx.showToast({ title: '已取消打卡', icon: 'none' });
    this.refresh();
  },

  removeFavorite(e) {
    fruit.toggleFavorite(e.currentTarget.dataset.id); // 已收藏则取消
    wx.showToast({ title: '已取消收藏', icon: 'none' });
    this.refresh();
  },

  goFruit(e) {
    getApp().globalData.focusFruitId = e.currentTarget.dataset.id;
    wx.switchTab({ url: '/pages/index/index' });
  }
});
