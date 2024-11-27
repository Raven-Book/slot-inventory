(() => {
    function isValidVariable (varName) {
        return varName && typeof varName === 'string' && varName.length >= 2 && (varName[0] === '$' || varName[0] === '_');
    }

    function extractVarName(rawArgs) {
        return rawArgs.trim()
            .split(' ')
            .first()
            .replace(/["']/g, '')
            .trim();
    }


    function flag(args, flags) {
        const keySet = new Set(Object.keys(flags));
        for (const arg of args) {
            if (keySet.has(arg)) {
                flags[arg] = true;
            }
        }
    }
    
    Macro.add('newinv', {
        handler() {
            const varName = extractVarName(this.args.raw);
            if (!isValidVariable(varName)) {
                return this.error('argument must be a story or temporary variable!');
            }
            const opts = clone(Inventory.DefaultOpts);
            if (this.args[1] != null) {
                const num = parseInt(this.args[1]);
                opts.maxSlots = isNaN(num) ? Inventory.DefaultOpts.maxSlots : num;
            }
            if (this.args[2] != null) {
                const num = parseInt(this.args[2]);
                opts.maxStack = isNaN(num) ? Inventory.DefaultOpts.maxStack : num;
            }
            State.setVar(varName, new Inventory([], {}, opts));   
        }
    });
    
    Macro.add('transfer', {
        handler() {
            if (this.args.length < 3) {
                return this.error('Not enough arguments provided. At least three arguments are required');
            }

            const fromInv = this.args[0];
            const toInv = this.args[1];
            const fromIdx = parseInt(this.args[2]) - 1;
            const toIdx = this.args[3] !== undefined ? parseInt(this.args[3]) - 1 : null;

            if (!(fromInv instanceof Inventory) || !(toInv instanceof Inventory)) {
                return this.error('The first and second arguments must be inventory objects!');
            }

            if (isNaN(fromIdx)) {
                return this.error('The third argument must be a valid slot index!');
            }

            if (toIdx !== null && isNaN(toIdx)) {
                return this.error('The fourth argument must be a valid slot index!');
            }

            const Code = Inventory.StatusCode;
            let result = fromInv.transfer(toInv, fromIdx, toIdx);
            switch (result.code) {
                case Code.SUCCESS:
                    if (State.length > 0) {
                        Popup.info('转移成功', `物品已成功转移到目标背包`);
                    }
                    break;
                case Code.INVALID_SLOT:
                    Popup.error('转移失败', '无效的格子索引');
                    break;
                case Code.SLOT_FULL:
                    Popup.warn('转移失败', '目标格子已满');
                    break;
                default:
                    Popup.error('转移失败', result.message);
            }
        }
    });

    Macro.add(['store', 'drop'], {
        handler() {
            const inv = this.args[0];
            const Code = Inventory.StatusCode;

            if (this.args.length < 1 || !(inv instanceof Inventory)) {
                return this.error('The first argument must be a inventory!');
            }

            if (this.args.length < 2) {
                return this.error('Not enough arguments provided. At least two arguments are required');
            }

            const num = this.args[2] ?? 1;
            if (this.name === 'drop') {
                const result = inv.drop(this.args[1] - 1, num);

                switch (result.code) {
                    case Code.INVALID_SLOT:
                        Popup.error('语句错误', result.message);
                        break;
                    case Code.PERMANENT_ITEM:
                        Popup.info('操作失败', result.message);
                        break;
                    case Code.SUCCESS:
                        Popup.info('操作成功', `${result.item}(x${num})被丢弃`);
                        break;
                    default:
                        Popup.error('操作失败', result.message);
                }
                return;
            }

            for (let i = 0; i < num; i++) {
                let result = inv.store(this.args[1], this.args[3]);
                if(!result.success && (result.code === Code.SLOT_FULL || result.code === Code.SLOT_OCCUPIED)) {
                    const handler = Inventory.handlers[':inventory_full'];
                    if (!handler) {
                        Popup.warn('背包已满', `${result.item}(x${num - i})被丢弃`);
                    } else {
                        handler(result.item, num - i);
                    }
                    break;
                }
            }
        }
    });

    Macro.add('inv', {
        handler() {
            if (this.args.length < 1) {
                return this.error('A inventory variable must be specified!');
            }
            const varName = extractVarName(this.args.raw);
            const inv = State.getVar(varName);
            if (!(inv instanceof Inventory)) {
                return this.error('The argument must be a inventory object!');
            }

            inv.render(this.output);
        }   
    });


    Macro.add(AllCategories, {
        tags: ['description', 'tags', 'durability', 'unstackable', 'permanent', 'unique'],
        handler() {
            if (this.args.length < 1) {
                return this.error('Not enough arguments provided. At least one argument is required');
            }

            const id = this.args[0];
            const name = this.args[1] ?? id;

            let tags, durability, description = '', handler = null, unstackable = false, permanent = false, unique = false;

            handler = this.payload[0].contents.trim();

            if (this.payload.length > 1) {
                for (const pl of this.payload.slice(1)) {
                    switch (pl.name) {
                        case 'tags':
                            tags = pl.args.flat(Infinity);
                            break;
                        case 'description':
                            description = pl.contents.trim();
                            break;
                        case 'durability':
                            durability = parseInt(pl.args[0] ?? 0);
                            break;
                        case 'unstackable':
                            unstackable = true;
                            break;
                        case 'permanent':
                            permanent = true;
                            break;
                        case 'unique':
                            unique = true;
                            break;
                    }
                }
            }

            const [cat, sub] = category(this.name);
            Item.add(id, {
                displayName: name,
                description,
                stackable: !unstackable,
                durability,
                handler,
                permanent,
                unique,
                cat,
                sub,
            }, tags);
        }
    });

    
})();