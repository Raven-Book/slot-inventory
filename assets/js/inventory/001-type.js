(() => {
    'use strict';


    const AllCategories = Object.freeze([
        'consumable', 
        'material', 
        'equipment', 
        'misc', 
        'weapon', 
        'armor', 
        'accessory', 
        'potion', 
        'scroll', 
        'food', 
        'quest', 
        'ore', 
        'herb',
        'wood', 
        'hide', 
        'bone', 
        'gem', 
        'metal', 
        'cloth'
    ]);

    function category(cat) {
        if (typeof cat !== 'string') {
            throw new TypeError('Category must be a string');
        }
        
        const subLower = cat.toLowerCase();
        
        if(['weapon', 'armor', 'accessory'].includes(subLower)) {
            return ['equipment', subLower];
        }
        
        if(['potion', 'scroll', 'food'].includes(subLower)) {
            return ['consumable', subLower];
        }
        
        if(['ore', 'herb', 'wood', 'hide', 'bone', 'gem', 'metal', 'cloth', 'quest'].includes(subLower)) {
            return ['material', subLower];
        }
        
        if(['equipment', 'consumable', 'material', 'misc'].includes(subLower)) {
            return [subLower, 'other'];
        }

        throw new Error(`Unknown item type: ${subcategory}`);
    }

    const ItemCategory = Object.freeze({
        EQUIPMENT: 'equipment',
        CONSUMABLE: 'consumable',
        MATERIAL: 'material',
        MISC: 'misc'
    });
    
    const ItemSubCategory = Object.freeze({
        // 装备子类
        WEAPON: 'weapon',
        ARMOR: 'armor',
        ACCESSORY: 'accessory',
        
        // 消耗品子类
        POTION: 'potion',
        SCROLL: 'scroll',
        FOOD: 'food',
        
        // 材料子类
        QUEST: 'quest',
        ORE: 'ore',
        HERB: 'herb',
        WOOD: 'wood',
        HIDE: 'hide',
        BONE: 'bone',
        GEM: 'gem',
        METAL: 'metal',
        CLOTH: 'cloth',
        
        // 通用子类
        OTHER: 'other'
    });
    
    const CategorySubcategoryMap = Object.freeze({
        [ItemCategory.EQUIPMENT]: [
            ItemSubCategory.WEAPON,
            ItemSubCategory.ARMOR,
            ItemSubCategory.ACCESSORY,
            ItemSubCategory.OTHER
        ],
        [ItemCategory.CONSUMABLE]: [
            ItemSubCategory.POTION,
            ItemSubCategory.SCROLL,
            ItemSubCategory.FOOD,
            ItemSubCategory.OTHER
        ],
        [ItemCategory.MATERIAL]: [
            ItemSubCategory.QUEST,
            ItemSubCategory.ORE,
            ItemSubCategory.HERB,
            ItemSubCategory.WOOD,
            ItemSubCategory.HIDE,
            ItemSubCategory.BONE,
            ItemSubCategory.GEM,
            ItemSubCategory.METAL,
            ItemSubCategory.CLOTH,
            ItemSubCategory.OTHER
        ],
        [ItemCategory.MISC]: [
            ItemSubCategory.QUEST,
            ItemSubCategory.OTHER
        ]
    });

    function validateCategory(cat, sub = null) {
        if (typeof cat !== 'string') {
            return false;
        }
        
        const category = cat.toUpperCase();
        if (!ItemCategory[category]) {
            return false;
        }

        if (sub === null) {
            return true;
        }

        if (typeof sub !== 'string') {
            return false;
        }

        return CategorySubcategoryMap[ItemCategory[category]].includes(sub);
    }

    setup.category = category;
    setup.ItemCategory = ItemCategory;
    setup.ItemSubCategory = ItemSubCategory;
    setup.CategorySubcategoryMap = CategorySubcategoryMap;
    setup.validateCategory = validateCategory;
    setup.AllCategories = AllCategories;

    window.category = window.category || category;
    window.ItemCategory = window.ItemCategory || ItemCategory;
    window.ItemSubCategory = window.ItemSubCategory || ItemSubCategory;
    window.CategorySubcategoryMap = window.CategorySubcategoryMap || CategorySubcategoryMap;
    window.validateCategory = window.validateCategory || validateCategory;
    window.AllCategories = window.AllCategories || AllCategories;
})();