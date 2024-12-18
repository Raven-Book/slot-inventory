(()=>{
    Macro.add('cook', {
        tags: null,
        handler () {
            if (this.args.length < 1) {
                return this.error('Not enough arguments provided. At least two arguments are required');
            }
            
            const items = this.args[0];
            
            if (!(typeof items === 'object' || typeof items === 'string') || items === null) {
                return this.error('Expected an object or a string, but received: ' + typeof items);
            }
            
            let result;

            if(this.args.length >= 2) {
                const inv = this.args[1];
                if (!inv || !(inv instanceof Inventory)) {
                    return this.error('Expected an instance of Inventory, but received: ' + typeof inv);
                }
                result = RecipeBook.cookSave(inv, items, parseInt(this.args[2]) || 1);
            } else {
                result = RecipeBook.cook(items);
            }
            WikiVars({result: result}, this);
        }
    });

    Macro.add('filter_recipe', {
        tags: null,
        handler() {
            if (this.args.length < 1) {
                return this.error('Not enough arguments provided. At least two arguments are required.');
            }

            const filters = this.args[0];

            if (filters && typeof filters !== 'object') {
                return this.error("Invalid input: 'filters' should be an object");
            }

            const result = RecipeBook.filter(filters);
            WikiVars({result}, this);
        }
    })

    Macro.add('recipes_with_tag', {
        handler() {
            if (this.args.length < 1) {
                return this.error('Not enough arguments provided. At least one tag is required');
            }
            const result = RecipeBook.filter(this.args);
            WikiVars({result}, this);
        }
    });

    Macro.add('calculate', {
        tags: null,
        handler() {
            if (this.args.length < 1) {
                return this.error('Not enough arguments provided. At least one tag is required');
            }

            const obj = this.args[0];
            if (typeof obj !== 'object') {
                return this.error('Invalid argument: expected an object as the first argument');
            }

            const [name, servings] = RecipeBook.calculate(obj);
            WikiVars({servings, name}, this);
        }
    })
})();
