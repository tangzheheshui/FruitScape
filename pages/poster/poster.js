const fruit = require('../../utils/fruit.js');
const privacy = require('../../utils/privacy.js');

const W = 340; // 海报设计宽度（px）

Page({
  data: {
    month: 0,
    list: [],
    W: W,
    canvasH: 0,
    saving: false
  },

  onLoad(q) {
    const m = (q && q.month) ? Number(q.month) : fruit.currentMonth();
    const list = fruit.byMonth(m).map(function (f) {
      return Object.assign({}, f, { season: fruit.seasonLabel(f) });
    });
    const H = 320 + list.length * 44;
    this.setData({ month: m, list: list, canvasH: H });
    this.initCanvas(list, m, H);
  },

  initCanvas(list, m, H) {
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
        this.draw(ctx, list, m, W, H);
      });
  },

  draw(ctx, list, m, W, H) {
    // 背景
    ctx.fillStyle = '#F6FAF0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#6FA95C';
    ctx.fillRect(0, 0, W, 6);

    let y = 52;
    // 标题
    ctx.fillStyle = '#2E3A2E';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m + '月 · 露天应季水果', W / 2, y);
    y += 36;
    // slogan
    ctx.fillStyle = '#E8853C';
    ctx.font = '14px sans-serif';
    ctx.fillText('看露天应季水果，拒绝大棚反季', W / 2, y);
    y += 38;

    // 分割线
    ctx.strokeStyle = '#D9E4D2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(W - 28, y);
    ctx.stroke();
    y += 32;

    // 果实清单
    list.forEach(function (f) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#2E3A2E';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('· ' + f.name, 32, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#8A948A';
      ctx.font = '12px sans-serif';
      ctx.fillText(f.province + ' · ' + f.season, W - 32, y);
      y += 44;
    });

    // 底部
    y += 6;
    ctx.strokeStyle = '#D9E4D2';
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(W - 28, y);
    ctx.stroke();
    y += 30;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6FA95C';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('时令果册', W / 2, y);
    y += 24;
    ctx.fillStyle = '#A9B2A9';
    ctx.font = '10px sans-serif';
    ctx.fillText('露天自然熟果 · 仅供参考，不构成采购指导', W / 2, y);
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
