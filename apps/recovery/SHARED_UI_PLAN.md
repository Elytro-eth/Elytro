# 共享 UI 组件和设计变量方案

## 📋 问题现状

目前 `/extension` 和 `/recovery` 应用中存在大量重复的：
- **UI 组件** (button, dialog, input, toast 等)
- **设计变量** (颜色、间距、排版、圆角等)
- **配置文件** (tailwind.config.js, globals.css/index.css)

## 🎯 推荐方案：创建共享设计系统包

### 方案概述
在 monorepo 根目录创建一个 `@elytro/ui` 包（或 `@elytro/design-system`），包含所有共享的 UI 组件、设计令牌和样式配置。

```
/Users/rexchen/dev/Elytro/
├── apps/
│   ├── extension/
│   ├── recovery/
│   └── ...
├── packages/                         # 新增
│   ├── ui/                          # 共享 UI 包
│   │   ├── src/
│   │   │   ├── components/          # 所有 UI 组件
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   └── ...
│   │   │   ├── styles/              # 样式文件
│   │   │   │   ├── globals.css
│   │   │   │   └── tokens.css
│   │   │   ├── config/              # 配置导出
│   │   │   │   └── tailwind.config.ts
│   │   │   └── index.ts             # 入口文件
│   │   ├── tailwind.config.js       # 共享 tailwind 配置
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ...
├── package.json
└── pnpm-workspace.yaml (or similar)
```

---

## 📦 实施步骤

### 第 1 步：创建共享 UI 包

```bash
# 在 packages 目录下创建
mkdir -p packages/ui/src/{components,styles,config}

# 初始化 package.json
cat > packages/ui/package.json << 'EOF'
{
  "name": "@elytro/ui",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./styles": "./dist/styles/globals.css",
    "./tailwind": "./tailwind.config.js"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.0.0"
  }
}
EOF
```

### 第 2 步：统一设计令牌

创建 `packages/ui/src/styles/tokens.ts`：

```typescript
// 所有颜色、间距、排版的单一真实来源
export const designTokens = {
  colors: {
    gray: { 900: '#3c3f45', 750: '#676b75', ... },
    blue: { 900: '#05131a', 750: '#0a2533', ... },
    // ... 其他颜色
  },
  spacing: {
    '4xs': '1px', '3xs': '2px', '2xs': '4px',
    'xs': '6px', 'sm': '8px', 'md': '12px', ...
  },
  borderRadius: {
    'xs': '4px', 'sm': '8px', 'md': '16px', ...
  },
  fontSize: {
    'xs': '12px', 'sm': '14px', 'base': '16px', ...
  },
};
```

### 第 3 步：统一 Tailwind 配置

创建 `packages/ui/tailwind.config.js`：

```javascript
// 从设计令牌导出配置
module.exports = {
  mode: 'jit',
  darkMode: ['class'],
  theme: {
    extend: {
      // 从 tokens 统一配置
      colors: designTokens.colors,
      spacing: designTokens.spacing,
      // ... 其他配置
    },
  },
};
```

### 第 4 步：提取所有 UI 组件

1. **合并 extension 和 recovery 的 UI 组件**：
   - 优先使用 extension 的更完整的组件库（54 个 UI 组件 vs 4 个）
   - 补充 recovery 独有的组件（如 `AddressWithChain`, `ContentWrapper` 等）

2. **标准化组件 API**：
   - 确保相同功能的组件有一致的 props
   - 添加 JSDoc 文档

### 第 5 步：更新应用配置

在 `extension` 和 `recovery` 的 `package.json` 中添加依赖：

```json
{
  "dependencies": {
    "@elytro/ui": "workspace:*"
  },
  "devDependencies": {
    "@elytro/ui": "workspace:*"
  }
}
```

### 第 6 步：简化应用的 Tailwind 配置

替换 `apps/extension/tailwind.config.js` 和 `apps/recovery/tailwind.config.js`：

```javascript
// apps/*/tailwind.config.js
const baseConfig = require('@elytro/ui/tailwind.config.js');

module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{tsx,html}'],
  // 如需覆盖，在此处添加
};
```

### 第 7 步：导入全局样式

在各应用的入口：

```typescript
// apps/extension/src/index.tsx or apps/recovery/src/app/layout.tsx
import '@elytro/ui/styles';
import '@/styles/local-overrides.css'; // 应用特有的样式
```

---

## ✅ 优势

| 优势 | 说明 |
|------|------|
| 🎨 **单一真实来源** | 所有设计决策在一处维护 |
| 🔄 **减少重复** | 消除 50% 以上的配置文件重复 |
| 📈 **可扩展性** | 新增应用自动获得最新 UI 系统 |
| 🚀 **快速迭代** | UI 更新立即影响所有应用 |
| 📚 **一致性** | 统一的组件 API 和设计语言 |
| 🧪 **集中测试** | UI 组件在共享包中集中测试 |

---

## 🔄 迁移路线图

| 阶段 | 任务 | 预计时间 |
|------|------|--------|
| **Phase 1** | 创建 UI 包结构、提取设计令牌 | 2-3 天 |
| **Phase 2** | 迁移所有 UI 组件到共享包 | 3-4 天 |
| **Phase 3** | 更新应用配置和导入 | 1-2 天 |
| **Phase 4** | 测试和调整 | 2-3 天 |
| **Phase 5** | 文档和知识交接 | 1 天 |

**总计：约 10-13 个工作日**

---

## 🛠 具体待做项

### UI 包迁移
- [ ] 创建 packages/ui 目录结构
- [ ] 提取和规范化 tailwind.config.js
- [ ] 创建 designTokens 中心化配置
- [ ] 复制 extension 的 54 个 UI 组件
- [ ] 补充 recovery 独有的 5 个组件
- [ ] 添加组件文档和使用示例
- [ ] 创建 index.ts 导出所有组件

### 应用更新
- [ ] 更新 extension/package.json (添加 @elytro/ui 依赖)
- [ ] 更新 recovery/package.json (添加 @elytro/ui 依赖)
- [ ] 简化 extension/tailwind.config.js
- [ ] 简化 recovery/tailwind.config.js
- [ ] 删除 extension/src/components/ui (替换为导入)
- [ ] 删除 recovery/src/components/ui (替换为导入)
- [ ] 更新所有导入路径
- [ ] 测试各应用的样式和组件

### 文档
- [ ] 编写 UI 包 README
- [ ] 创建组件使用指南
- [ ] 文档化设计令牌
- [ ] 示例应用集成步骤

---

## 📝 注意事项

1. **Monorepo 工具**：确认使用 pnpm/yarn/npm workspaces
2. **构建配置**：需要配置共享包的构建流程（如 tsup, swc）
3. **版本管理**：可以使用 changeset 或 lerna 管理版本
4. **样式冲突**：迁移前审查两个应用的 CSS 差异
5. **渐进式迁移**：可以先共享部分组件（如 button）再逐步扩展

---

## 💡 额外建议

1. **组件变体系统**：使用 CVA（class-variance-authority）管理组件变体
2. **主题支持**：虽然目前没有深色模式，但设计系统应为此做准备
3. **Storybook**：为共享 UI 包建立 Storybook 文档网站
4. **TypeScript**：确保所有组件有完整的 TS 类型定义
5. **CI/CD**：在自动化流程中测试共享包的更新

---

## 联系&支持

如有问题，请联系设计系统团队。

