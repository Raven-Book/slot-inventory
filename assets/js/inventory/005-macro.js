(() => {
    function isValidVariable(varName) {
        return varName && typeof varName === 'string' && varName.length >= 2 && (varName[0] === '$' || varName[0] === '_');
    }

    function extractVarName(args, idx) {
        return args.trim()
            .split(' ')[idx]
            .replace(/['"]/g, '')
            .trim();
    }


    function getInv(args, idx) {
        return State.getVar(extractVarName(args, idx));
    }

    function checkInv(inv) {
        if (!(inv instanceof Inventory)) {
            throw new Error('The argument must be a inventory object!');
        }
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
            const varName = extractVarName(this.args.raw, 0);
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
                        Popup.success('转移成功', `物品已成功转移到目标背包`);
                    }
                    break;
                case Code.INVALID_SLOT:
                    Popup.error('转移失败', '无效的格子索引');
                    break;
                case Code.SLOT_FULL:
                    Popup.info('转移失败', '目标格子已满');
                    break;
                case Code.PERMANENT_ITEM:
                    Popup.info('转移失败', `${result.item}无法转移`);
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
                        Popup.info('操作成功', `${Item.get(result.item)?.displayName ?? result.item}(x${num})被丢弃`);
                        break;
                    default:
                        Popup.error('操作失败', result.message);
                }
                return;
            }
            inv.store(this.args[1], this.args[2], this.args[3], this.args[4]);
        }
    });

    Macro.add('delete', {
        handler() {
            const inv = this.args[0];
            const Code = Inventory.StatusCode;
            
            if (this.args.length < 2) {
                return this.error('Not enough arguments provided. At least two arguments are required');
            }

            if (!(inv instanceof Inventory)) {
                return this.error('The first argument must be a inventory!');
            }  

            const result = inv.delete(...this.args.slice(1)) ;

            if (result.code !== Code.SUCCESS) {
                Popup.error('操作失败', result.message);
            } else {
                Popup.success('操作成功', `物品被删除`);
            }
        }
    });

    Macro.add(['inv', 'take', 'give'], {
        handler() {
            if (this.args.length < 1) {
                return this.error('A inventory variable must be specified!');
            }
            const raw = this.args.raw;
            const inv1 = getInv(raw, 0);
            checkInv(inv1);
            if (this.name === 'inv') {
                inv1.render(this.output);
            } else {
                const inv2 = getInv(raw, 1);
                inv1.render(this.output, inv2, this.name);
            }
        }
    });

    Macro.add('use', {
        handler() {
            if (this.args.length < 2) {
                return this.error('Not enough arguments provided. At least two arguments are required');
            }

            const inv = getInv(this.args.raw, 0);

            if (!(inv instanceof Inventory)) {
                return this.error('The first argument must be a inventory!');
            }

            const idx = typeof this.args[1] === 'string' ? inv.indexOf(this.args[1]) : this.args[1] - 1; 

            if (isNaN(idx)) {
                return this.error('The second argument must be a valid slot index!');
            }

            if (idx === -1) {
                Popup.info('物品不存在', `${this.args[1]}不存在于容器中`);
                return;
            }

            inv.use(idx);
        }
    });

    Macro.add(['item', ...AllCategories], {
        tags: ['description', 'tags', 'durability', 'unstackable', 'permanent', 'unique', 'url', 'category'],
        handler() {
            if (this.args.length < 1) {
                return this.error('Not enough arguments provided. At least one argument is required');
            }

            const id = this.args[0];
            const name = this.args[1] ?? id;

            let tags, icategory = [], durability = 0, url = '', description = '', handler = null, unstackable = false, permanent = false, unique = false;

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
                        case 'url':
                            url = pl.args.raw;
                            break;
                        case 'category':
                            icategory = pl.args;
                            break;
                    }
                }
            }
            let cat, sub;

            if (this.name === 'item') {
                if (icategory.length === 0) {
                    icategory.push('misc');
                }
                if (icategory.length === 1) {
                    icategory.push('other');
                }
                [cat, sub] = icategory;
            } else {
                [cat, sub] = category(this.name);
            }            
         
            Item.add(id, {
                displayName: name,
                description,
                stackable: !unstackable && durability === 0,
                durability,
                handler,
                permanent,
                unique,
                cat,
                sub,
                url
            }, tags);
        }
    });



})();