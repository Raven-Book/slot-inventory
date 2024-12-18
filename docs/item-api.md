# Item API

## 简介

物品系统只支持通过静态方法与相关SugarCube宏添加新物品。

## 物品分类

物品系统包含四大类（主分类）和对应的子分类：

1. **装备（equipment）** - 排序权重：100
   - 武器（weapon）- 110
   - 护甲（armor）- 120
   - 饰品（accessory）- 130
   - 其他（other）- 140

2. **消耗品（consumable）** - 排序权重：200
   - 药水（potion）- 210
   - 卷轴（scroll）- 220
   - 食物（food）- 230
   - 其他（other）- 240

3. **材料（material）** - 排序权重：300
   - 任务物品（quest）- 310
   - 矿石（ore）- 320
   - 草药（herb）- 330
   - 木材（wood）- 340
   - 兽皮（hide）- 350
   - 骨头（bone）- 360
   - 宝石（gem）- 370
   - 金属（metal）- 380
   - 布料（cloth）- 390
   - 其他（other）- 400

4. **其他（misc）** - 排序权重：900
   - 任务物品（quest）- 910
   - 其他（other）- 920

## API 方法

### 静态方法

#### Item.add(id, options, tags)

添加新物品到系统中。

参数说明：
- `id`: 物品ID（必填，字符串类型）
- `options`: 物品配置选项（对象类型）
  - `url`: 物品图片URL（默认：''）
  - `description`: 物品描述文本（默认：''）
  - `handler`: 使用物品时的回调函数或wiki代码（默认：null）
  - `displayName`: 显示名称，用于替换ID（默认：''）
  - `unique`: 是否唯一，每个库存只能拥有一个（默认：false）
  - `permanent`: 是否永久，获得后无法丢弃或转移（默认：false）
  - `stackable`: 是否可堆叠（默认：false）
  - `durability`: 最大耐久度，0表示无耐久度（默认：0）
  - `cat`: 物品主分类（默认：'misc'）
  - `sub`: 物品子分类（默认：'other'）
  - `order`: 物品排序权重（默认：0）
- `tags`: 物品标签，字符串或字符串数组（可选）

示例：
```javascript
// 添加一个可堆叠的材料
Item.add('iron_ore', {
    displayName: '铁矿石',
    description: '常见的铁矿石，可以用来锻造装备。',
    cat: 'material',
    sub: 'ore',
    stackable: true
});

// 添加一个有耐久度的武器
Item.add('iron_sword', {
    displayName: '铁剑',
    description: '普通的铁剑，比较耐用。',
    cat: 'equipment',
    sub: 'weapon',
    durability: 100
});
```

#### Item.is(thing)

检查对象是否为 Item 实例。

参数说明：
- `thing`: 要检查的对象

返回值：
- 如果对象是 Item 实例则返回 `true`，否则返回 `false`

#### Item.get(id)

根据 ID 获取 Item 实例。

参数说明：
- `id`: 物品ID（字符串类型）

返回值：
- 返回对应的物品实例，如果物品不存在则返回 `undefined`

#### Item.has(id)

检查指定ID的物品是否存在。

参数说明：
- `id`: 物品ID（字符串类型）

返回值：
- 如果物品存在则返回 `true`，否则返回 `false`

#### Item.compare(a, b)

比较两个物品的排序顺序。

参数说明：
- `a`: 第一个物品实例
- `b`: 第二个物品实例

返回值：
- 返回比较结果（数字）：
  - 小于0：a 排在 b 前面
  - 等于0：a 和 b 顺序相等
  - 大于0：a 排在 b 后面

比较规则：
1. 首先比较主分类的排序权重
2. 如果主分类相同，比较子分类的排序权重
3. 如果子分类相同，比较物品的 order 属性
4. 如果 order 相同，按物品名称字母顺序排序

#### Item.filter(callback)

使用回调函数过滤物品列表，返回符合过滤条件的物品数组。

**参数:**
- `callback` (Function): 回调函数,会对全局物品列表中的每个物品调用此函数。当函数返回 `true` 时,对应的物品会被包含在结果中。

**返回值:**
- `Array<Item>`: 包含所有回调函数返回 `true` 的物品的数组。

**示例:**
```javascript
// 获取所有武器类物品
const weapons = Item.filter(item => item.sub === 'weapon');

// 获取所有有耐久度的物品
const durableItems = Item.filter(item => item.durability > 0);

// 获取所有带有特定标签的物品
const magicalItems = Item.filter(item => item.hasTag('magical'));
```

### 其他静态属性

#### Item.DefaultItem
系统默认的物品实例，当访问不存在的物品时返回此实例。属性如下：
- `cat`: 'misc'
- `subcat`: 'other'
- `stackable`: true
- `permanent`: false
- `durability`: 0
- `displayName`: '未知物品'

## 注意事项

1. 物品ID必须是唯一的字符串
2. 物品分类必须使用预定义的分类，否则会抛出错误
3. 物品系统只支持通过`Item.add()`静态方法添加新物品
4. 耐久度为0表示物品没有耐久度限制
5. 标签可以是单个字符串或字符串数组，用于物品的额外分类和筛选
