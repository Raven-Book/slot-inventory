# Slot Inventory 使用指南

- [初始化Slot Inventory](#初始化slot-inventory)
- [Inventory 基本操作](#inventory-基本操作)
  - [存储与移除物品](#存储与移除物品)
  - [使用物品](#使用物品)
  - [物品展示](#物品展示)

## 初始化Slot Inventory

在使用 Inventory 之前，需要先在 [StoryInit](https://www.motoslave.net/sugarcube/2/docs/#special-passage-storyinit) 或含有 init code tag 的片段使用 `<<newinv>>` 初始化 Slot Inventory。

```
/* 创建一个20格64最大堆叠的背包 */
<<newinv $backpack 20 64>>
/* 创建一个40格1000最大堆叠的商店 */
<<newinv $shop 40 1000>>
/* 以此类推 */
...
```

## Inventory 基本操作

### 存储与移除物品

使用 `<<store $变量名 $物品ID $数量 $格子索引 $耐久>>` 即可存储物品，需要注意的是 `<<store>>` 暂不支持一次性添加多个物品。

```
/* 需要注意的即使设置了格子索引，也不会覆盖该格子的物品 */
/* 放一把耐久十的木剑到$backpack */
<<store $backpack '木剑' 1 null 10>>
/* 放20个铁矿石到$backpack */
<<store $backpack '铁矿石' 20>>
/* 放一把石剑到$shop */
<<store $shop '石剑'>>
```

使用 `<<drop $变量名 $格子索引 $数量>>` 可以移除指定格子索引的物品。
```
/* 移除第一格的所有物品 */
<<drop $backpack 1>>
/* 移除第一格物品10个 */
<<drop $backpack 1 10>>
```

使用delete可以删除指定ID的物品，并且无视permanent（不可丢弃、不可转移）标志。
```
/* 删除$backpack中所有的木剑、10个石剑，20个铁矿石 */
<<set _woodSwordCount = $backpack.count('木剑')>>
<<delete $backpack '木剑' _woodSwordCount '石剑' 10 '铁矿石' 20>>
```

### 使用物品

可以通过右键菜单或通过`<<use $变量名 $格子索引/$物品ID>>`使用物品。

```
/* 使用背包第一格的东西 */
<<use $backpack 1>>
/* 使用治疗药水 */
<<use $backpack '治疗药水'>>
```

### 物品展示

简单的物品展示，使用`<<inv/take/give $变量名1 $变量名2>>` 可以展示对应容器内的物品。

```
/* 将$backpack中的所有物品展示出来 */
<<inv $backpack>>
/* box的拾取页面，可以将box中的物品移动到backpack */
<<take $backpack $box>>
/* box的放置页面，可以将backpack中的物品移动到box */
<<give $backpack $box>>
```
