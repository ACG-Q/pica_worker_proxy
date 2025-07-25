# 📘 Pica Comic 透明代理 Worker

这是一个用于代理 [picaapi.picacomic.com](https://picaapi.picacomic.com) 的 Cloudflare Worker 项目，特点如下：

**主要功能：**

- 🔁 透明转发所有 API 请求到 `picaapi.picacomic.com`
- 🌐 自动添加 CORS 响应头，支持浏览器跨域访问
- 🖥️ `/` 路径下提供图文使用说明页面 + 一键复制按钮
- 🔌 支持 Venera 插件（如 `picacg.js`）直接替换接口使用
- �� 内置访问日志记录，方便调试和审计

## 🚀 部署方法

1. 打开 [Cloudflare Workers 控制台](https://dash.cloudflare.com/?to=/:account/workers)
2. 创建一个新的 Worker
3. 将本项目中的 `worker.js` 内容粘贴进去
4. 点击部署，获得你的专属地址，例如：

   ```
   https://your-name.workers.dev
   ```

## 📦 使用方法

### 👉 Venera 插件（picacg.js 用户）

将漫画源的接口地址从：

```
https://picaapi.picacomic.com
```

替换为你的 Worker 代理地址：

```
https://your-name.workers.dev/api
```

即可无缝代理访问，无需修改插件本体。

### 🧪 开发调试用途

Worker 会将：

```
https://your-name.workers.dev/api/xxx
```

等价转发为：

```
https://picaapi.picacomic.com/xxx
```

保持请求方法、Headers、Body 完整，适合调试签名、Token、认证等行为。

#### 🚦 /p= 路径补充说明|图片代理

图片资源和 API 数据接口是分开的，直接用原始图片链接在前端访问时，通常直接访问，图片是无法正常显示。为了解决这个问题，需要把图片的链接改造成 `/p=原始图片地址` 这种形式，让 Worker 代理图片请求，这样浏览器就能顺利加载图片了。


**示例：**

原始图片地址：
```
https://storage.picacomic.com/static/xxx.jpg
```

代理后访问：
```
https://your-name.workers.dev/p=https%3A%2F%2Fstorage.picacomic.com/static/xxx.jpg
```

## 🔍 其他说明

- 本代理不会自动附加 Token、签名，请由前端插件或调用方自行处理；
- 日志通过 `console.log()` 输出，可在 Cloudflare Dashboard 日志中查看；
- 默认允许所有来源 CORS（如需限制可自行修改 CORS Header）；