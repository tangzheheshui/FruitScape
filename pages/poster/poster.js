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
    const monthList = fruit.byMonth(m).map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });
    const yearTotal = fruit.all().length;
    const yearDone = checkin.count();
    const monthTotal = monthList.length;
    const monthDone = monthList.filter(function (f) { return checkin.isChecked(f.id); }).length;
    const rows = Math.max(1, Math.ceil(monthTotal / 3));
    const H = 252 + rows * 34 + 110;
    this.setData({
      month: m,
      monthList: monthList,
      yearTotal: yearTotal,
      yearDone: yearDone,
      monthTotal: monthTotal,
      monthDone: monthDone,
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
        // 尝试加载小程序码（若已生成 images/qrcode.png）
        const img = canvas.createImage();
        img.onload = () => { this.qrImg = img; this.draw(); };
        img.onerror = () => { this.qrImg = null; this.draw(); };
        img.src = '/images/qrcode.png';
      });
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

    // 进度卡片（白色圆角，叠在头带下）
    const cardX = 24, cardW = W - 48, cardY = 102, cardH = 120;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();

    // 全年进度圆环
    const ringCx = cardX + 62, ringCy = cardY + cardH / 2, ringR = 38;
    const pct = d.yearTotal ? d.yearDone / d.yearTotal : 0;
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#E9F0E4';
    ctx.beginPath();
    ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    if (pct > 0) {
      ctx.strokeStyle = '#E8853C';
      ctx.beginPath();
      ctx.arc(ringCx, ringCy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
    }
    ctx.fillStyle = '#2E3A2E';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.yearDone + '/' + d.yearTotal, ringCx, ringCy + 6);

    // 右侧文字
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2E3A2E';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('全年已尝', cardX + 128, ringCy - 14);
    ctx.fillStyle = '#8A948A';
    ctx.font = '12px sans-serif';
    ctx.fillText(d.month + '月应季 ' + d.monthTotal + ' 种', cardX + 128, ringCy + 8);
    ctx.fillText('已尝 ' + d.monthDone + ' 种', cardX + 128, ringCy + 28);

    // 当月果实网格（3 列，已尝高亮）
    let y = cardY + cardH + 30;
    const cellW = (W - 48 - 16) / 3;
    const cellH = 34;
    d.monthList.forEach(function (f, i) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = 24 + col * (cellW + 8);
      const cy = y + row * cellH;
      const tasted = checkin.isChecked(f.id);
      ctx.fillStyle = tasted ? '#FBF4EA' : '#FFFFFF';
      roundRect(ctx, cx, cy, cellW, cellH - 8, 10);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = tasted ? '#B08A5C' : '#5A645A';
      ctx.font = '11px sans-serif';
      ctx.fillText((EMOJI[f.category] || '🍎') + ' ' + f.name, cx + 8, cy + 21);
      if (tasted) {
        ctx.strokeStyle = '#E8853C';
        ctx.lineWidth = 1.5;
        roundRect(ctx, cx, cy, cellW, cellH - 8, 10);
        ctx.stroke();
      }
    });
    const rows = Math.max(1, Math.ceil(d.monthList.length / 3));
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
