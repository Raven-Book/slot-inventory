(() => {
    'use strict';

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
        sub: 'other',         // 物品子分类
        order: 0,             // 物品排序权重
    };

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

            // 验证并规范化分类
            this.cat = this.cat.toLowerCase();
            this.sub = this.sub.toLowerCase();
            
            if (!ItemCategory.validate(this.cat, this.sub)) {
                throw new Error(`Invalid item category: ${this.cat}.${this.sub}`);
            }

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

        static filter(callback) {
            return Array.from(ItemList.values()).filter(callback);
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

            // 获取分类排序顺序
            const catOrderA = ItemCategory.getOrder(`${this.cat}.${this.sub}`);
            const catOrderB = ItemCategory.getOrder(`${other.cat}.${other.sub}`);

            if (catOrderA !== catOrderB) {
                return catOrderA - catOrderB;
            }

            // 如果分类顺序相同，使用物品自身的order
            if (this.order !== other.order) {
                return this.order - other.order;
            }

            // 最后按名称排序
            return (this.displayName || this.id).localeCompare(other.displayName || other.id);
        }

        static compare(a, b) {
            return a.compare(b);
        }
    }

    setup.Item = Item;
    window.Item = window.Item || Item;
})();