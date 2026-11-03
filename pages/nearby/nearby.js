const fruit = require('../../utils/fruit.js');
const privacy = require('../../utils/privacy.js');

Page({
  data: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    month: 0,
    // 子模式：nearby 定位排序 | province 按省份查（个人主体无定位权限时降级用）
    subMode: 'nearby',
    // nearby
    locating: false,
    located: false,
    denied: false,
    list: [],
    // province
    provinces: [],
    activeProvince: '',
    provinceFruits: []
  },

  onLoad() {
    this.setData({
      month: fruit.currentMonth(),
      provinces: fruit.provinces()
    });
  },

  switchSubMode(e) {
    this.setData({ subMode: e.currentTarget.dataset.mode });
  },

  chooseMonth(e) {
    const m = Number(e.currentTarget.dataset.m);
    if (m === this.data.month) return;
    this.setData({ month: m });
    if (this.data.subMode === 'nearby' && this._loc) {
      // 已定位过则复用缓存坐标，不重复弹授权
      this.sortNear(m, this._loc.lat, this._loc.lng);
    } else if (this.data.subMode === 'province' && this.data.activeProvince) {
      this.filterProvince(this.data.activeProvince);
    }
  },

  locate() {
    this.setData({ locating: true, denied: false });
    privacy.ensurePrivacy()
      .then(() => { this.doLocate(); })
      .catch(() => {
        this.setData({ locating: false, denied: true });
        wx.showModal({
          title: '需要同意隐私保护指引',
          content: '「附近」需要读取你的位置来计算到各产区的距离，位置只在本机计算、不会上传。你也可以改用「按省份查」。',
          confirmText: '查看指引',
          cancelText: '按省份查',
          success: (r) => {
            if (r.confirm) privacy.openContract();
            else this.setData({ subMode: 'province' });
          }
        });
      });
  },

  doLocate() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this._loc = { lat: res.latitude, lng: res.longitude };
        this.setData({ locating: false, located: true });
        this.sortNear(this.data.month, res.latitude, res.longitude);
      },
      fail: (err) => {
        this.setData({ locating: false });
        if (/auth|deny|denied|authorize/i.test(err.errMsg)) {
          this.setData({ denied: true });
          wx.showModal({
            title: '无法获取定位',
            content: '位置仅用于本地计算距离，不会上传。若仍失败（个人主体小程序通常无定位权限），可切换到顶部「按省份查」。',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting(); }
          });
        } else {
          wx.showToast({ title: '定位失败，请重试', icon: 'none' });
        }
      }
    });
  },

  sortNear(month, lat, lng) {
    const list = fruit.sortByDistance(fruit.byMonth(month), lat, lng)
      .slice(0, 20)
      .map(function (f) {
        return Object.assign({}, f, { season: fruit.seasonLabel(f) });
      });
    this.setData({ list: list });
  },

  tapProvince(e) {
    const p = e.currentTarget.dataset.p;
    this.setData({ activeProvince: p });
    this.filterProvince(p);
  },

  filterProvince(p) {
    const list = fruit.byMonth(this.data.month)
      .filter(function (f) { return f.province === p; })
      .map(function (f) { return Object.assign({}, f, { season: fruit.seasonLabel(f) }); });
    this.setData({ provinceFruits: list });
  },

  goFruit(e) {
    getApp().globalData.focusFruitId = e.currentTarget.dataset.id;
    wx.switchTab({ url: '/pages/index/index' });
  }
});
