# Popup API

## 简介

这是一个轻量级的弹窗提示组件，支持多种提示类型、暗色模式。

## 基本用法

```javascript
// 信息提示
Popup.info('标题', '内容', 3000);

// 成功提示
Popup.success('操作成功', '数据已保存', 3000);

// 警告提示
Popup.warn('注意', '请确认操作', 3000);

// 错误提示
Popup.error('错误', '操作失败', 3000);

// 调试信息
Popup.debug('调试', '测试信息', 3000);
```

## API 方法

所有方法都返回 Popup 实例，支持链式调用。

### Popup.info(title, content, duration)
- `title`: 标题文本（必填）
- `content`: 内容文本（可选，默认为空）
- `duration`: 显示时长，单位毫秒（可选，默认3000ms）

### Popup.success(title, content, duration)
- `title`: 标题文本（必填）
- `content`: 内容文本（可选，默认为空）
- `duration`: 显示时长，单位毫秒（可选，默认3000ms）

### Popup.warn(title, content, duration)
- `title`: 标题文本（必填）
- `content`: 内容文本（可选，默认为空）
- `duration`: 显示时长，单位毫秒（可选，默认3000ms）

### Popup.error(title, content, duration)
- `title`: 标题文本（必填）
- `content`: 内容文本（可选，默认为空）
- `duration`: 显示时长，单位毫秒（可选，默认3000ms）

### Popup.debug(title, content, duration)
- `title`: 标题文本（必填）
- `content`: 内容文本（可选，默认为空）
- `duration`: 显示时长，单位毫秒（可选，默认3000ms）

## 功能说明

1. **队列显示**
   - 多个弹窗会自动排队显示
   - 按照调用顺序依次展示

2. **暗色模式**
   - 通过设置 `Popup.darkMode = true/false` 切换暗色模式
   - 默认启用暗色模式
   - 暗色模式仅存在灰色与红色

3. **进度条显示**
   - 自动显示剩余时间进度条
   - 鼠标悬停时暂停倒计时