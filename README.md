# World Tour Globe

基于 PRD《全球地区特色地球可视化》的可运行交付版本。

## 技术栈

- Vite + TypeScript
- Three.js（WebGL）
- 原生 HTML/CSS 控件面板

## 本地运行

```bash
npm install
npm run dev
```

访问：

- `http://localhost:5173/`
- `http://localhost:5173/garden-earth-rebuild.html`

注意：不要用 `file://` 直接打开页面，否则会触发浏览器 CORS 拦截。

## 已实现能力（对应 M1~M4）

- 地球交互：鼠标/触控旋转、缩放、阻尼惯性。
- 动画控制：自动自转开关、导览轮播开关。
- 区域识别：8 大区底色差异、边界环、选中态脉冲高亮。
- 主题图层：
  - `flowers`：区域内多层花簇粒子；
  - `fairy`：萤火粒子 + 柔光轨迹；
  - `destinations`：目的地点位 + 区域连线。
- 主题叠加：支持单主题与组合，且平滑渐入渐出。
- 目的地叙事：点击点位弹出信息卡并触发镜头聚焦。
- 强度控制：Slider 同时影响高亮与特效强度。
- 移动端适配：面板重排与低性能粒子预算降级。

## 目录结构

- `src/app.ts`：场景、交互、动画状态主逻辑。
- `src/data.ts`：区域与目的地配置数据。
- `src/geo.ts`：经纬度和区域几何工具函数。
- `src/types.ts`：公共类型定义。
- `src/style.css`：面板与响应式样式。
- `doc/DELIVERY-PLAN.md`：执行计划与交付状态。
- `doc/PRD-全球地区特色地球可视化.md`：需求原文。

## 验证命令

```bash
npm run build
```

当前构建可通过。Vite 会提示包体积告警（`three` 主包导致），不影响功能。

