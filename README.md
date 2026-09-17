# 荔窗流影

## LIWAN · WINDOW FLOW

一个纯浏览器运行的 React + TypeScript + Vite 文字图像应用。图片分析由 Canvas 完成，最终构图、文字主体、动画与岭南窗花均由 SVG 呈现。

所有图像数据只在当前浏览器标签页内处理，不需要后端、数据库或第三方 AI 服务。

## 本地运行

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址。建议使用 Node.js 20 或更高版本。

## 技术栈

- React 19
- TypeScript
- Vite
- Canvas：图片变换、像素分析、颜色和亮度采样
- SVG：文字图像、动画、花窗与最终构图
- WebCodecs + Mediabunny：浏览器本地 H.264 MP4 / WebM 编码与封装

## 发布到 GitHub Pages

项目已包含自动部署工作流 `.github/workflows/deploy-pages.yml`，并已适配 GitHub 项目子路径。

仓库已包含自动部署工作流。推送到 `main` 后，在仓库的 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**，等待 Pages 工作流完成即可。

之后页面会发布到：

```text
https://eiyun.github.io/LIWAN-WINDOW-FLOW/
```

以后每次推送到 `main` 分支都会自动重新构建并发布。

## 功能

- 本地图像上传，并适配 1:1、9:16、16:9 三种画布比例
- 统一图片变换坐标：0.25×–4× 缩放、水平/垂直位移、Fit、Fill、Center、Reset
- 调整图片模式支持鼠标、触控板、手指和触控笔拖动，桌面端支持滚轮定点缩放
- 画布比例改变后自动重新 Fit，避免旧比例坐标导致构图错位
- 基于局部对比度、亮度、饱和度与中心权重的主体软蒙版检测
- 自动主体、矩形框选、画笔涂抹三种统一蒙版模式
- Pointer Events 画笔支持鼠标、触控板、手机触屏与触控笔，包含软边、添加、擦除、撤销和重做
- 原图仅用于本地采样，最终画面不显示主体外部的照片内容
- 可自定义纯色背景，默认岭南蓝 `#204E8A`
- 逐格采样原图颜色和亮度的 Typographic Image
- 文字输入支持 1–3 行、Unicode 安全计数与三层 50 字限制，整段文字作为循环填充源
- 入场与退场动画独立组合：打字机、淡入、波浪、随机闪烁、文字雨，以及淡出、花瓣聚合、散开消失
- 入场、停留、退场和循环间隔可分别设置，预览与视频使用同一时间轴
- 5 组花窗 PNG 模板；横版采用 1920×1080 的 16:9 花窗构图，原有 4:3 素材保留并在浏览器中适配
- 从花窗中央透明开口生成精确蒙版：编辑底图与文字图像都不会越过窗棂，外侧仍为纯色背景
- 同一花窗编号在切换画布比例时保持一致，缩略图可直接选择
- PNG、SVG 与真正的 H.264 MP4 / WebM 视频导出；视频支持 15、30、45、60 秒和进度/取消
- MP4 为默认格式，不会被悄悄替换成 WebM；不支持 H.264 编码的浏览器会给出明确提示

## 花窗资源

15 张花窗图片位于：

```text
public/frames/1x1/frame01.png ... frame05.png
public/frames/9x16/frame01.png ... frame05.png
public/frames/4x3/frame01.png ... frame05.png  # 保留的横版原始素材
```

花窗作为最上层合成到实时预览、PNG、SVG 和视频中。切换至 16:9 时，应用将原有横版素材的中央纹样扩展为 1920×1080，并保持左右边柱比例；因此无需覆盖原始 PNG。资源通过相对路径加载，可直接部署到 GitHub Pages 的仓库子路径。

## 视频导出说明

视频完全在浏览器本地生成：应用使用同一套动画时间轴将 SVG 逐帧绘制到 Canvas，以 24 fps 的确定时间戳编码，再由 Mediabunny 封装为 MP4 或 WebM，不上传图片或视频。导出过程需要保持当前页面打开；高分辨率长视频在性能较弱的手机上可能耗时较长，并需要一定内存。MP4 需要浏览器支持 WebCodecs H.264，建议使用最新版 Chrome、Edge 或 Safari。

## 图片变换与导出一致性

原始图片只加载一次。`ImageTransform { scale, x, y }` 先通过统一 Canvas 生成当前画布坐标下的采样图，自动主体识别与文字颜色采样均读取该结果；矩形选区和画笔蒙版同样使用画布坐标。编辑参考图层不会导出，PNG、SVG 和视频共同导出由当前采样结果生成的 SVG 文字层，因此与预览保持一致。

## 构建

```bash
npm run build
```

静态产物会输出到 `dist` 文件夹，可部署到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态文件服务器。
