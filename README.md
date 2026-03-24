# 销售CRM系统

企业级CRM单页应用，支持线索、客户、商机、合同、项目、跟进、客户维护等完整业务流程。

## 功能特性

- **工作台** - 数据总览 + 金额汇总条 + 可点击跳转
- **线索管理** - 新增/删除/查看详情/快速跟进
- **客户管理** - 完整客户档案，A/B/C分级
- **商机管理** - 看板视图（5阶段），含需求多产品预留
- **合同管理** - 合同上传+金额追踪
- **项目实施** - 里程碑进度卡片
- **跟进提醒** - 到期分类+完成操作+语音录入（支持iOS Safari/Chrome）
- **客户维护** - 定期计划，自动计算下次维护时间
- **名片录入** - 拍照上传+保存为线索/客户
- **系统设置** - 下拉框全部可自定义+JSON导入导出

## 技术栈

- 纯前端 HTML/CSS/JavaScript
- LocalStorage 本地存储
- 响应式设计，支持电脑和手机
- Web Speech API 语音识别

## 部署方式

### 本地运行

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx http-server -p 8080
```

访问 http://localhost:8080

### Vercel 部署

1. 安装 Vercel CLI
```bash
npm install -g vercel
```

2. 在项目目录执行
```bash
vercel
```

3. 按提示完成部署，获得一个 .vercel.app 域名

## 登录密码

默认密码：`crm888`

可在 `index.html` 中修改 `LOGIN_PASSWORD` 变量更改密码。

## 数据说明

数据保存在浏览器 localStorage 中，清除浏览器数据会丢失。建议定期使用系统设置中的「导出全部数据」功能备份。
