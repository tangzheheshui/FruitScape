/** 打卡（已尝）数据 —— 本地存储，无后端。存 { 果实id: 打卡时间(ISO) } */
const KEY = 'checkins';

function all() {
  return wx.getStorageSync(KEY) || {};
}

function isChecked(id) {
  return !!all()[id];
}

/** 切换打卡状态，返回切换后的状态（true=已打卡） */
function toggle(id) {
  const c = all();
  if (c[id]) {
    delete c[id];
    wx.setStorageSync(KEY, c);
    return false;
  }
  c[id] = new Date().toISOString();
  wx.setStorageSync(KEY, c);
  return true;
}

/** 已打卡果实总数 */
function count() {
  return Object.keys(all()).length;
}

module.exports = { all, isChecked, toggle, count };
