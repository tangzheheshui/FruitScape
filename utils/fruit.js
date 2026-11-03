/**
 * 果实数据查询与收藏工具。
 * 数据来源：data/fruit_data.js（静态本地 JSON，MVP 阶段无需后端）
 */
const fruits = require('../data/fruit_data.js');

const FAV_KEY = 'favorites';

/** 判断某果实是否在指定月份处于上市期（支持跨年，如 12月–次年2月） */
function inSeason(f, m) {
  if (f.startMonth <= f.endMonth) {
    return m >= f.startMonth && m <= f.endMonth;
  }
  return m >= f.startMonth || m <= f.endMonth;
}

/** 上市时间的可读文案 */
function seasonLabel(f) {
  if (f.startMonth === f.endMonth) return f.startMonth + '月';
  if (f.startMonth < f.endMonth) return f.startMonth + '月–' + f.endMonth + '月';
  return f.startMonth + '月–次年' + f.endMonth + '月';
}

function currentMonth() {
  return new Date().getMonth() + 1;
}

function all() {
  return fruits;
}

function byId(id) {
  for (let i = 0; i < fruits.length; i++) {
    if (fruits[i].id === id) return fruits[i];
  }
  return null;
}

/** 当月应季果实 */
function byMonth(m) {
  return fruits.filter(function (f) { return inSeason(f, m); });
}

/** 按名称/品类/品种/省市关键词检索 */
function byName(kw) {
  kw = (kw || '').trim().toLowerCase();
  if (!kw) return [];
  return fruits.filter(function (f) {
    const hay = (f.name + f.category + f.variety + f.province + f.city).toLowerCase();
    return hay.indexOf(kw) >= 0;
  });
}

function byProvince(p) {
  return fruits.filter(function (f) { return f.province === p; });
}

/** 所有省份及果实数量，按数量降序 */
function provinces() {
  const m = {};
  fruits.forEach(function (f) { m[f.province] = (m[f.province] || 0) + 1; });
  return Object.keys(m)
    .map(function (k) { return { name: k, count: m[k] }; })
    .sort(function (a, b) { return b.count - a.count; });
}

/** Haversine 球面距离，单位公里 */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 按到给定坐标的距离从小到大排序，附带 distanceKm */
function sortByDistance(list, lat, lng) {
  return list.map(function (f) {
    return Object.assign({}, f, {
      distanceKm: Math.round(haversine(lat, lng, f.lat, f.lng))
    });
  }).sort(function (a, b) { return a.distanceKm - b.distanceKm; });
}

/* ---- 收藏（本地 storage） ---- */
function getFavorites() {
  try { return wx.getStorageSync(FAV_KEY) || []; } catch (e) { return []; }
}

function isFavorite(id) {
  return getFavorites().indexOf(id) >= 0;
}

/** 切换收藏状态，返回 true 表示“已收藏”，false 表示“已取消” */
function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(id);
  }
  wx.setStorageSync(FAV_KEY, favs);
  return idx < 0;
}

module.exports = {
  all: all,
  byId: byId,
  byMonth: byMonth,
  byName: byName,
  byProvince: byProvince,
  provinces: provinces,
  inSeason: inSeason,
  seasonLabel: seasonLabel,
  currentMonth: currentMonth,
  sortByDistance: sortByDistance,
  getFavorites: getFavorites,
  isFavorite: isFavorite,
  toggleFavorite: toggleFavorite
};
