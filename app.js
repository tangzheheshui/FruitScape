App({
  globalData: {
    // 从搜索/附近/收藏跳转过来时，首页需要定位并高亮的果实 id
    focusFruitId: null,
    version: '1.0.0'
  },

  onLaunch() {
    // MVP 无后端，数据在 data/fruit_data.js，收藏在本地 storage
    this.checkUpdate();
  },

  /** 新版本下载完成后提示重启，避免用户长期停留在旧版本 */
  checkUpdate() {
    if (typeof wx.getUpdateManager !== 'function') return;
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        confirmText: '立即重启',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) updateManager.applyUpdate();
        }
      });
    });
  }
});
