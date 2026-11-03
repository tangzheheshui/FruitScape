# 时令果册 · 微信小程序

> 看露天应季水果，拒绝大棚反季。

一个只展示「露天自然成熟」水果的微信小程序：按月切换、地图看产区、按水果/省份检索、附近排序、收藏、一键生成本月清单海报。

## 技术栈（MVP）
- 微信小程序原生（wxml / wxss / js），无第三方组件库
- 地图：微信原生 `<map>` 组件
- 数据：`data/fruit_data.js` 静态本地 JSON
- 收藏：`wx.setStorageSync` 本地存储
- 海报：Canvas 2D 绘制
- 定位：用户主动点击才申请，距离完全前端本地计算

## 目录结构
```
FruitMap/
├── app.json / app.js / app.wxss
├── project.config.json
├── sitemap.json
├── data/fruit_data.js        # 果实数据（id/产区/经纬度/上市月份/避坑tip）
├── utils/fruit.js              # 数据查询 + 收藏工具
├── utils/privacy.js            # 隐私协议授权兜底（定位 / 写入相册）
├── images/                     # 地图点位图标 + tabBar 图标（脚本生成）
├── scripts/
│   ├── gen_icons.py            # 生成地图点位图标（Python 3 标准库，无依赖）
│   ├── gen_tab_icons.py        # 生成 5 个 tab 的 10 张图标
│   └── gen_app_icon.py         # 生成应用图标（依赖 Pillow）
├── docs/
│   ├── content-plan.md         # 小红书 + 公众号内容运营方案
│   └── publish-guide.md        # 小程序发布流程 + 审核材料清单
└── pages/
    ├── index/     首页：月份 + 地图 + 当月列表 + 详情
    ├── search/    搜索：按水果 / 按省份
    ├── nearby/    附近：按距离排序当月产区
    ├── favorite/  收藏
    ├── poster/    海报生成
    └── about/     关于 / 免责声明
```

## 如何运行
1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入本项目目录（`C:\env_code\FruitMap`）。
3. 项目已配置 AppID `wx0feb0343112255c2`；若要换成自己的小程序，改 `project.config.json` 的 `appid` 即可。**不要用 `touristappid`**：游客模式下 `<map>` 组件无法渲染。没有 AppID 可去 [微信公众平台](https://mp.weixin.qq.com) 注册测试号。
4. 重新生成地图图标（可选，仓库里已带）：
   ```bash
   python scripts/gen_icons.py
   ```
5. 编译预览。真机才能完整体验「附近」定位和「保存海报到相册」。

## 发布前必做
- 公众平台「设置 - 服务内容声明 - 用户隐私保护指引」中勾选「位置信息」「相册（仅写入）」。未配置时，真机上定位与保存海报会被系统直接拒绝（代码侧已由 `utils/privacy.js` 做授权兜底，但后台声明缺失仍会失败）。
- `wx.getLocation` 需在「开发管理 - 接口设置」申请开通，个人主体通常无法申请；未开通时「附近」会降级为「按省份查」。
- 上传版本号与 `pages/about/about.js` 中的 `version` 保持一致。

## 数据说明
- 每条果实字段：`id / name / category / province / city / lat / lng / startMonth / endMonth / variety / tip`
- `startMonth > endMonth` 表示跨年上市（如沙糖橘 12 月–次年 1 月），代码已处理。
- 避坑提示（`tip`）是本产品的差异化核心：标注市面上同款哪些多为大棚 / 冷库 / 进口货。

## 迭代路线（V2.0）
- 迁移微信云开发 CloudBase，云数据库存数据，后台可视化增删改
- 用户纠错入口（产地时间纠错，人工审核）
- 订阅提醒（水果临近上市推送）
- 扩展品类：时令花、野菜
