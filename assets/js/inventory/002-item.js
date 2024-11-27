(() => {
    'use strict';
    debugger;
    const defaultOpts = {
        url: '',
        description : '',      // 检查物品时在模态框中显示的描述文本
        handler : null,        // 回调函数或wiki代码
        displayName : '',      // 显示名称(用于替换ID)
        unique : false,        // 每个库存中只能拥有一个
        permanent : false,     // 一旦获得后无法丢弃或转移
        stackable: false,      // 是否可堆叠
        durability: 0,         // 最大耐久度,0表示无耐久度
        cat: 'misc',           // 物品分类
        subcat: 'other',       // 物品子分类
        order: 0,              // 物品排序权重
    };

    const Categories = Object.freeze({
        // 装备
        equipment: {
            name: 'equipment',
            order: 100,
            sub: {
                weapon: 110,     // 武器
                armor: 120,      // 护甲
                accessory: 130,  // 饰品
                other: 140,      // 其他
            }
        },
        // 消耗品
        consumable: {
            name: 'consumable',
            order: 200,
            sub: {
                potion: 210,     // 药水
                scroll: 220,     // 卷轴
                food: 230,       // 食物
                other: 240,      // 其他
            }
        },
        // 材料
        material: {
            name: 'material',
            order: 300,
            sub: {
                quest: 310,      // 任务物品
                ore: 320,        // 矿石
                herb: 330,       // 草药
                wood: 340,       // 木材
                hide: 350,       // 兽皮
                bone: 360,       // 骨头
                gem: 370,        // 宝石
                metal: 380,      // 金属
                cloth: 390,      // 布料
                other: 400,      // 其他
            }
        },
        // 其他
        misc: {
            name: 'misc',
            order: 900,
            sub: {
                quest: 910,      // 任务物品
                other: 920,      // 其他
            }
        }
    });

    const ItemList = new Map();

    class Item {

        static DefaultItem = new Item('Other', {
            cat: 'misc',
            sub: 'other',
            stackable: true,
            permanent: false,
            durability: 0,
            displayName: '未知物品'
        });

        constructor(id = '', opts = clone(defaultOpts), tags = []) {
            if (!id || typeof id !== 'string') {
                throw new Error('invalid item ID');
            }
            if (typeof opts !== 'object') {
                throw new Error('invalid item definition');
            }

            Object.assign(this, Object.assign({}, defaultOpts, opts));

            if (!validateCategory(this.cat, this.sub)) {
                throw new Error('Invalid item category: ' + this.cat);
            }

            this.cat = this.cat.toLowerCase();
            this.sub = this.sub.toLowerCase();

            this.id = id;
            this._tags = tags instanceof Array ? tags : 
                typeof tags === 'string' ? [ tags ] : [];    
        }

        get name() {
            return this.displayName || this.id;
        }

        set name(name) {
            this.displayName = name;
        }

        get tags() {
            return this._tags;
        }

        hasTag(tag) {
            return this._tags.includes(tag);
        }

        hasAllTags() {
            return this._tags.includesAll([].slice.call(arguments).flat(Infinity));
        }

        hasAnyTags() {
            return this._tags.includesAny([].slice.call(arguments).flat(Infinity));
        }

        static is(thing) {
            return thing instanceof Item;
        }

        static add(id, def, tags) {
            const item = new Item(id, def, tags);
            ItemList.set(id, item);
            return item;
        }

        static get(id) {
            return ItemList.get(id);
        }

        static has(id) {
            return ItemList.has(id);
        }

        static get list() {
            return ItemList;
        }

        use() {
            if (typeof this.handler === 'function') {
                this.handler(this);
            } else if (typeof this.handler === 'string') {
                $.wiki(this.handler);
            }

            return this;
        }

        inspect() {
            Dialog.create(this.name, 'simple-inventory item-description')
                    .wiki(this.description)
                    .open();

            return this;
        }

        compare(other) {
            if (!(other instanceof Item)) {
                return 0;
            }

            const catA = Categories[this.cat]?.order || 999;
            const catB = Categories[other.cat]?.order || 999;
            if (catA !== catB) {
                return catA - catB;
            }

            const subA = Categories[this.cat]?.sub[this.subcat] || 999;
            const subB = Categories[other.cat]?.sub[other.subcat] || 999;
            if (subA !== subB) {
                return subA - subB;
            }

            if (this.order !== other.order) {
                return this.order - other.order;
            }

            return (this.displayName || this.id).localeCompare(other.displayName || other.id);
        }

        static compare(a, b) {
            return a.compare(b);
        }
    }

    setup.Item = Item;
    window.Item = window.Item || Item;
})();