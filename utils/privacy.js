/**
 * 隐私协议兜底工具
 * 调用 wx.getLocation / wx.saveImageToPhotosAlbum 等隐私接口前，先确保用户已同意《用户隐私保护指引》。
 * 前提：需先在小程序管理后台「设置 - 服务内容声明 - 用户隐私保护指引」中声明「位置信息」「相册（仅写入）」，
 * 否则真机上即使同意也会调用失败。
 */

let agreed = false;

/** 确保隐私协议已授权，返回 Promise；用户拒绝时 reject */
function ensurePrivacy() {
  return new Promise(function (resolve, reject) {
    // 低版本基础库没有隐私校验，直接放行
    if (typeof wx.getPrivacySetting !== 'function') {
      resolve();
      return;
    }
    if (agreed) {
      resolve();
      return;
    }
    wx.getPrivacySetting({
      success: function (res) {
        if (!res.needAuthorization) {
          agreed = true;
          resolve();
          return;
        }
        wx.requirePrivacyAuthorize({
          success: function () {
            agreed = true;
            resolve();
          },
          fail: function (err) {
            reject(err);
          }
        });
      },
      // 查询失败时不阻塞主流程，交给具体接口自己报错
      fail: function () {
        resolve();
      }
    });
  });
}

/** 打开《用户隐私保护指引》 */
function openContract() {
  if (typeof wx.openPrivacyContract !== 'function') {
    wx.showToast({ title: '当前微信版本不支持查看', icon: 'none' });
    return;
  }
  wx.openPrivacyContract({
    fail: function () {
      wx.showToast({ title: '暂时无法打开隐私协议', icon: 'none' });
    }
  });
}

module.exports = {
  ensurePrivacy: ensurePrivacy,
  openContract: openContract
};
