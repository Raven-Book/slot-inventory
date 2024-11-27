(() => {
    'use strict';

    const convertToArray = (input) => {
        const array = [];

        for (const [key,value] of Object.entries(input)) {
            array.push(key, value);
        }

        return array;
    }

    class RecipeBook {

        static success = '制作成功';
        static failure = '制作失败';
        static not_found = '配方不存在';
        static not_unlocked = '配方未解锁';
        static missing_materials = '缺少材料';
        static unlocked_success = '配方成功解锁';
        static default_no_recipe = '空配方';
        static crafting_table = 'crafting_table';

        constructor(ct, recipes = new Map(), invs = []) {
            if (!(recipes instanceof Map)) {
                throw new Error('Expected "recipes" to be an instance of Map');
            }

            if (!Array.isArray(invs)) {
                throw new Error('Expected "invs" to be an array');
            }
            this.invs = invs;
            this.ct = ct;

            State.variables[this.ct] = State.variables[this.ct] || new Inventory();

            this.recipes = recipes;
            this._recipes = RecipeBook.sort(recipes);
        }


        has(id) {
            return this.recipes.has(id);
        }

        hasItems(input) {
            const obj = State.variables[this.ct];
            for (const [key, required] of Object.entries(input)) {
                const actualCount = obj.count(key);
                if (actualCount < required) {
                    return false;
                }
            }
            return true;
        }

        drop(input) {
            const obj = State.variables[this.ct];
            const arr = convertToArray(input)
            if (typeof obj.pickup === 'undefined'){
                obj.delete(...arr);
            } else {
                obj.drop(...arr);
            }
        }

        update() {
            this._recipes = RecipeBook.sort(this.recipes);
        }

        hasAllTags() {
            const tags = [].slice.call(arguments).flat(Infinity);
            const result = [];

            for (const recipe of this._recipes) {
               if(recipe.hasAllTags(tags)) {
                   result.push(recipe);
               }
            }
            return result;
        }


        searchIndex(priority) {
            let low = 0;
            let high = this._recipes.length - 1;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                if (this._recipes[mid].priority === priority) {
                    return mid;
                } else if(this._recipes[mid].priority < priority) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            return low;
        }

        insert(id, methods, opts, tags) {
            if (!Array.isArray(methods)) {
                methods = [methods];
            }

            const recipe = this.set(id, methods, opts, tags);
            const index = this.searchIndex(recipe.priority);
            this._recipes.splice(index, 0, recipe);
        }

        set(id, methods, opts, tags) {
            if (!Array.isArray(methods)) {
                methods = [methods];
            }

            const recipe = new Recipe(id, methods, opts, tags);
            this.recipes.set(id, recipe);
            return recipe;
        }

        calculate(input) {
            let [idx, recipe] = this.match(input);

            if (idx === undefined || recipe === undefined) {
                return [RecipeBook.default_no_recipe, 0];
            }

            return [recipe.name, recipe.calculate(input, idx) * recipe.servings];
        }

        cook(input, servings = 1) {
            let [idx, recipe] = this.match(input);
            let result = {
                id: '',
                success: false,
                unlock: false,
                exist: false,
                servings: 0,
                message: RecipeBook.not_found
            };
            
            if(recipe == undefined && idx == undefined) {}
            else if (!recipe.unlock && typeof input === 'string') {
                result.id = recipe.name;
                result.success = false;
                result.unlock = false;
                result.message = RecipeBook.not_unlocked;
            } else if (typeof input === 'string' && idx === undefined) {
                debugger;
                result.id = recipe.name;
                result.servings = 0;
                result.success = false;
                result.message = RecipeBook.missing_materials;
                const required = recipe.multiply(servings);
                for (const ele of required) {
                    if (this.hasItems(ele)) {
                        this.drop(ele);
                        result.success = true;
                        result.servings = servings;
                        result.message = RecipeBook.success;
                        break;
                    }
                }
            }
            else if (idx !== undefined, recipe !== undefined){
                result.id = recipe.id;
                result.success = recipe.cook();
                input.length = 0;
                if (result.success) {
                    result.servings = recipe.calculate(input, idx);
                    if(!recipe.unlock){
                        result.message = RecipeBook.unlocked_success;
                    } else{
                        result.message = RecipeBook.success;
                    }
                    recipe.unlock = true;
                } else {
                    result.servings = 0;
                    result.message = RecipeBook.failure;
                }
            }

            if(recipe) 
                result.servings *= recipe.servings; 

            return result
        }

        cookSave(inv, input, servings = 1) {
            const result = this.cook(input, servings);
            if (result.success) {
                RecipeBook.pickup(inv, result.id, result.servings);
            }
            return result;
        }

        match(input) {
            if(typeof input === 'object' && input !== null) {
                for (const recipe of this._recipes) {
                    if (!(recipe instanceof Recipe)) {
                        throw new Error(`Invalid Recipe: ${recipe}`);
                    }

                    const idx = recipe.validate(input);
                    if (idx !== undefined) {
                        return [idx, recipe];
                    }
                }
            } else if (typeof input === "string") {
                const recipe = this.recipes.get(input);
                if (recipe === undefined) {
                    return [undefined, undefined];
                }
                return [undefined, recipe];
            } else {
                throw new Error(`Invalid argument: ${input}`);
            }
            return [undefined, undefined];
        }

        filter(filters) {
            if (typeof filterObjs === 'undefined') {
                return this.error('The "filter-utils" is required but has not been imported');
            }

            const callback = (obj, ext) => {
                if (ext.tags) {
                    return obj.methods.some(method => {
                        return Object.keys(method).some(key => {
                            return Item.get(key)?.hasAnyTags(ext.tags) ?? false;
                        });
                    });
                }
                return true;
            };

            return filterObjs(this._recipes, filters, callback);
        }


        get crafting_table() {
            return this.ct;
        }

        set crafting_table(value) {
            this.ct = value;
            State.variables[this.ct] = State.variables[this.ct] || new Inventory();
        }

        static sort(recipes) {

            const defaultPriority = 100;

            const recipeArr = Array.from(recipes.values());

            let counts = {};

            recipeArr.forEach(recipe => {
                const priority =  recipe.priority !== undefined ? recipe.priority : defaultPriority;
                counts[priority] = (counts[priority] || 0) + 1;
            });

            const priorities = Object.keys(counts).map(Number).sort((a, b) => a - b);

            let accumulatedCounts = {};
            let cumulativeSum = 0;

            priorities.forEach(priority => {
                accumulatedCounts[priority] = cumulativeSum;
                cumulativeSum += counts[priority];
            });

            let arr = Array(recipeArr.length);

            for(let i = recipeArr.length - 1; i >= 0; i--) {
                const recipe = recipeArr[i];
                const priority =  recipe.priority !== undefined ? recipe.priority : defaultPriority;
                let position = accumulatedCounts[priority];
                arr[position] = recipe;
                accumulatedCounts[priority]++;
            }

            return arr;
        }

     
        static pickup(inv, ...items) {
            if (!(inv instanceof Inventory)) {
                throw new Error('Invalid inventory');
            }
            if(typeof inv.pickup === 'undefined') {
                let result;
                for (let i = 0; i < items.length - 1; i += 2) {
                    const id = items[i];
                    const count = items[i + 1];

                    if (!id || !count) {
                        return result;
                    }
                    result = inv.store(id, count);

                    if (!result.success) {
                        return result;
                    }
                }
            } else {
                return inv.pickup(...items);
            }
        }
    }

    const addAccessors = (cls, properties) => {
        properties.forEach(property => {
            Object.defineProperty(cls.prototype, property, {
                get() {
                    return cls[property];
                },
                set(value) {
                    cls[property] = value;
                }
            }) 
        });
    }

    addAccessors(RecipeBook, [
        'success', 
        'failure', 
        'not_found', 
        'not_unlocked', 
        'missing_materials', 
        'unlocked_success',
        'default_no_recipe'
    ]);

    setup._RecipeBook = RecipeBook;
    window._RecipeBook = window._RecipeBook || RecipeBook;
    
    setup.RecipeBook = setup.RecipeBook || new RecipeBook(RecipeBook.crafting_table);
    window.RecipeBook = window.RecipeBook || setup.RecipeBook;
})();
