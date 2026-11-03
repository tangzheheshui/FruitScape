const privacy = require('../../utils/privacy.js');

Page({
  data: {
    version: '1.0.0'
  },

  openPrivacy() {
    privacy.openContract();
  }
});
