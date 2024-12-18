(() => {
    'use strict';

    class ItemCategory {
        static #categories = new Map();
        static #subCategories = new Map();
        static #initialized = false;

        static init() {
            if (this.#initialized) return;

            this.addMain('equipment', '装备', 100);
            this.addSub('equipment', 'weapon', '武器', 110);
            this.addSub('equipment', 'armor', '护甲', 120);
            this.addSub('equipment', 'accessory', '饰品', 130);

            this.addMain('consumable', '消耗品', 200);
            this.addSub('consumable', 'potion', '药水', 210);
            this.addSub('consumable', 'scroll', '卷轴', 220);
            this.addSub('consumable', 'food', '食物', 230);

            this.addMain('material', '材料', 300);
            this.addSub('material', 'quest', '任务材料', 310);
            this.addSub('material', 'ore', '矿石', 320);
            this.addSub('material', 'herb', '草药', 330);
            this.addSub('material', 'wood', '木材', 340);
            this.addSub('material', 'hide', '兽皮', 350);
            this.addSub('material', 'bone', '骨头', 360);
            this.addSub('material', 'gem', '宝石', 370);
            this.addSub('material', 'metal', '金属', 380);
            this.addSub('material', 'cloth', '布料', 390);

            this.addMain('misc', '其他', 900);
            this.addSub('misc', 'quest', '任务物品', 910);

            this.#initialized = true;
        }

        static {
            this.init();
        }

        /**
         * 添加主分类
         * @param {string} id - 分类ID
         * @param {string} name - 分类名称
         * @param {number} order - 排序顺序
         * @returns {boolean} - 是否添加成功
         * @throws {TypeError} - 参数类型错误时抛出
         */
        static addMain(id, name, order) {
            if (typeof id !== 'string' || typeof name !== 'string' || typeof order !== 'number') {
                throw new TypeError('Invalid parameter types for addMain');
            }

            id = id.toLowerCase();
            if (this.#categories.has(id)) {
                console.warn(`主分类 ${id} 已存在`);
                return false;
            }

            this.#categories.set(id, {
                id,
                name,
                order,
                subCategories: new Map()
            });
            
            this.addSub(id, 'other', `其他${name}`, order + 99);
            
            return true;
        }

        /**
         * 添加子分类
         * @param {string} mainId - 主分类ID
         * @param {string} subId - 子分类ID
         * @param {string} name - 子分类名称
         * @param {number} order - 排序顺序
         * @returns {boolean} - 是否添加成功
         * @throws {TypeError} - 参数类型错误时抛出
         */
        static addSub(mainId, subId, name, order) {
            if (typeof mainId !== 'string' || typeof subId !== 'string' || 
                typeof name !== 'string' || typeof order !== 'number') {
                throw new TypeError('Invalid parameter types for addSub');
            }

            mainId = mainId.toLowerCase();
            subId = subId.toLowerCase();
            
            const mainCategory = this.#categories.get(mainId);
            if (!mainCategory) {
                console.warn(`主分类 ${mainId} 不存在`);
                return false;
            }

            const fullId = `${mainId}.${subId}`;
            if (this.#subCategories.has(fullId)) {
                console.warn(`子分类 ${fullId} 已存在`);
                return false;
            }
            
            const subCategory = {
                id: subId,
                fullId,
                name,
                order,
                mainCategory: mainId
            };

            mainCategory.subCategories.set(subId, subCategory);
            this.#subCategories.set(fullId, subCategory);
            return true;
        }

        /**
         * 获取主分类
         * @param {string} id - 分类ID
         * @returns {object|null} - 分类信息
         */
        static getMain(id) {
            if (typeof id !== 'string') return null;
            return this.#categories.get(id.toLowerCase()) || null;
        }

        /**
         * 获取子分类
         * @param {string} mainId - 主分类ID
         * @param {string} subId - 子分类ID
         * @returns {object|null} - 子分类信息
         */
        static getSub(mainId, subId) {
            if (typeof mainId !== 'string' || typeof subId !== 'string') return null;
            return this.#subCategories.get(`${mainId.toLowerCase()}.${subId.toLowerCase()}`) || null;
        }

        /**
         * 根据子分类ID获取主分类
         * @param {string} fullId - 完整的分类ID (mainId.subId)
         * @returns {object|null} - 主分类信息
         */
        static getMainBySubId(fullId) {
            const sub = this.#subCategories.get(fullId.toLowerCase());
            if (!sub) return null;
            return this.getMain(sub.mainCategory);
        }

        /**
         * 获取分类的排序顺序
         * @param {string} fullId - 完整的分类ID (mainId.subId)
         * @returns {number} - 排序顺序，如果不存在返回 Infinity
         */
        static getOrder(fullId) {
            const sub = this.#subCategories.get(fullId.toLowerCase());
            return sub ? sub.order : Infinity;
        }

        /**
         * 获取所有主分类
         * @returns {Map} - 主分类Map
         */
        static getAllMain() {
            return new Map(this.#categories);
        }

        /**
         * 获取指定主分类的所有子分类
         * @param {string} mainId - 主分类ID
         * @returns {Map} - 子分类Map
         */
        static getSubs(mainId) {
            const main = this.getMain(mainId);
            return main ? main.subCategories : new Map();
        }

        /**
         * 检查分类是否存在
         * @param {string} fullId - 完整的分类ID (mainId.subId)
         * @returns {boolean} - 是否存在
         */
        static exists(fullId) {
            return this.#subCategories.has(fullId.toLowerCase());
        }

        /**
         * 验证分类是否有效
         * @param {string} mainId - 主分类ID
         * @param {string|null} subId - 子分类ID，可选
         * @returns {boolean} - 是否有效
         */
        static validate(mainId, subId = null) {
            if (typeof mainId !== 'string') return false;
            
            const main = this.getMain(mainId);
            if (!main) return false;
            
            if (subId === null) return true;
            
            if (typeof subId !== 'string') return false;
            return this.getSub(mainId, subId) !== null;
        }

        /**
         * 获取分类信息
         * @param {string} cat - 分类标识符
         * @returns {[string, string]} - [主分类, 子分类]
         * @throws {Error} - 如果分类无效
         */
        static category(cat) {
            if (typeof cat !== 'string') {
                throw new TypeError('分类必须是字符串类型');
            }

            cat = cat.toLowerCase();

            if (this.getMain(cat)) {
                return [cat, 'other'];
            }

            for (const [mainId, mainCat] of this.#categories) {
                if (mainCat.subCategories.has(cat)) {
                    return [mainId, cat];
                }
            }

            throw new Error(`未知的物品类型: ${cat}`);
        }

        /**
         * 获取所有分类ID列表
         * @returns {string[]} - 分类ID列表
         */
        static getAllCategories() {
            const idCount = new Map();
            
            for (const mainId of this.#categories.keys()) {
                idCount.set(mainId, (idCount.get(mainId) || 0) + 1);
                
                const subs = this.getSubs(mainId);
                for (const subId of subs.keys()) {
                    if (subId !== 'other') {
                        idCount.set(subId, (idCount.get(subId) || 0) + 1);
                    }
                }
            }
            
            const categories = [];
            for (const [id, count] of idCount) {
                if (count === 1) {
                    categories.push(id);
                }
            }
            
            return Object.freeze(categories);
        }
    }

    setup.ItemCategory = ItemCategory;
    window.ItemCategory = window.ItemCategory || ItemCategory;
    
    setup.category = cat => ItemCategory.category(cat);
    setup.validateCategory = (main, sub) => ItemCategory.validate(main, sub);
    setup.AllCategories = ItemCategory.getAllCategories();
    
    window.category = window.category || setup.category;
    window.validateCategory = window.validateCategory || setup.validateCategory;
    window.AllCategories = window.AllCategories || setup.AllCategories;
})();