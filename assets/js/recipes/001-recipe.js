(() => {
    'use strict';

    const Conditions = Object.freeze({
        INCLUDES: 'includes',
        EQUALS: 'equals'
    });

    State.variables.recipe_save_data = State.variables.recipe_save_data || new Map();

    const save_data = () => {
        return State.variables.recipe_save_data;
    }

    const defaultOpts = {
        servings: 1,
        successRate: 100,
        priority: 100,
        condition: Conditions.INCLUDES,
        _unlock: false,
    };

    const defaultSaveData = {
        unlock: false
    };

    setup.Conditions = Conditions;
    window.Conditions = window.Conditions || Conditions;

    class Recipe {
        constructor(id, methods = [], opts = clone(defaultOpts), tags = []) {
            this.id = id;

            if (typeof methods !== 'object' || typeof opts !== 'object') {
                throw new Error('Invalid recipe definition');
            }
            
            this.methods = methods;

            Object.assign(this, Object.assign({}, defaultOpts, opts));
            
            if(!save_data().has(id)) {
                const data = clone(defaultSaveData);
                data.unlock = opts._unlock;
                save_data().set(id, data);
            }

            this._tags = tags instanceof Array ? tags :
                typeof tags === 'string' ? [tags] : [];
        }


        get unlock() {
            return save_data().get(this.id).unlock;
        }

        set unlock(value) {
            save_data().get(this.id).unlock = value;
        }

        get name() {
            return this.displayName || this.id;
        }

        set name(val) {
            this.displayName = val
        }


        get tags() {
            return this._tags;
        }

        hasTag(tag) {
            return this._tags.includes(tag);
        }

        hasAllTags(tags) {
            return this._tags.includesAll(tags);
        }

        hasAnyTags(tags) {
            return this._tags.includesAny(tags);
        }

        validate(ingredients) {
            switch (this.condition) {
                case Conditions.EQUALS:
                    return this.equals(ingredients);
                case Conditions.INCLUDES:
                    return this.includes(ingredients);
                default:
                    throw new TypeError(`Invalid condition type: ${this.condition}`);
            }
        }


        calculate(input, index) {
            if(this.methods.length <= index) {
                throw new Error(`Unable to access recipe at index ${index}, total number of available crafting methods is ${this.ingredients.length}`)
            }

            return Object.entries(this.methods[index]).reduce((min, [ingredient, require]) => {
                const available = input[ingredient];
                return Math.min(min, Math.floor(available / require));
            }, Infinity);
        }


        multiply(servings, index) {
            if(index !== undefined && this.methods.length <= index ) {
                throw new Error(`Unable to access recipe at index ${index}, total number of available crafting methods is ${this.ingredients.length}`)
            }

            if (typeof servings !== 'number' || servings <= 0) {
                throw new Error('Invalid number of servings');
            }

            const required = [];
            const processList = index !== undefined ? [this.methods[index]] : this.methods;

            for (const method of processList) {
                const obj = {};
                for (const [ingredient, number] of Object.entries(method)) {
                    obj[ingredient] = number * servings;
                }
                required.push(obj);
            }

            return required;
        }

        includes(ingredients) {
            for (const method of this.methods) {
                if (Object.keys(ingredients).length < Object.keys(method).length) {
                    return undefined;
                }
            }
            
            
            for (const [index, method] of this.methods.entries()) {
                let match = true;
                for (const ingredient in method) {
                    if (!ingredients[ingredient] || ingredients[ingredient] < method[ingredient]) {
                        match = false;
                        break;
                    }
                }

                if(match) {
                    return index;
                }
            }
            return undefined;
        }

        cook() {
            if (this.successRate === 100) {
                return true;
            }

            const number = randomInt(1, 100);
            if (this.successRate >= number) {
                return true;
            }
            return false;
        }

        equals(ingredients) {
            for (const method of this.methods) {
                if (Object.keys(ingredients).length < Object.keys(method).length) {
                    return undefined;
                }
            }

            for (const [index, method] of this.methods.entries()) {
                let match = true;
                for (const ingredient in method) {
                    if (!ingredients[ingredient] || ingredients[ingredient] !== this.ingredients[ingredient]) {
                        match = false;
                        break
                    }
                }

                if(match) {
                    return index;
                }
            }
            return undefined;
        }

    }

    setup.Recipe = Recipe;
    window.Recipe = window.Recipe || Recipe;
})();