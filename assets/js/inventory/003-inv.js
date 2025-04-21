(() => {
    'use strict';
    
    class Inventory {
        
        static handlers = {};

        static DefaultOpts = {
            maxSlots: 20,
            maxStack: 64,
        };

        static StatusCode = Object.freeze({
            SUCCESS: 100,
            /// 当前储存空间不足
            SLOT_FULL: 201,
            /// 无效的储存位置
            INVALID_SLOT: 202,
            /// 储存位置已被占用
            SLOT_OCCUPIED: 203,
            /// 无效的物品
            INVALID_ITEM: 204,
            /// 物品是永久的,不能丢弃
            PERMANENT_ITEM: 205,
            /// 无效的数字
            INVALID_NUMBER: 206,
            /// 背包已满
            INVENTORY_FULL: 207,
            // 无效的物品数量
            INVALID_ITEM_COUNT: 208, 
            /// 无效的参数
            INVALID_ARGS: 250,
            /// 未知错误
            UNKNOWN_ERROR: 299,
            /// 操作被取消
            CANCELLED: 208,
        });

        static Messages = {
            [Inventory.StatusCode.SUCCESS]: '储存成功',
            [Inventory.StatusCode.SLOT_FULL]: '当前储存空间不足',
            [Inventory.StatusCode.INVALID_SLOT]: '无效的格子索引',
            [Inventory.StatusCode.SLOT_OCCUPIED]: '储存位置已被占用',
            [Inventory.StatusCode.INVALID_ITEM]: '无效的物品',
            [Inventory.StatusCode.PERMANENT_ITEM]: '该物品无法丢弃',
            [Inventory.StatusCode.INVALID_NUMBER]: '无效的数字',
            [Inventory.StatusCode.INVENTORY_FULL]: '背包已满',
            [Inventory.StatusCode.INVALID_ITEM_COUNT]: '无效的物品数量',
            [Inventory.StatusCode.INVALID_ARGS]: '无效的参数',
            [Inventory.StatusCode.UNKNOWN_ERROR]: '未知错误',
            [Inventory.StatusCode.CANCELLED]: '操作被取消',
        };

        constructor(slots = [], items = {}, opts = clone(Inventory.DefaultOpts), tags =[]) {
            /// Slots
            /*
                [
                    {
                        id: 'item_id',
                        count: 0,
                        durability: null,
                    },
                    ...
                ]
            */
            this.slots = Array.isArray(slots) && slots.length > 0 
                ? clone(slots)
                : new Array(opts.maxSlots).fill(null);
            /// Items
            /*
                {
                    item_id: {
                        // 物品储存的格子索引
                        idx: [],
                        // 格子对应的物品数量
                        num: []
                    },
                    ...
                }
            */
            this.items = clone(items);
            this.opts = opts;
            this._tags = tags instanceof Array ? tags : 
                typeof tags === 'string' ? tags.split(' ') : [];

            this.#init();
        }

        #init() {
            Object.keys(this.opts).forEach(key => {
                Object.defineProperty(this, key, {
                    get() {
                        return this.opts[key];
                    },
                    set(value) {
                        this.opts[key] = value;
                    }
                });
            });
        }

        #buildMsg(slot, item, code) {
            return {
                slot: slot,
                item: item,
                success: code === Inventory.StatusCode.SUCCESS,
                code: code,
                message: Inventory.Messages[code],
            };
        }

        #delete(id, count = -1) {
            const itemInfo = this.items[id];
            if (!itemInfo) {
                return this.#buildMsg(null, id, Inventory.StatusCode.INVALID_ITEM);
            }

            const totalCount = itemInfo.num.reduce((a, b) => a + b, 0);
            const deleteCount = count === -1 ? totalCount : Math.min(count, totalCount);
            let remainingToDelete = deleteCount;

            for (let i = itemInfo.idx.length - 1; i >= 0 && remainingToDelete > 0; i--) {
                const slotIdx = itemInfo.idx[i];
                const slot = this.slots[slotIdx];
                const slotDeleteCount = Math.min(remainingToDelete, slot.count);

                if (slotDeleteCount >= slot.count) {
                    itemInfo.idx.splice(i, 1);
                    itemInfo.num.splice(i, 1);
                    this.slots[slotIdx] = null;
                } else {
                    slot.count -= slotDeleteCount;
                    itemInfo.num[i] = slot.count;
                }

                remainingToDelete -= slotDeleteCount;
            }

            if (itemInfo.idx.length === 0) {
                delete this.items[id];
            }

            return this.#buildMsg(null, id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 添加物品到指定格子
         * @param {string} id - 物品ID
         * @param {number} count - 要添加的数量
         * @param {number} idx - 格子索引
         * @param {number|null} durability - 物品耐久度
         * @returns {number} 剩余未存储的数量
         */
        #addToSlot(id, count, idx, durability) {
            if (count < 1) return count;
            
            const slot = this.slots[idx];
            const item = Item.get(id);
            
            if (!slot) {
                return this.#createNewStack(id, count, idx, item, durability);
            }
            
            // 如果格子已有相同物品且可堆叠，尝试合并
            if (slot.id === id && this.canStack(item)) {
                return this.#mergeWithExistingStack(id, count, idx, slot);
            }
            
            return count;
        }

        /**
         * 创建新的物品堆
         * @private
         */
        #createNewStack(id, count, idx, item, durability) {
            // 处理有耐久度或不可堆叠的物品
            if (item?.durability > 0 || (item != null && !item?.stackable)) {
                this.slots[idx] = {
                    id: id,
                    count: 1,
                    durability: item?.durability > 0
                        ? (durability ?? item.durability)
                        : null
                };
                this.#updateItemsIndex(id, idx, 1);
                return count - 1;
            }

            const insertCount = Math.min(count, this.maxStack);
            this.slots[idx] = {
                id: id,
                count: insertCount,
                durability: null
            };
            this.#updateItemsIndex(id, idx, insertCount);
            return count - insertCount;
        }

        /**
         * 合并到已存在的物品堆
         * @private
         */
        #mergeWithExistingStack(id, count, idx, slot) {
            const available = this.maxStack - slot.count;
            const insertCount = Math.min(count, available);
            slot.count += insertCount;

            const info = this.items[id];
            const slotIdxPos = info.idx.indexOf(idx);
            info.num[slotIdxPos] += insertCount;

            return count - insertCount;
        }

        /**
         * 更新物品索引
         * @private
         */
        #updateItemsIndex(id, idx, count) {
            if (!this.items[id]) {
                this.items[id] = {idx: [idx], num: [count]};
            } else {
                const info = this.items[id];
                info.idx.push(idx);
                info.num.push(count);
            }
        }

        /**
         * 储存物品到背包
         * @param {string} id - 物品ID
         * @param {number} count - 要储存的数量，默认为1
         * @param {number|null} idx - 指定储存的格子索引，为null时自动寻找合适位置
         * @param {number|null} durability - 物品耐久度，为null时使用默认值
         */
        store(id, count = 1, idx = null, durability = null, popup = true) {
            debugger;
            const itemInfo = this.items[id];

            if (count <= 0) {
                return this.#buildMsg(idx, id, Inventory.StatusCode.INVALID_ITEM_COUNT);
            }

            if (idx !== null) {
                if (idx >= this.maxSlots || (this.slots[idx] && this.slots[idx].id !== id)) {
                    return this.#buildMsg(idx, id, Inventory.StatusCode.INVALID_SLOT);
                }
                const remainingCount = this.#addToSlot(id, count, idx, durability);
                
                if (remainingCount === 0) {
                    return this.#buildMsg(idx, id, Inventory.StatusCode.SUCCESS);
                } 

                count = remainingCount;
            }

            if (itemInfo) {
                for (let i = 0; i < itemInfo.idx.length; i++) {
                    const slotIdx = itemInfo.idx[i];
                    const remainingCount = this.#addToSlot(id, count, slotIdx, durability); 
                    
                    if (remainingCount === 0) {
                        return this.#buildMsg(idx, id, Inventory.StatusCode.SUCCESS);
                    }   

                    count = remainingCount;
                }
            }

            while(count > 0) {
                const emptySlot = this.emptySlot;
                if (emptySlot === -1) {
                    const handler = Inventory.handlers[':inventory_full'];
                    if (State.length <= 0 && popup) {
                        Popup.warn('背包已满', `${id}(x${count})被丢弃`);
                    }
                    if (handler) {
                        handler(id, count);
                    }
                    const result = this.#buildMsg(null, id, Inventory.StatusCode.SLOT_FULL);
                    result.drop = count;
                    return result;
                }

                const remainingCount = this.#addToSlot(id, count, emptySlot, durability);

                if (remainingCount === 0) {
                    return this.#buildMsg(emptySlot, id, Inventory.StatusCode.SUCCESS);
                }
                count = remainingCount;
            }
            return this.#buildMsg(emptySlot, id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 遍历背包中的所有物品
         * @param {function} callback - 回调函数
         */
        iterate(callback) {
            if (typeof callback !== 'function') {
                return;
            }

            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                callback(i, slot, slot ? this.items[slot.id] : null);
            }
        }

        /**
         * 从指定格子中删除指定数量的物品
         * @param {number} idx - 格子索引
         * @param {number} count - 删除数量,默认为1
         * @returns {Object} 删除结果
         */
        drop(idx, count = 1) {
            if (idx >= this.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const slot = this.slots[idx];
            if (!slot) {
                return this.#buildMsg(idx, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const item = Item.get(slot.id);
            if (item?.permanent) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.PERMANENT_ITEM);
            }

            const dropCount = count === -1 ? slot.count : Math.min(count, slot.count);
            
            const itemInfo = this.items[slot.id];
            const slotIdx = itemInfo.idx.indexOf(idx);

            if (dropCount >= slot.count) {
                itemInfo.idx.splice(slotIdx, 1);
                itemInfo.num.splice(slotIdx, 1);
                this.slots[idx] = null;

                if (itemInfo.idx.length === 0) {
                    delete this.items[slot.id];
                }
            } else {
                slot.count -= dropCount;
                itemInfo.num[slotIdx] = slot.count;
            }

            return this.#buildMsg(idx, slot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 将物品从一个背包转移到另一个背包
         * @param {Inventory} toInv - 目标背包
         * @param {number} fromIdx - 源格子索引
         * @param {number} toIdx - 目标格子索引
         * @returns {object} 转移结果
         */
        transfer(toInv, fromIdx, toIdx = null) {
            debugger;
            if (fromIdx >= this.maxSlots || toIdx >= toInv.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const fromSlot = this.slots[fromIdx];
            if (!fromSlot) {
                return this.#buildMsg(fromIdx, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const {id, count, durability} = fromSlot;
            
            let result;
            if (!Item.get(id)?.permanent) {
                result = toInv.store(id, count, toIdx, durability, false);
            } else {
                result = this.#buildMsg(fromIdx, id, Inventory.StatusCode.PERMANENT_ITEM);
            }

            if(result.code === Inventory.StatusCode.SUCCESS) {
                this.drop(fromIdx, count);
            } else if(result.code === Inventory.StatusCode.INVENTORY_FULL) {
                this.drop(fromIdx, count - result.drop);
            }
            return result;
        }

        /**
         * 将物品从一个格子转移到另一个格子
         * @param {number} fromIdx - 源格子索引
         * @param {number} toIdx - 目标格子索引
         * @param {number} count - 转移数量,默认为全部
         * @returns {Object} 转移结果
         */
        move(fromIdx, toIdx, count = null) {
            if (fromIdx >= this.maxSlots || toIdx >= this.maxSlots) {
                return this.#buildMsg(toIdx, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const fromSlot = this.slots[fromIdx];
            const toSlot = this.slots[toIdx];

            if (!fromSlot) {
                return this.#buildMsg(toIdx, null, Inventory.StatusCode.EMPTY_SLOT);
            }

            count = count === null ? fromSlot.count : Math.min(count, fromSlot.count);


            if (!toSlot) {
                this.slots[toIdx] = {
                    id: fromSlot.id,
                    count: count,
                    durability: fromSlot.durability
                };

                if (count === fromSlot.count) {
                    this.slots[fromIdx] = null;

                    const itemInfo = this.items[fromSlot.id];
                    const idxPos = itemInfo.idx.indexOf(fromIdx);
                    itemInfo.idx[idxPos] = toIdx;
                } else {
                    fromSlot.count -= count;

                    const itemInfo = this.items[fromSlot.id];
                    itemInfo.idx.push(toIdx);
                    itemInfo.num.push(count);
                    const fromIdxPos = itemInfo.idx.indexOf(fromIdx);
                    itemInfo.num[fromIdxPos] = fromSlot.count;
                }

                return this.#buildMsg(toIdx, fromSlot.id, Inventory.StatusCode.SUCCESS);
            }


            const item = Item.get(fromSlot.id);
            if (fromSlot.id === toSlot.id && (item?.stackable || !item)) {
                const maxCanAdd = this.maxStack - toSlot.count;
                const moveCount = Math.min(count, maxCanAdd);
                
                if (moveCount > 0) {
                    toSlot.count += moveCount;
                    fromSlot.count -= moveCount;

                    const itemInfo = this.items[fromSlot.id];
                    const fromIdxPos = itemInfo.idx.indexOf(fromIdx);
                    const toIdxPos = itemInfo.idx.indexOf(toIdx);
                    itemInfo.num[toIdxPos] = toSlot.count;
                    itemInfo.num[fromIdxPos] = fromSlot.count;

                    if (fromSlot.count === 0) {
                        this.slots[fromIdx] = null;
                        itemInfo.idx.splice(fromIdxPos, 1);
                        itemInfo.num.splice(fromIdxPos, 1);
                    }
                }
            } else {
                
                const fromItemInfo = this.items[fromSlot.id];
                const toItemInfo = this.items[toSlot.id];
                const fromIdxPos = fromItemInfo.idx.indexOf(fromIdx);
                const toIdxPos = toItemInfo.idx.indexOf(toIdx);

                fromItemInfo.idx[fromIdxPos] = toIdx;
                fromItemInfo.num[fromIdxPos] = toSlot.count;

                toItemInfo.idx[toIdxPos] = fromIdx;
                toItemInfo.num[toIdxPos] = fromSlot.count;

                this.slots[fromIdx] = toSlot;
                this.slots[toIdx] = fromSlot; 

            }
            return this.#buildMsg(toIdx, fromSlot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 对背包格子进行排序，跳过锁定的格子
         * @param {number[]} lockedSlots - 被锁定的格子索引数组
         * @param {boolean} merge - 是否需要合并同类物品
         * @returns {boolean} 排序是否成功
         */
        sort(lockedSlots = [], merge = false) {

            const nonEmptySlots = this.slots
                .map((slot, idx) => ({slot, idx}))
                .filter(({slot, idx}) => slot && !lockedSlots.includes(idx));
            

            const lockedSlotsInfo = this.slots
                .map((slot, idx) => ({slot, idx}))
                .filter(({slot, idx}) => slot && lockedSlots.includes(idx));
            

            if (merge) {

                const groups = {};
                for (const {slot} of nonEmptySlots) {
                    const item = Item.get(slot.id);
                    if (item?.stackable || !item) {
                        if (!groups[slot.id]) {
                            groups[slot.id] = [];
                        }
                        groups[slot.id].push(slot);
                    }
                }
                

                const mergedSlots = [];
                for (const id in groups) {
                    let totalCount = groups[id].reduce((sum, slot) => sum + slot.count, 0);
                    const durability = groups[id][0].durability;
                    

                    while (totalCount > 0) {
                        const count = Math.min(totalCount, this.maxStack);
                        mergedSlots.push({
                            slot: {
                                id: id,
                                count: count,
                                durability: durability
                            },
                            idx: -1
                        });
                        totalCount -= count;
                    }
                }
                

                nonEmptySlots.forEach(({slot}) => {
                    const item = Item.get(slot.id);
                    if (!item?.stackable && item) {
                        mergedSlots.push({slot, idx: -1});
                    }
                });
                
                nonEmptySlots.length = 0;
                nonEmptySlots.push(...mergedSlots);
            }
            

            nonEmptySlots.sort((a, b) => {
                let itemA = Item.get(a.slot.id);
                let itemB = Item.get(b.slot.id);
                if (!itemA) {
                    itemA = clone(Item.DefaultItem);
                    itemA.name = a.slot.id;
                }
                if (!itemB) {
                    itemB = clone(Item.DefaultItem);
                    itemB.name = b.slot.id;
                }
                return itemA.compare?.(itemB) || 0;
            });


            const newSlots = new Array(this.maxSlots).fill(null);
            const newItems = {};

            lockedSlotsInfo.forEach(({slot, idx}) => {
                newSlots[idx] = slot;
                const id = slot.id;
                if(!newItems[id]) {
                    newItems[id] = {
                        idx: [idx],
                        num: [slot.count]
                    };
                } else {
                    newItems[id].idx.push(idx);
                    newItems[id].num.push(slot.count);
                }
            });

            let currentIdx = 0;
            nonEmptySlots.forEach(({slot}) => {

                while(lockedSlots.includes(currentIdx)) {
                    currentIdx++;
                }

                newSlots[currentIdx] = slot;
                

                const id = slot.id;
                if(!newItems[id]) {
                    newItems[id] = {
                        idx: [currentIdx],
                        num: [slot.count]
                    };
                } else {
                    newItems[id].idx.push(currentIdx);
                    newItems[id].num.push(slot.count);
                }

                currentIdx++;
            });

            this.slots = newSlots;
            this.items = newItems;
            return true;
        }


       
        /**
         * 从指定格子中拆分出指定数量的物品到新格子
         * @param {number} idx - 格子索引
         * @param {number} count - 分离数量
         * @returns {Object} 分离结果
         */
        split(idx, count) {

            if (idx >= this.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const slot = this.slots[idx];
            if (!slot) {
                return this.#buildMsg(idx, null, Inventory.StatusCode.INVALID_SLOT);
            }


            if (count >= slot.count) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.INVALID_NUMBER);
            }


            const emptyIdx = this.emptySlot;
            if (emptyIdx === -1) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.INVENTORY_FULL);
            }


            const newSlot = {
                id: slot.id,
                count: count
            };
            if (slot.durability) {
                newSlot.durability = slot.durability;
            }


            slot.count -= count;

            const itemInfo = this.items[slot.id];
            const idxPos = itemInfo.idx.findIndex(pos => pos === idx);
            itemInfo.num[idxPos] -= count;
            itemInfo.idx.push(emptyIdx);
            itemInfo.num.push(count);


            this.slots[emptyIdx] = newSlot;

            return this.#buildMsg(idx, slot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 从背包中删除指定数量的指定物品
         * @param {Array} 物品数组，例如['南瓜', 1, '西瓜', 2]
         * @returns {Object} 删除结果
         */
        delete(...items) {
            items = items.flat(Infinity);
            debugger;
            if (items.length === 0) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_ARGS);
            }

            if (items.length % 2 !== 0) {
                items.push(1);
            }

            for (let i = 0; i < items.length; i += 2) {
                const id = items[i];
                const count = items[i + 1];

                if (typeof id !== 'string' || typeof count !== 'number' || count <= 0) {
                    return this.#buildMsg(null, id, Inventory.StatusCode.INVALID_ARGS);
                }

                const result = this.#delete(id, count);
                if (!result.success) {
                    return result;
                }
            }

            return this.#buildMsg(null, null, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 使用指定格子中的物品
         * @param {number} idx - 格子索引
         * @returns {Object} 使用结果
         */
        use(idx) {
            debugger;
            if (idx >= this.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }
        
            const slot = this.slots[idx];
            if (!slot) {
                return this.#buildMsg(idx, null, Inventory.StatusCode.INVALID_SLOT);
            }
        
            const item = Item.get(slot.id);
            if (!item) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.INVALID_ITEM);
            }

            const detail = {
                item: item,
                slot: slot,
                index: idx,
                inv: this,
                cancel: false  // 添加 cancel 标志
            };
            
            triggerEvent(':item_pre_use', document, {detail});
            if (detail.cancel) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.CANCELLED);
            }

            item.use();
            if (item.durability >= 1) {
                slot.durability--;
                if (slot.durability <= 0) {
                    return this.drop(idx, 1);
                }
            } else if (item.cat === ItemCategory.CONSUMABLE) {
                return this.drop(idx, 1);
            }
            triggerEvent(':item_post_use', document, {detail});

            return this.#buildMsg(idx, slot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 根据物品ID获取格子索引
         * @param {string} id - 物品ID
         * @returns {number} 格子索引
         */
        indexOf(id) {
            return this.items[id]?.idx[0] ?? -1;
        }

        /**
         * 为指定格子中的物品添加耐久
         * @param {number} idx - 格子索引
         * @param {number} amount - 添加耐久数量
         * @returns {Object} 添加结果
         */
        addDur(idx, amount) {
            if (idx >= this.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const slot = this.slots[idx];
            if (!slot) {
                return this.#buildMsg(idx, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const item = Item.get(slot.id);
            if (!item || item.durability <= 0) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.INVALID_ITEM);
            }

            slot.durability = Math.min(item.durability, slot.durability + amount);
            return this.#buildMsg(idx, slot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 为指定格子中的物品减少耐久
         * @param {number} idx - 格子索引
         * @param {number} amount - 减少耐久数量
         * @returns {Object} 减少结果
         */
        subDur(idx, amount) {
            if (idx >= this.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const slot = this.slots[idx];
            if (!slot) {
                return this.#buildMsg(idx, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const item = Item.get(slot.id);
            if (!item || item.durability <= 0) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.INVALID_ITEM);
            }

            slot.durability = Math.max(0, slot.durability - amount);
            return this.#buildMsg(idx, slot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 设置指定格子中的物品耐久
         * @param {number} idx - 格子索引
         * @param {number} amount - 设置耐久数量
         * @returns {Object} 设置结果
         */
        setDur(idx, amount) {
            if (idx >= this.maxSlots) {
                return this.#buildMsg(null, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const slot = this.slots[idx];
            if (!slot) {
                return this.#buildMsg(idx, null, Inventory.StatusCode.INVALID_SLOT);
            }

            const item = Item.get(slot.id);
            if (!item || item.durability <= 0) {
                return this.#buildMsg(idx, slot.id, Inventory.StatusCode.INVALID_ITEM);
            }

            slot.durability = Math.min(item.durability, Math.max(0, amount));
            return this.#buildMsg(idx, slot.id, Inventory.StatusCode.SUCCESS);
        }

        /**
         * 获取指定物品在背包中的总数量
         * @param {string} id - 物品ID
         * @returns {number} 物品总数量
         */
        count(id) {
            const itemInfo = this.items[id];

            if (!itemInfo) {
                return 0;
            }

            return itemInfo.num.reduce((sum, num) => sum + num, 0);
        }

        /**
         * 判断物品是否可堆叠
         * @param {Object} item - 物品对象
         * @returns {boolean} 是否可堆叠
         */
        canStack(item) {
            return (item?.stackable || !item) && !(item?.durability > 0);
        }


        /**
         * 判断背包是否已满
         * @returns {boolean} 背包是否已满
         */
        get isFull() {
            return this.emptySlot === -1;
        }

        get emptySlot() {
            return this.slots.findIndex(slot => !slot);
        }

        clone() {
            return new Inventory(this.slots, this.items, this.opts, this._tags);
        }

        toJSON() {
            return Serial.createReviver(String.format(
                'new {0}({1},{2},{3},{4})',
                'Inventory',
                JSON.stringify(this.slots),
                JSON.stringify(this.items),
                JSON.stringify(this.opts),
                JSON.stringify(this._tags),
            ));
        }
    }

    setup.Inventory = Inventory;
    window.Inventory = window.Inventory || Inventory;
})();