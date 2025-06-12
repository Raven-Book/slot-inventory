(() => {
    'use strict';

    const DURABILITY_THRESHOLDS = {
        90: 'perfect',
        70: 'high',
        50: 'good',
        30: 'medium',
        10: 'poor',
        0: 'low'
    };

    const SORTED_THRESHOLDS = Object.entries(DURABILITY_THRESHOLDS)
        .sort(([a], [b]) => Number(b) - Number(a));

    function getDurabilityClass(percent) {
        for (const [threshold, className] of SORTED_THRESHOLDS) {
            if (percent >= Number(threshold)) {
                return className;
            }
        }
        return DURABILITY_THRESHOLDS[0];
    }

    function generateSlotHtml(slot, idx) {
        const slotNumber = idx + 1;
        const $slot = $('<div>')
            .addClass('inv-slot')
            .attr('data-slot', slotNumber);

        if (!slot) {
            return $slot.addClass('empty');
        }

        const item = Item.get(slot.id);
        const itemName = item?.displayName || slot.id;
        

        const categoryClass = item ? `item-${item.cat}-${item.sub}` : '';
        $slot
            .addClass(categoryClass)
            .attr('data-id', slot.id)
            .attr('data-category', `${item?.cat || 'misc'}.${item?.sub || 'other'}`);

        if (item?.url?.trim()) {
            $slot.addClass('slot-img')
                .append($('<img>').attr('src', item.url));
        } else {
            $('<div>')
                .addClass('item-name')
                .text(itemName)
                .appendTo($slot);
        }

        if (slot.durability) {
            const durabilityPercent = Math.round((slot.durability / item.durability) * 100);
            const durabilityClass = getDurabilityClass(durabilityPercent);
            
            $('<div>')
                .addClass('item-durability-container')
                .append(
                    $('<div>')
                        .addClass(`item-durability-bar ${durabilityClass}`)
                        .css('width', `${durabilityPercent}%`),
                    $('<div>')
                        .addClass('item-durability-text')
                        .text(`${slot.durability}/${item.durability}`)
                )
                .appendTo($slot);
        } else {
            $('<div>')
                .addClass('item-count')
                .text(`x${slot.count}`)
                .appendTo($slot);
        }
        
        return $slot;
    }

    function generateInventoryHtml(inv) {
        const $container = $('<div>').addClass('inventory-container');
        const $controls = $('<div>').addClass('inventory-controls');
        const $buttons = $('<div>').addClass('inv-buttons');
        
        const $search = $('<input>', {
            class: 'inv-search',
            type: 'text',
            placeholder: '搜索物品...'
        });

        const $sort = $('<button>', {
            class: 'inv-sort',
            text: '排序'
        });
        
        const $regexToggle = $('<button>', {
            class: 'inv-regex-toggle',
            text: '正则搜索: 关'
        });

        const $filter = $('<select>').addClass('inv-filter');
        $('<option>', { value: 'all', text: '全部' }).appendTo($filter);
        
        const mainCategories = ItemCategory.getAllMain();
        for (const [id, category] of mainCategories) {
            $('<option>', { 
                value: id, 
                text: category.name 
            }).appendTo($filter);
        }

        const $grid = $('<div>')
            .addClass('inventory-grid')
            .append(inv.slots.map((slot, idx) => generateSlotHtml(slot, idx)));

        $buttons
            .append($sort)
            .append($regexToggle)
            .append($filter);

        $controls
            .append($search)
            .append($buttons);

        return $container
            .append($controls)
            .append($grid);
    }

    /**
     * 生成装备栏视图的HTML
     * @param {Inventory} inv - 装备栏容器
     * @returns {jQuery} 装备栏HTML元素
     */
    function equipmentView(inv) {
        const $container = $('<div>').addClass('equipment-container');
        
        const $title = $('<div>')
            .addClass('equipment-title')
            .text('装备栏');
        

        const $grid = $('<div>')
            .addClass('equipment-grid')
            .append(inv.slots.map((slot, idx) => generateSlotHtml(slot, idx)));
        

        return $container
            .append($title)
            .append($grid);
    }

    function createContextMenu(inv, slot, x, y) {
        $('.item-context-menu').remove();
        
        const $container = $('.inventory-container').parent();
        const item = Item.get(slot.id);
        const slotIdx = inv.slots.indexOf(slot);
        
        const menu = $('<div>')
            .addClass('item-context-menu')
            .css({
                position: 'fixed',
                left: Math.max(0, x),
                top: Math.max(0, y),
                zIndex: 200200
            });

        const menuItems = [
            {
                text: '穿戴',
                setup: () => {
                    let detail = { append: false, handler: null };
                    $(document).trigger({
                        type: 'inventory:menu.wear',
                        source: 'Slot Inventory',
                        idx: slotIdx,
                        inv,
                        slot,
                        detail
                    });
                    if (!detail.append) return false;
                    return detail.handler;
                }
            },
            {
                text: '使用',
                condition: () => !!(item && (typeof item.handler === 'function' || (typeof item.handler === 'string' && item.handler.trim() !== ''))),
                action: () => handleUseItem(inv, slotIdx, $container)
            },
            {
                text: '检查',
                action: () => item ? item.inspect() : Dialog.create(slot.id).wiki(`普普通通的${slot.id}`).open()
            },
            {
                text: '拆分',
                condition: () => slot.count >= 2,
                action: () => handleSplitItem(inv, slot, $container)
            },
            {
                text: '丢弃',
                condition: () => !item?.permanent,
                action: () => {
                    inv.drop(slotIdx, -1);
                    inv.render($container[0]);
                }
            }
        ];

        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            menuItems.push({
                text: '移动到...',
                action: () => {
                    const overlay = $('<div>').addClass('inventory-move-overlay').css({
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200150
                    });
                    const hint = $('<div>').addClass('move-hint').text('选择目标位置').css({
                        position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)',
                        padding: '8px 16px', zIndex: 200201
                    });
                    const sourceSlot = $(`.inv-slot[data-slot="${slotIdx + 1}"]`).addClass('move-source');
                    
                    $('body').append(overlay).append(hint);
                    
                    $('.inv-slot').one('touchstart click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetIdx = $(this).data('slot') - 1;
                        if (targetIdx !== slotIdx) {
                            inv.transfer(inv, slotIdx, targetIdx);
                            inv.render($container[0]);
                        }
                        overlay.remove();
                        hint.remove();
                        sourceSlot.removeClass('move-source');
                    });
                    
                    overlay.on('touchstart click', () => {
                        overlay.remove();
                        hint.remove();
                        sourceSlot.removeClass('move-source');
                    });
                }
            });
        }

        let hasSeparator = false;
        menuItems.forEach((menuItem, idx) => {
            const $item = $('<div>').addClass('menu-item').text(menuItem.text);
            
            let handler = null;
            let isAppend = true;
            if (menuItem.setup) {
                handler = menuItem.setup();
                if (handler === false) {
                    isAppend = false;
                } else if (handler === null) {
                    $item.addClass('disabled');
                }
            } else if (menuItem.condition) {
                if (!menuItem.condition()) {
                    $item.addClass('disabled');
                }
            }
            
            if (!$item.hasClass('disabled')) {
                $item.on('touchstart click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (handler) {
                        handler();
                        inv.render($container[0]);
                    } else if (menuItem.action) {
                        menuItem.action();
                    }
                    menu.remove();
                });
            }
            
            if (isAppend) {
                menu.append($item);
                if (!hasSeparator && idx < menuItems.length - 1) {
                    menu.append($('<div>').addClass('menu-separator'));
                    hasSeparator = true;
                }
            }
        });

        $('body').append(menu);
        
        menu.on('click', (e) => e.stopPropagation());

        setTimeout(() => {
            $(document).one('click', function(e) {
                if (!$(e.target).closest('.item-context-menu').length) {
                    menu.remove();
                }
            });
        }, 100);

        return menu;
    }

    function handleUseItem(inv, idx, $container) {
        try {
            const slot = inv.slots[idx];
            if (!slot) return;

            const item = Item.get(slot.id);
            if (!item) return;

            const handler = item.handler;
            if (typeof handler === 'function') {
                handler(inv, idx);
            } else if (typeof handler === 'string' && handler.trim() !== '') {
                $.wiki(handler.trim());
            }
            inv.render($container[0]);
        } catch (error) {
            console.error('Error handling item use:', error);
        }
    }

    function handleItemClick(inv, slotIdx, e) {
        const slot = inv.slots[slotIdx - 1];
        if (!slot) return;
        
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isMobile) {
            const touch = e.type.includes('touch') ? e.originalEvent.changedTouches[0] : e;
            createContextMenu(inv, slot, touch.clientX, touch.clientY);
        } else {
            if (e.shiftKey && e.button === 0) {
                const item = Item.get(slot.id);
                item?.inspect();
            } else if (e.shiftKey && e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                handleSplitItem(inv, slot, $(e.target).closest('.inventory-container').parent());
            }
            else if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                createContextMenu(inv, slot, e.clientX, e.clientY);
                return;
            }
        }
    }

    function handleDragStart(e) {
        if ($(this).hasClass('empty')) {
            e.preventDefault();
            return;
        }
        e.originalEvent.dataTransfer.setData('text/plain', $(this).data('slot'));
        $(this).addClass('dragging');
    }

    function handleDragEnd(e) {
        $(this).removeClass('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        $(this).addClass('drag-over');
    }

    function handleDragLeave(e) {
        $(this).removeClass('drag-over');
    }

    function handleDrop(e, inv) {
        e.preventDefault();
        $(this).removeClass('drag-over');
        
        const fromSlot = parseInt(e.originalEvent.dataTransfer.getData('text/plain'));
        const toSlot = parseInt($(this).data('slot'));
        
        if (fromSlot !== toSlot) {
            inv.move(fromSlot - 1, toSlot - 1);
            inv.render($(this).closest('.inventory-container').parent()[0]);
        }
    }

    function handleSplitItem(inv, slot, $container) {
        const count = Math.floor(slot.count / 2);
        if (count > 0) {
            const slotIdx = inv.slots.indexOf(slot);
            const result = inv.split(slotIdx, count);
            if (!result.success) {
                Popup.error('拆分失败', result.message);
            }
            inv.render($container[0]);
        }
    }

    function transferView(output, inv1, inv2, type, swapped = false) {
        if (type === 'take' && !swapped) {
            const tmp = inv1;
            swapped = true;
            inv1 = inv2;
            inv2 = tmp;
        }

        const $container = $('<div>').addClass('inventory-transfer-container');
        const $table = $('<ul>').addClass('transfer-table');

        inv1.iterate((idx, slot, _) => {
            if (!slot) return;

            let $item;
            const item = Item.get(slot.id);
            if (typeof item?.inspect === 'function') {
                $item = $('<a>')
                            .addClass('item-link')
                            .text(item?.displayName || slot.id)
                            .on('click', () => Item.get(slot.id)?.inspect());
            } else {
                $item = $('<span>')
                    .addClass('transfer-name')
                    .text(item?.displayName || slot.id)
            }

            const $row = $('<li>')
                .addClass('slot-inventory-listing')
                .attr('data-slot', idx + 1)
                .append($item)      
                .append($('<span>').html(`&nbsp;×&nbsp;${slot.count}&nbsp;`))
                .append($('<span>').addClass('spacer'))
                .append($('<a>')
                    .addClass('item-action-link')
                    .text(type === 'give' ? '给予':'取走')
                    .on('click', function() {
                        const slot = parseInt($(this).closest('li').data('slot'));
                        const result = inv1.transfer(inv2, slot - 1);
                        if (!result.success) {
                            Popup.info(`${type === 'give'? '给予':'获取'}失败`, result.message);
                        }
                        inv1.render($(".inventory-transfer-container").parent()[0], inv2, type, swapped);
                    })
                )
                .append($('<span>').addClass('spacer'));
        
            $table.append($row);
        });

        const $takeAllRow = $('<li>')
            .addClass('all-listing slot-inventory-listing');
        for (let i = 0; i < 3; i++) {
            $takeAllRow.append($('<span>').addClass('spacer'));
        }
            $takeAllRow
                .append($('<a>')
                    .addClass('item-action-link')
                    .text(`${type === 'give' ? '给予':'取走'}全部`)
                    .on('click', function() {
                        let failed = false;
                        inv1.iterate((idx, slot) => {
                            if (slot && !failed) {  // 如果之前没有失败，则继续操作
                                const result = inv1.transfer(inv2, idx);
                                if (!result.success) {
                                    Popup.info(`$${type === 'give'? '给予':'获取'}失败`, result.message);
                                    failed = true;
                                    return false;
                                }
                            }
                        });
                        inv1.render($(".inventory-transfer-container").parent()[0], inv2, type, swapped);
                    }))
                .append($('<span>').addClass('spacer'));

        $table.append($takeAllRow);
        $container.append($table);
        $(output).empty().append($container);
    }

    function defaultView(output, inv) {

        if (inv.containerType === 'equipment') {
            return equipmentView(inv);
        }

        const $existingContainer = $('.inventory-container');
        
        let searchText = $existingContainer.find('.inv-search').val() || '';
        let useRegex = $existingContainer.find('.inv-regex-toggle').text().includes('开');
        let selectedFilter = $existingContainer.find('.inv-filter').val() || 'all';
        
        const $container = generateInventoryHtml(inv);
        $container.find('.inv-search').val(searchText);
        $container.find('.inv-regex-toggle').text(`正则搜索: ${useRegex ? '开' : '关'}`);
        $container.find('.inv-filter').val(selectedFilter);
        
        $container.find('.inv-regex-toggle').on('click', function() {
            useRegex = !useRegex;
            $(this).text(`正则搜索: ${useRegex ? '开' : '关'}`);
            $container.find('.inv-search').trigger('input');
        });

        $container.find('.inv-search').on('input', function() {
            const searchText = $(this).val().toLowerCase();
            const selectedFilter = $container.find('.inv-filter').val();
            
            $container.find('.inv-slot').each(function() {
                const $slot = $(this);
                const itemName = $slot.find('.item-name').text().toLowerCase();
                const itemCategory = $slot.attr('data-category') || 'misc.other';
                const [mainCat] = itemCategory.split('.');
                
                let passesFilter = false;
                if (selectedFilter === 'all') {
                    passesFilter = true;
                } else {
                    passesFilter = (mainCat === selectedFilter);
                }
                
                let passesSearch = false;
                if (useRegex && searchText) {
                    try {
                        const regex = new RegExp(searchText, 'i');
                        passesSearch = regex.test(itemName);
                    } catch (e) {
                        passesSearch = false;
                    }
                } else {
                    passesSearch = itemName.includes(searchText) || searchText === '';
                }
                
                $slot[passesFilter && passesSearch ? 'show' : 'hide']();
            });
        });

        $container.find('.inv-sort').on('click', function() {
            inv.sort([], true);
            inv.render($(".inventory-container").parent()[0]);
        });

        $container.find('.inv-filter').on('change', function() {
            $container.find('.inv-search').trigger('input');
        });
        
        $container.find('.inv-slot').each(function() {
            const $slot = $(this);
            
            if ('ontouchstart' in window) {
                let touchStartTime = 0;
                let touchStartX = 0;
                let touchStartY = 0;
                let hasMoved = false;
                
                $slot.on('touchstart', function(e) {
                    if (!$(this).hasClass('empty')) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }
                    e.stopPropagation();
                    
                    if ($(this).hasClass('empty')) return;
                    
                    const touch = e.originalEvent.touches[0];
                    touchStartTime = Date.now();
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                    hasMoved = false;
                    
                    $(this).data('touchTimer', setTimeout(() => {
                        const slotIdx = $(this).data('slot');
                        const slot = inv.slots[slotIdx - 1];
                        if (slot) {
                            createContextMenu(inv, slot, touch.clientX, touch.clientY);
                        }
                    }, 500));
                })
                .on('touchmove', function(e) {
                    if (!$(this).hasClass('empty') && hasMoved) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }
                    
                    const touch = e.originalEvent.touches[0];
                    const moveX = Math.abs(touch.clientX - touchStartX);
                    const moveY = Math.abs(touch.clientY - touchStartY);
                    const moveThreshold = 10;
                    
                    if (moveX > moveThreshold || moveY > moveThreshold) {
                        hasMoved = true;
                        clearTimeout($(this).data('touchTimer'));
                    }
                })
                .on('touchend touchcancel', function(e) {
                    clearTimeout($(this).data('touchTimer'));
                    
                    if (!hasMoved && Date.now() - touchStartTime < 500) {
                        const slotIdx = $(this).data('slot');
                        const slot = inv.slots[slotIdx - 1];
                        if (slot) {
                            const item = Item.get(slot.id);
                            item?.inspect();
                        }
                    }
                });
            } else {
                $slot
                    .on('click contextmenu', function(e) {
                        e.preventDefault();
                        const slotIdx = $(this).data('slot');
                        handleItemClick(inv, slotIdx, e);
                    })
                    .attr('draggable', true)
                    .on('dragstart', handleDragStart)
                    .on('dragend', handleDragEnd)
                    .on('dragover', handleDragOver)
                    .on('dragleave', handleDragLeave)
                    .on('drop', function(e) { handleDrop.call(this, e, inv); });
            }
        });
        
        $container.on('contextmenu', function(e) {
            e.preventDefault();
        });
        
        if (searchText) {
            $container.find('.inv-search').trigger('input');
        }
        if (selectedFilter !== 'all') {
            $container.find('.inv-filter').trigger('change');
        }
        
        $(output).empty().append($container);
    }

    Inventory.prototype.render = function (output, inv2 = null, type = 'give', swapped = false) {
        const inv1 = this;
        
        if (inv2) {
            transferView(output, inv1, inv2, type, swapped);
        } else {
            defaultView(output, inv1);
        }
    }
})();