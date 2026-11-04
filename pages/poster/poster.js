const fruit = require('../../utils/fruit.js');
const checkin = require('../../utils/checkin.js');
const privacy = require('../../utils/privacy.js');

const W = 340; // 海报设计宽度（px）

// 品类 → emoji（海报上的“图”）
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

Page({
  data: {
    month: 0,
    W: W,
    canvasH: 0,
    saving: false
  },

  onLoad(q) {
    const m = (q && q.month) ? Number(q.month) : fruit.currentMonth();
    const nextM = (m % 12) + 1;
    const monthList = fruit.byMonth(m).map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });
    const yearTotal = fruit.all().length;
    const yearDone = checkin.count();
    const monthTotal = monthList.length;
    const monthDone = monthList.filter(function (f) { return checkin.isChecked(f.id); }).length;

    const endingSoon = fruit.byMonth(m).filter(function (f) { return !fruit.inSeason(f, nextM); });
    const comingSoon = fruit.byMonth(nextM).filter(function (f) { return !fruit.inSeason(f, m); });
    this._endingIds = {};
    endingSoon.forEach(function (f) { this._endingIds[f.id] = true; }, this);
    const comingSoonNames = comingSoon.map(function (f) { return f.name; }).join('、');
    const tipsCount = comingSoonNames ? 1 : 0;

    const rows = Math.max(1, Math.ceil(monthTotal / 2));
    const H = 250 + tipsCount * 26 + rows * 34 + 130;

    this.setData({
      month: m,
      monthList: monthList,
      yearTotal: yearTotal,
      yearDone: yearDone,
      monthTotal: monthTotal,
      monthDone: monthDone,
      comingSoonNames: comingSoonNames,
      canvasH: H
    });
    this.initCanvas(H);
  },

  initCanvas(H) {
    wx.createSelectorQuery()
      .select('#poster')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio || 2;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        this.canvas = canvas;
        this.ctx = ctx;
        const img = canvas.createImage();
        img.onload = () => { this.qrImg = img; this.draw(); };
        img.onerror = () => { this.qrImg = null; this.draw(); };
        img.src = '/images/qrcode.png';
      });
  },

  drawRing(ctx, cx, cy, r, pct, text) {
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#E9F0E4';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    if (pct > 0) {
      ctx.strokeStyle = '#E8853C';
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
    }
    ctx.fillStyle = '#2E3A2E';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 5);
  },

  draw() {
    const ctx = this.ctx;
    const d = this.data;
    const H = d.canvasH;

    // 背景
    ctx.fillStyle = '#F6FAF0';
    ctx.fillRect(0, 0, W, H);

    // 顶部绿色头带
    ctx.fillStyle = '#6FA95C';
    ctx.fillRect(0, 0, W, 130);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('我的时令水果图鉴', W / 2, 58);
    ctx.fillStyle = '#DCEAD6';
    ctx.font = '13px sans-serif';
    ctx.fillText('看露天应季水果 · 拒绝大棚反季', W / 2, 88);

    // 进度卡片：两个进度环（全年 + 当月）
    const cardX = 24, cardW = W - 48, cardY = 102, cardH = 150;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    const ringR = 34, ringY = cardY + 58;
    const r1x = cardX + 66, r2x = cardX + cardW - 66;
    this.drawRing(ctx, r1x, ringY, ringR, d.yearTotal ? d.yearDone / d.yearTotal : 0, d.yearDone + '/' + d.yearTotal);
    this.drawRing(ctx, r2x, ringY, ringR, d.monthTotal ? d.monthDone / d.monthTotal : 0, d.monthDone + '/' + d.monthTotal);
    ctx.fillStyle = '#8A948A';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('全年已尝', r1x, cardY + cardH - 18);
    ctx.fillText('当月已尝', r2x, cardY + cardH - 18);

    // 即将过季 / 即将上市
    let y = cardY + cardH + 22;
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    if (d.comingSoonNames) {
      ctx.fillStyle = '#6FA95C';
      ctx.fillText('🌱 即将上市：' + d.comingSoonNames, 28, y);
      y += 26;
    }
    y += 10;

    // 当月果实网格（3 列，已打卡打 ✓）
    const cellW = (W - 48 - 8) / 2;
    const cellH = 34;
    d.monthList.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 24 + col * (cellW + 8);
      const cy = y + row * cellH;
      const tasted = checkin.isChecked(f.id);
      const ending = this._endingIds && this._endingIds[f.id];
      ctx.fillStyle = tasted ? '#FBF4EA' : '#FFFFFF';
      roundRect(ctx, cx, cy, cellW, cellH - 8, 10);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.font = '11px sans-serif';
      let label = f.city + ' ' + (f.variety || f.name);
      if (tasted) label = '✓ ' + label;
      else label = (EMOJI[f.category] || '🍎') + ' ' + label;
      if (ending) label += ' ⏳';
      ctx.fillStyle = tasted ? '#E8853C' : '#5A645A';
      ctx.fillText(label, cx + 8, cy + 21);
      if (tasted) {
        ctx.strokeStyle = '#E8853C';
        ctx.lineWidth = 1.5;
        roundRect(ctx, cx, cy, cellW, cellH - 8, 10);
        ctx.stroke();
      }
    });
    const rows = Math.max(1, Math.ceil(d.monthList.length / 2));
    y += rows * cellH + 24;

    // 小程序码 + 引导
    if (this.qrImg) {
      const qs = 76;
      ctx.drawImage(this.qrImg, W - 32 - qs, y, qs, qs);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#2E3A2E';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('长按识别，一起打卡', 28, y + 36);
      ctx.fillStyle = '#9AA39A';
      ctx.font = '11px sans-serif';
      ctx.fillText('应季露天果', 28, y + 54);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9AA39A';
      ctx.font = '11px sans-serif';
      ctx.fillText('扫码进入小程序 · 一起打卡应季果', W / 2, y + 24);
    }
    y += 88;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6FA95C';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('时令果册', W / 2, y);
  },

  save() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    privacy.ensurePrivacy()
      .then(() => { this.doSave(); })
      .catch(() => {
        this.setData({ saving: false });
        wx.showModal({
          title: '需要同意隐私保护指引',
          content: '保存海报需要写入相册，查看并同意隐私保护指引后即可保存。',
          confirmText: '查看指引',
          success: (r) => { if (r.confirm) privacy.openContract(); }
        });
      });
  },

  doSave() {
    wx.canvasToTempFilePath({
      canvas: this.canvas,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            this.setData({ saving: false });
            wx.showToast({ title: '已保存到相册', icon: 'success' });
          },
          fail: (err) => {
            this.setData({ saving: false });
            if (/auth|deny|denied|authorize/i.test(err.errMsg)) {
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中允许“保存到相册”，以便分享海报',
                confirmText: '去设置',
                success: (r) => { if (r.confirm) wx.openSetting(); }
              });
            } else {
              wx.showToast({ title: '保存失败，请重试', icon: 'none' });
            }
          }
        });
      },
      fail: () => {
        this.setData({ saving: false });
        wx.showToast({ title: '生成图片失败', icon: 'none' });
      }
    });
  }
});
