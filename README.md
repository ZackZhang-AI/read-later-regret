# Read-Later Regret 稍后再看反悔系统

Read-Later Regret 是一个 Chrome 浏览器扩展，用来减少「信息债」。它不是又一个无限堆积的稍后阅读箱，而是在你保存网页前先帮你判断：这篇内容值得现在读、稍后读、总结、转成任务、放进工具箱，还是干脆丢掉。

项目的核心想法很简单：不是每个被收藏的链接都真的值得进入你的未来。

## 为什么做这个

传统稍后阅读工具通常默认「保存 = 有价值」。但现实里，很多链接只是变成一个安静膨胀的待办坟场。

Read-Later Regret 会根据当前页面内容、阅读时长、页面类型、历史保存情况和信息债分数，给出更诚实的处理建议：

- 短内容：提醒你现在读完，不要制造新债务。
- 长文章：进入稍后阅读队列。
- 文档：根据任务倾向转成待办。
- 工具页：放进工具箱。
- 新闻、购物、低价值页面：建议总结或丢弃。
- 相似主题反复保存：提醒你已经囤了不少同类链接。

## 功能亮点

- Popup 一键分析当前页面。
- 内容脚本提取网页标题、URL 和可读文本。
- 支持英文、中文和混合内容的阅读时间估算。
- 基于规则的页面类型识别，包含置信度和判断理由。
- 信息债分数，范围为 `0-100`。
- 保存前可手动修正内容类型、添加标签和一句话备注。
- 保存后支持打开仪表盘、撤销保存或继续浏览。
- 本地持久化存储，使用 `chrome.storage.local`，不依赖后端。
- 仪表盘支持搜索、排序、筛选、批量处理、编辑备注和标签。
- Review Mode：一次处理一个链接，适合清理积压。
- Topic Groups：按主题聚合同类链接，建议只读最值得读的几篇。
- Usage Intelligence：统计最近打开、从未打开、长期未打开、高债未打开等状态。
- 保存相似未处理链接前给出重复主题提醒。
- 支持 JSON 导入/导出，方便备份和演示。
- 支持阅读速度、长文章阈值、陈旧链接天数等偏好设置。
- 内置演示数据和 Demo readiness 检查，便于作品集展示。
- 不需要任何 AI API。

## 技术栈

- Plasmo
- React
- TypeScript
- Chrome Extension Manifest V3
- `chrome.storage.local`
- Vitest

## 项目结构

```text
src/
  background.ts              扩展后台入口
  popup.tsx                  弹窗分析与保存流程
  styles.css                 共享样式
  contents/
    extract.ts               网页可读文本提取
  core/
    analyze.ts               页面分析编排
    classifier.ts            页面类型分类规则
    debt-score.ts            信息债评分
    reading-time.ts          阅读时间估算
    recommendation.ts        处理建议与状态映射
    dashboard.ts             仪表盘搜索、排序、批量操作
    review.ts                Review Mode 队列与总结
    topics.ts                本地主题聚类
    usage-intelligence.ts    使用行为统计与重复保存提醒
    import-export.ts         JSON 导入导出
    settings.ts              用户偏好设置
    demo-data.ts             演示数据
    demo-readiness.ts        演示完整度检查
  storage/
    links.ts                 链接本地存储封装
    settings.ts              设置本地存储封装
  tabs/
    dashboard.tsx            仪表盘页面
  types/
    link.ts                  共享数据模型
```

## 本地开发

安装依赖：

```bash
npm.cmd install
```

启动开发模式：

```bash
npm.cmd run dev
```

构建 Chrome 扩展：

```bash
npm.cmd run build
```

在 Chrome 中加载扩展：

1. 打开 `chrome://extensions`。
2. 开启右上角的 Developer Mode。
3. 点击 Load unpacked。
4. 选择 `build/chrome-mv3-prod`。

## 验证命令

运行测试：

```bash
npm.cmd test
```

运行 TypeScript 检查：

```bash
npm.cmd run typecheck
```

运行生产构建：

```bash
npm.cmd run build
```

运行完整验证：

```bash
npm.cmd run verify
```

## 演示建议

适合作品集演示的流程：

1. 打开一篇长文章，确认系统建议稍后阅读。
2. 打开一篇短内容，确认系统建议现在读完。
3. 打开一个工具页，保存到工具箱并添加备注。
4. 打开文档页，确认可转成任务。
5. 保存多条链接后进入仪表盘，演示搜索、排序、筛选和批量处理。
6. 使用 Review Mode 逐条清理队列。
7. 使用 Topic Groups 聚合同类链接，只保留最值得读的几条。
8. 打开仪表盘中的链接，确认 Usage Intelligence 状态更新。
9. 导出 JSON，再导入并确认 URL 去重正常。
10. 调整偏好设置，观察长文章阈值和陈旧链接判断变化。

## 当前状态

这是一个本地优先的 MVP：规则引擎、弹窗分析、仪表盘管理、导入导出、演示数据和测试覆盖已经搭好。它更像一个「信息整理助手」，帮用户在保存之前先做一次小小的反悔。
