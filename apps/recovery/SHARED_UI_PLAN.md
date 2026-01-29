# 共享 UI 组件和设计变量方案

## 📋 问题现状

目前 `/extension` 和 `/recovery` 应用中存在大量重复的：
- **UI 组件** (button, dialog, input, toast 等)
- **设计变量** (颜色、间距、排版、圆角等)
- **配置文件** (tailwind.config.js, globals.css/index.css)

## 🎯 方案：Extension 作为 Canonical 源

### 方案概述

**`/extension` 是 UI 组件和设计系统的权威来源（canonical source）。**

`/recovery` 应用将：
1. 直接使用 `/extension` 中已有的组件（通过共享包）
2. 遵循 `/extension` 的设计令牌和样式规范
3. 如需新组件，优先在 `/extension` 中创建，再由 `/recovery` 使用

### 目录结构

```
/Users/rexchen/dev/Elytro/
├── apps/
│   ├── extension/                   # 📌 CANONICAL SOURCE
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ui/             # 权威 UI 组件库 (54+ 组件)
│   │   │   └── ...
│   │   ├── tailwind.config.js      # 权威 Tailwind 配置
│   │   └── ...
│   ├── recovery/                    # 消费者应用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ui/             # 仅保留 recovery 特有组件
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── packages/
│   └── ui/                          # 共享 UI 包（从 extension 提取）
│       ├── src/
│       │   ├── components/          # 镜像 extension 的 UI 组件
│       │   ├── styles/
│       │   └── index.ts
│       ├── tailwind.config.js       # 基于 extension 的配置
│       └── package.json
└── pnpm-workspace.yaml
```

---

## ✅ Phase 0: 直接导入（已完成）

在创建共享包之前，我们先实现了直接从 extension 导入的方案来验证可行性。

### 已完成的配置

**1. recovery/tsconfig.json** - 添加路径别名：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@elytro/extension-ui/*": ["../extension/src/components/ui/*"]
    }
  }
}
```

**2. recovery/next.config.mjs** - 启用外部目录编译：
```javascript
experimental: {
  externalDir: true,
},
webpack: (config) => {
  config.resolve.alias['@elytro/extension-ui'] = path.resolve(__dirname, '../extension/src/components/ui');
  return config;
},
```

**3. recovery/src/utils/shadcn/utils.ts** - 兼容性 shim：
```typescript
// Re-export cn for extension component compatibility
export { cn } from '@/lib/utils';
```

### 已迁移的组件

| 组件 | 状态 | 说明 |
|------|------|------|
| Button | ✅ 已迁移 | `import { Button } from '@elytro/extension-ui/button'` |
| Dialog | ✅ 已迁移 | `import { Dialog, ... } from '@elytro/extension-ui/dialog'` |
| Toast | ✅ 已迁移 | `import { Toast, ... } from '@elytro/extension-ui/toast'` |
| Toaster | ⚠️ 保留本地 | recovery 自定义布局，内部使用 extension Toast 组件 |

### 已删除的重复文件

- `recovery/src/components/ui/button.tsx`
- `recovery/src/components/ui/dialog.tsx`
- `recovery/src/components/ui/toast.tsx`

### API 适配

- Button `size="lg"` → `size="regular"` (extension 最大尺寸)

---

## 📦 Phase 1+: 共享 UI 包（待实施）

当直接导入验证成功后，可选择提取到独立共享包以获得更清晰的架构。

### 第 1 步：创建共享 UI 包（从 extension 提取）

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

### 第 2 步：从 extension 提取设计令牌

基于 `/extension/tailwind.config.js` 创建 `packages/ui/src/styles/tokens.ts`：

```typescript
// 从 extension 的 tailwind.config.js 提取，作为单一真实来源
export const designTokens = {
  colors: {
    // 直接复制 extension 的颜色配置
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

### 第 3 步：基于 extension 创建共享 Tailwind 配置

从 `/extension/tailwind.config.js` 复制并创建 `packages/ui/tailwind.config.js`：

```javascript
// 基于 extension 的配置（canonical source）
module.exports = {
  mode: 'jit',
  darkMode: ['class'],
  theme: {
    extend: {
      colors: designTokens.colors,
      spacing: designTokens.spacing,
      // ... 与 extension 保持一致
    },
  },
};
```

### 第 4 步：从 extension 复制 UI 组件

**直接将 extension 的 UI 组件复制到共享包：**

```bash
# 复制 extension 的所有 UI 组件到共享包
cp -r apps/extension/src/components/ui/* packages/ui/src/components/
```

- **extension 的组件即为标准**，不做修改
- **extension 保持不变**，继续使用本地组件或改为使用共享包
- **recovery 移除重复组件**，改为导入共享包

### 第 5 步：更新 recovery 配置

仅在 `recovery` 的 `package.json` 中添加依赖（extension 可选）：

```json
{
  "dependencies": {
    "@elytro/ui": "workspace:*"
  }
}
```

### 第 6 步：简化 recovery 的 Tailwind 配置

替换 `apps/recovery/tailwind.config.js`：

```javascript
// apps/recovery/tailwind.config.js
// 继承 extension 的配置（通过共享包）
const baseConfig = require('@elytro/ui/tailwind.config.js');

module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{tsx,html}'],
  // recovery 特有的覆盖（如需要）
};
```

**注意：extension 的 tailwind.config.js 保持不变，因为它是 canonical source。**

### 第 7 步：更新 recovery 的导入

在 recovery 中替换本地 UI 组件导入：

```typescript
// ❌ 之前 (recovery 本地组件)
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// ✅ 之后 (使用共享包，来源于 extension)
import { Button, Dialog } from '@elytro/ui';
```

### 第 8 步：清理 recovery 的重复组件

删除 recovery 中与 extension 重复的 UI 组件：

```bash
# 删除 recovery 中已被共享包覆盖的组件
rm apps/recovery/src/components/ui/button.tsx
rm apps/recovery/src/components/ui/dialog.tsx
# ... 其他重复组件
```

**仅保留 recovery 特有的组件**（如果有且 extension 中不存在的）。

---

## ✅ 优势

| 优势 | 说明 |
|------|------|
| 🎨 **单一真实来源** | extension 是所有 UI 决策的权威来源 |
| 🔄 **减少重复** | recovery 不再维护重复的 UI 组件 |
| 📈 **简化维护** | 只需在 extension 中更新组件，recovery 自动受益 |
| 🚀 **快速迭代** | extension 的 UI 更新自动同步到 recovery |
| 📚 **一致性** | recovery 强制遵循 extension 的设计规范 |
| 🧪 **集中测试** | UI 组件在 extension 中测试，recovery 直接使用 |
| ⚡ **低风险** | extension 代码不变，仅 recovery 需要适配 |

---

## 🔄 迁移路线图

| 阶段 | 任务 | 状态 |
|------|------|------|
| **Phase 0** | 直接导入 - recovery 直接从 extension 导入组件 | ✅ 已完成 |
| **Phase 1** | 从 extension 提取 UI 组件到共享包 | ⏳ 待实施 |
| **Phase 2** | 从 extension 提取 Tailwind 配置和设计令牌 | ⏳ 待实施 |
| **Phase 3** | 更新 recovery 依赖和配置 | ⏳ 待实施 |
| **Phase 4** | 替换 recovery 中的组件导入 | ⏳ 待实施 |
| **Phase 5** | 删除 recovery 中的重复组件 | ⏳ 待实施 |
| **Phase 6** | 测试 recovery 应用 | ⏳ 待实施 |

> **注意**: Phase 0 已验证直接导入可行，Phase 1+ 为可选的架构优化。

---

## 🛠 具体待做项

### Phase 0: 直接导入（✅ 已完成）
- [x] 配置 recovery/tsconfig.json 路径别名
- [x] 配置 recovery/next.config.mjs 外部目录编译
- [x] 创建兼容性 shim (utils/shadcn/utils.ts)
- [x] 迁移 Button 组件导入
- [x] 迁移 Dialog 组件导入
- [x] 迁移 Toast 组件导入
- [x] 删除 recovery 中的重复组件 (button, dialog, toast)
- [x] 保留 recovery 特有的 Toaster 组件
- [x] 测试 recovery 应用构建

### Phase 1+: 共享 UI 包创建（⏳ 待实施）
- [ ] 创建 packages/ui 目录结构
- [ ] 从 extension/tailwind.config.js 提取设计令牌
- [ ] 基于 extension 创建共享 tailwind.config.js
- [ ] 复制 extension/src/components/ui 的所有组件到共享包
- [ ] 创建 index.ts 导出所有组件
- [ ] 配置共享包的构建流程

### Recovery 应用更新（Phase 1+ 后）
- [ ] 更新 recovery/package.json（添加 @elytro/ui 依赖）
- [ ] 简化 recovery/tailwind.config.js（继承共享配置）
- [ ] 更新导入路径从 `@elytro/extension-ui/*` 到 `@elytro/ui`

### Extension 应用（可选更新）
- [ ] （可选）更新 extension/package.json（添加 @elytro/ui 依赖）
- [ ] （可选）更新 extension 的导入路径使用共享包
- [ ] **注意：extension 保持为 canonical source，其组件代码不变**

### 文档
- [ ] 编写 UI 包 README（说明 extension 是 canonical source）
- [ ] 文档化哪些组件可用
- [ ] 说明 recovery 如何使用共享组件

---

## 📝 注意事项

1. **Extension 是权威来源**：所有 UI 决策以 extension 为准，recovery 仅消费
2. **不要修改 extension**：除非需要新增组件，否则 extension 代码保持不变
3. **Monorepo 工具**：确认使用 pnpm/yarn/npm workspaces
4. **构建配置**：需要配置共享包的构建流程（如 tsup, swc）
5. **样式差异处理**：如 recovery 有特殊样式需求，在 recovery 本地覆盖，不影响共享包
6. **渐进式迁移**：可以先共享部分组件（如 button）再逐步扩展

---

## 💡 额外建议

1. **保持 extension 组件不变**：共享包应直接镜像 extension 的组件，不做"改进"
2. **Recovery 适配**：如果 extension 组件不满足 recovery 需求，有两个选择：
   - 在 extension 中增强组件（推荐，使其成为新的标准）
   - 在 recovery 中创建特有组件（仅当功能完全不同时）
3. **TypeScript**：确保所有组件有完整的 TS 类型定义
4. **CI/CD**：在自动化流程中测试共享包的更新

---

## 🔑 核心原则

> **Extension = Canonical Source**
>
> - Extension 的 UI 组件是标准，不因 recovery 需求而改变
> - Recovery 应适配 extension 的组件，而非反过来
> - 如需新功能，优先在 extension 中实现，再共享给 recovery

---

## 联系&支持

如有问题，请联系设计系统团队。
