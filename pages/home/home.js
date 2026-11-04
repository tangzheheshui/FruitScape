const fruit = require('../../utils/fruit.js');
const checkin = require('../../utils/checkin.js');

Page({
  data: {
    month: 0,
    monthLabel: '',
    yearTotal: 0,
    yearDone: 0,
    yearPct: 0,
    monthTotal: 0,
    monthDone: 0,
    monthPct: 0,
    monthList: []
  },

  onShow() {
    const m = fruit.currentMonth();
    this.setData({ month: m, monthLabel: m + '月' });
    this.refresh();
  },

  refresh() {
    const m = this.data.month;
    const all = fruit.all();
    const monthList = fruit.byMonth(m).map(function (f) {
      return Object.assign({}, f, {
        season: fruit.seasonLabel(f),
        checked: checkin.isChecked(f.id)
      });
    });
    const yearDone = checkin.count();
    const monthDone = monthList.filter(function (f) { return f.checked; }).length;
    this.setData({
      yearTotal: all.length,
      yearDone: yearDone,
      yearPct: all.length ? Math.round(yearDone / all.length * 100) : 0,
      monthTotal: monthList.length,
      monthDone: monthDone,
      monthPct: monthList.length ? Math.round(monthDone / monthList.length * 100) : 0,
      monthList: monthList
    });
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id;
    const now = checkin.toggle(id);
    wx.showToast({ title: now ? '已打卡 🍎' : '已取消', icon: 'none' });
    this.refresh();
  },

  goMap() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goPoster() {
    wx.navigateTo({ url: '/pages/poster/poster?month=' + this.data.month });
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  }
});
