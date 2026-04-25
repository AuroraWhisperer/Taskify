# Taskify 项目缺陷全面分析报告

> **项目概况**：一个基于 Node.js + Express + EJS 的任务管理应用，处于极早期开发阶段。大量核心文件为空文件，功能几乎未实现。

---

## 1. Hardcoded Configuration（硬编码配置）

**严重度：中**

**问题 1：端口硬编码默认值 80**
```js
// src/app.js:9
const port = process.env.PORT || 80;
```
端口 80 需要 root 权限，在生产环境中存在安全隐患，且与反向代理标准实践冲突。

**问题 2：用户名硬编码为占位符**
```html
<!-- views/partials/dashboard/navbar-dashboard.ejs:35 -->
<button onclick="myFunction()" class="dashboard-navbar-dropbtn">
  Lord Voldemort <i class="fa-solid fa-chevron-down"></i>
</button>
```
虚构用户名直接写死在 UI 中，无动态渲染逻辑。

**问题 3：无 `.env.example` 文件**
项目没有提供 `.env.example` 模板，新协作者不知道需要哪些环境变量（如 `PORT`、DB 连接串、Cloudinary 密钥等）。

---

## 2. CSRF（跨站请求伪造）

**严重度：高**

```html
<!-- views/signup.ejs:20 -->
<form method="post" action="/signup">
  ...
</form>

<!-- views/signup.ejs:37 -->
<form method="post" action="/login">
  ...
</form>
```

- 所有 POST 表单均无 CSRF token 字段
- `src/app.js` 中完全没有引入任何 CSRF 防护中间件（如 `csurf`）
- 攻击者可构造恶意页面，诱导已登录用户的浏览器向服务端发起伪造请求

---

## 3. Easiness of Unit Testing（单元测试难易度）

**严重度：高**

**问题 1：测试框架完全缺失**
```json
// package.json:7
"test": "echo \"Error: no test specified\" && exit 1"
```
项目中无 Jest、Mocha、Chai 等测试框架，无任何测试文件。

**问题 2：`app.js` 启动时直接连接数据库，无依赖注入**
```js
// src/app.js:5
require("../src/db/conn");  // 副作用式导入，单元测试无法 mock

// src/app.js:37-39
app.listen(port, () => {   // listen 直接在模块加载时执行，无法独立测试路由
    console.log(`...`);
});
```
路由、服务器、数据库三者紧耦合，单元测试时无法单独测试路由逻辑。

**问题 3：路由未模块化**
`app.js` 同时承担配置、路由和启动职责，不符合单一职责原则，难以隔离测试。

---

## 4. Cross-Site Scripting（XSS 跨站脚本）

**严重度：高**

**问题 1：无 Content-Security-Policy 响应头**
```js
// src/app.js —— 无任何安全响应头设置
// 缺少 helmet 或手动设置 CSP
```

**问题 2：EJS 模板中内联事件处理器违反 CSP 最佳实践**
```html
<!-- views/partials/dashboard/navbar-dashboard.ejs:35 -->
<button onclick="myFunction()" class="dashboard-navbar-dropbtn">
```
```html
<!-- views/partials/dashboard/navbar-dashboard.ejs:53-73 -->
<script>
  function myFunction() { ... }
  window.onclick = function(event) { ... }
</script>
```
内联 JS 代码块会导致即使部署了 CSP 也需要 `unsafe-inline`，完全失去 XSS 防护意义。

**问题 3：`<%-include()%>` 与 `<%=` 使用混乱的潜在风险**
```html
<!-- views/index.ejs:27 -->
<%-include("../views/partials/nav.ejs") %>
```
`<%-` 输出未转义内容，如果 include 的内容含有动态用户数据，将直接产生 XSS。

---

## 5. Scalability（可扩展性）

**严重度：高**

**问题 1：无任何数据库集成**
```js
// src/db/conn.js —— 完全空文件
// package.json dependencies: 仅有 dotenv, ejs, express
```
`mongoose`、`pg`、`mysql2` 等数据库驱动均未安装，无法持久化任何数据。

**问题 2：仪表盘内容全部是静态占位符**
```html
<!-- views/partials/dashboard/dashboard-cards.ejs:40,75,96 -->
<div class="dashboard-task-number">0</div>  <!-- 硬编码为 0 -->
<div class="dashboard-task-head">Lorem ipsum dolor sit amet.</div>
```

**问题 3：无集群/负载均衡支持**
Node.js 默认单进程，没有使用 `cluster` 模块或 PM2 配置，无法利用多核 CPU。

**问题 4：路由文件全部为空**
```
src/routes/dashboard.route.js  —— 空文件
src/routes/login.route.js      —— 空文件
src/routes/signup.route.js     —— 空文件
```
但这些路由文件也没有被 `app.js` 引入，存在双重设计断层。

---

## 6. Persistence Layer（持久层）

**严重度：严重**

```js
// src/db/conn.js —— 空文件，无任何数据库连接代码
// src/models/user.model.js —— 空文件，无任何数据模型
// src/cloudinary/index.js —— 空文件，无图片上传配置
```

- 没有数据库连接逻辑
- 没有用户数据模型
- 没有任务数据模型
- 用户注册/登录表单提交到 `/signup` 和 `/login`，但服务端没有对应路由处理器
- 所有任务数据均为前端 HTML 硬编码，刷新后丢失

---

## 7. Error Handling（错误处理）

**严重度：高**

**问题 1：无全局错误处理中间件**
```js
// src/app.js —— 无以下代码
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
```

**问题 2：无 404 处理**
```js
// src/app.js —— 无兜底路由
app.use((req, res) => {
    res.status(404).render('404');
});
```
访问任何未定义路由将导致 Express 默认返回 `Cannot GET /xxx`，泄露框架信息。

**问题 3：数据库连接失败无容错**
```js
// src/app.js:5
require("../src/db/conn");  // 若连接失败，整个应用崩溃无任何恢复逻辑
```

---

## 8. State Management（状态管理）

**严重度：严重**

**问题 1：Dashboard 无认证直接可访问**
```js
// src/app.js:29-31
// In Future this dashboard will be rendered after authentication of users
app.get("/dashboard", (req, res) => {
    res.status(200).render("dashboard/dashboard.ejs");
});
```
开发者自己注释承认尚未实现认证，但路由已对外暴露。

**问题 2：登录按钮直接跳转 Dashboard**
```html
<!-- views/partials/nav.ejs:30 -->
<a href="/dashboard" class="btn2 nav-btn">Log In</a>
```
"Log In" 链接不经过任何认证，直接导航至 `/dashboard`。

**问题 3：无 Session/Cookie/JWT 机制**
```json
// package.json dependencies:
// 无 express-session, jsonwebtoken, cookie-parser, passport 等
```

---

## 9. Validation（输入验证）

**严重度：高**

**问题 1：仅有 HTML5 前端校验，无服务端校验**
```html
<!-- views/signup.ejs:23-29 -->
<input type="text" name="SignUpUsername" placeholder="User name" required="true" />
<input type="email" name="SignUpEmail" placeholder="Email" required="true" />
<input type="password" name="SignUpPassword" placeholder="Password" required="true" />
```
`required="true"` 可被 curl、Postman 等工具绕过，服务端路由处理器为空，无任何服务端校验。

**问题 2：无密码强度要求**
密码输入框无最小长度、复杂度校验。

**问题 3：无防重复注册逻辑**
用户模型为空，也没有检查邮箱是否已存在的逻辑。

**问题 4：`required` 属性值错误**
```html
required="true"  <!-- 错误，HTML 标准中 required 是布尔属性，应写 required 或 required="" -->
```

---

## 10. Concurrency Issues（并发问题）

**严重度：中**

**问题 1：无速率限制**
```js
// src/app.js —— 无 express-rate-limit
```
登录/注册接口无速率限制，可被暴力破解攻击。

**问题 2：无数据库连接池配置**
```js
// src/db/conn.js —— 空文件
```
即使将来实现，没有连接池配置会导致高并发下连接数耗尽。

**问题 3：Express 路由无请求队列管理**
无任何针对高并发请求的排队或限流机制。

---

## 11. Database Security（数据库安全）

**严重度：严重**

**问题 1：无密码哈希**
```json
// package.json: 无 bcrypt, argon2, scrypt 等
```
将来实现用户注册时，密码极可能明文存储。

**问题 2：无注入防护**
数据模型为空文件，没有任何参数化查询、ORM Schema 验证。

**问题 3：数据库连接文件完全为空**
```js
// src/db/conn.js —— 1 行空文件
// 既无连接串配置，也无认证信息保护
```

---

## 12. Auditability（可审计性）

**严重度：中**

**问题 1：无日志记录**
```json
// package.json: 无 morgan, winston, pino 等日志库
```

**问题 2：无请求 ID 追踪**
无法追踪特定请求的完整生命周期。

**问题 3：无用户操作审计日志**
没有记录"谁在什么时间做了什么"的任何机制。

**问题 4：`console.log` 作为唯一输出**
```js
// src/app.js:38
console.log(`The application started successfully on port ${port}`);
```
生产环境直接用 `console.log`，无日志级别控制，无结构化日志格式。

---

## 13. Privacy & Compliance（隐私合规）

**严重度：中**

**问题 1：收集邮箱但无隐私声明**
```html
<!-- views/partials/hero.ejs:25 -->
<input class="hero-input-email" type="email" name="email" id="hero-email"
  placeholder="Enter your email address">
```
首页直接收集邮箱地址，无任何隐私政策链接、同意声明或数据使用说明（GDPR/CCPA 合规要求）。

**问题 2：无 Cookie 同意机制**
虽然尚未设置 Cookie，但一旦添加 Session，需要 Cookie 同意横幅。

**问题 3：无数据最小化原则**
注册表单字段设计未考虑只收集必要信息。

---

## 14. Authentication Issues（认证问题）

**严重度：严重**

这是项目最根本的缺陷集中领域：

| 缺失项 | 文件 |
|---|---|
| Auth 中间件为空 | `src/middleware/auth.js` |
| 登录路由为空 | `src/routes/login.route.js` |
| 注册路由为空 | `src/routes/signup.route.js` |
| 用户模型为空 | `src/models/user.model.js` |
| Dashboard 无需认证 | `src/app.js:29` |

```html
<!-- views/partials/nav.ejs:30 —— "Log In" 直接绕过认证跳转 Dashboard -->
<a href="/dashboard" class="btn2 nav-btn">Log In</a>
```

- 无 Session 管理
- 无 JWT 实现
- 无密码重置功能
- 无多次失败后锁定账号机制
- 无 OAuth/第三方登录

---

## 15. Performance Issues（性能问题）

**严重度：中**

**问题 1：EJS partial 文件包含完整 HTML 文档结构**
```html
<!-- views/partials/dashboard/dashboard-cards.ejs:1-5 -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  ...
  <link rel="stylesheet" href="...dashboard-cards.css" />
```
每个 partial 都有独立的 `<!DOCTYPE html>`、`<html>`、`<head>`、`<body>` 标签。当被 `<%- include() %>` 嵌入时，会生成嵌套的非法 HTML 结构，破坏 DOM 解析性能。

**问题 2：CSS 文件在 partial 中重复引入**
每个 partial 都重复加载 `main.css`：
```html
<!-- dashboard-cards.ejs:10, dashboard-sidebar.ejs:14, navbar-dashboard.ejs:10 -->
<link rel="stylesheet" href="../../../static/styles/main.css">
```

**问题 3：外部资源无 `font-display: swap`**
```html
<!-- views/index.ejs:13-17 -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat..." rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Nunito..." rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" />
```
字体加载阻塞渲染，无 `font-display: swap` 优化，无 `preload` 提示。

**问题 4：静态文件无缓存策略**
```js
// src/app.js:12
app.use("/static", express.static(static_path));
// 未设置 maxAge 缓存控制头
```

---

## 16. UX/UI Feedback（用户体验反馈）

**严重度：中**

**问题 1：表单提交无任何反馈**
```html
<!-- views/signup.ejs —— 提交后路由为空，用户不知道发生了什么 -->
<form method="post" action="/signup">
<form method="post" action="/login">
```

**问题 2：所有侧边栏和导航链接均为空锚点**
```html
<!-- views/partials/dashboard/dashboard-sidebar.ejs —— 所有链接 -->
<a href="#">Overview</a>
<a href="#">Stats</a>
<a href="#">Projects</a>
<a href="#">Chat</a>
<a href="#">Log out</a>  <!-- 退出登录也是 # -->
```

**问题 3：任务数量永久显示为 0**
```html
<!-- views/partials/dashboard/dashboard-cards.ejs:40,75 -->
<div class="dashboard-task-number">0</div>
```

**问题 4：Hero 区域描述文字被注释掉**
```html
<!-- views/partials/hero.ejs:22 -->
<div class="hero-desc">
  <!-- Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat, explicabo. -->
</div>
```
内容区域为空，用户无法理解产品价值。

**问题 5：`signup.ejs` 存在重复 `</html>` 标签**
```html
<!-- views/signup.ejs:54-57 -->
</body>
</html>
</head>    <!-- head 出现在 html 关闭之后 -->
</html>    <!-- 重复的关闭标签 -->
```

---

## 总结

| 类别 | 严重度 | 核心问题 |
|---|---|---|
| 认证 | **严重** | 中间件、路由、模型全部为空，Dashboard 无保护 |
| 持久层 | **严重** | 数据库连接和模型均为空文件，无任何存储 |
| 数据库安全 | **严重** | 无密码哈希、无注入防护 |
| CSRF | **高** | POST 表单无 Token 保护 |
| XSS | **高** | 无 CSP 头、内联脚本 |
| 错误处理 | **高** | 无全局错误处理器、无 404 页面 |
| 状态管理 | **严重** | 无 Session/JWT，认证状态无法维护 |
| 输入验证 | **高** | 仅前端 HTML 校验，服务端完全缺失 |
| 单元测试 | **高** | 无测试框架、无测试文件、代码紧耦合 |
| 性能 | **中** | Partial 包含完整 HTML 文档、CSS 重复加载 |

**该项目目前是一个纯静态前端原型，尚不具备任何实际后端功能。** 在进入任何实际用户之前，至少需要完成：认证系统、数据库接入、CSRF/XSS 防护、服务端验证和错误处理。
