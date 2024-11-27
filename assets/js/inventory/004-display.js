(() => {
    'use strict';

    function generateSlotHtml(slot, idx) {
        if (!slot) {
            return $('<div>')
                .addClass('inv-slot empty')
                .attr('data-slot', idx + 1);
        }

        const item = Item.get(slot.id);
        const itemName = item?.displayName || slot.id;
        const itemClass = item ? `item-${item.cat.toLowerCase()}` : '';
        
        const $slot = $('<div>')
            .addClass(`inv-slot ${itemClass}`)
            .attr('data-slot', idx + 1)
            .attr('data-id', slot.id);
        
        $('<div>')
            .addClass('item-name')
            .text(itemName)
            .appendTo($slot);
        
        if (slot.durability) {
            const $durabilityContainer = $('<div>')
                .addClass('item-durability-container')
                .appendTo($slot);
            
            const durabilityPercent = Math.round(slot.durability / item.durability * 100);
            
            let durabilityClass = '';
            if (durabilityPercent > 90) {
                durabilityClass = 'perfect';
            } else if (durabilityPercent > 70) {
                durabilityClass = 'high';
            } else if (durabilityPercent > 50) {
                durabilityClass = 'good';
            } else if (durabilityPercent > 30) {
                durabilityClass = 'medium';
            } else if (durabilityPercent > 10) {
                durabilityClass = 'poor';
            } else {
                durabilityClass = 'low';
            }
            
            $('<div>')
                .addClass(`item-durability-bar ${durabilityClass}`)
                .css('width', `${durabilityPercent}%`)
                .appendTo($durabilityContainer);
                
            $('<div>')
                .addClass('item-durability-text')
                .text(`${slot.durability}/${item.durability}`)
                .appendTo($durabilityContainer);
        } else {
            $('<div>')
                .addClass('item-count')
                .text(`x${slot.count}`)
                .appendTo($slot);
        }
        
        return $slot;
    }

    function generateInventoryHtml(inv) {
        const $grid = $('<div>')
            .addClass('inventory-grid');
        
        inv.slots.forEach((slot, idx) => {
            $grid.append(generateSlotHtml(slot, idx));
        });
        
        const $controls = $('<div>').addClass('inventory-controls');

        const $search = $('<input>')
            .addClass('inv-search')
            .attr('type', 'text')
            .attr('placeholder', '搜索物品...');
        
        const $buttons = $('<div>').addClass('inv-buttons');
        
        const $sort = $('<button>')
            .addClass('inv-sort')
            .text('排序');
        
        const $regexToggle = $('<button>')
            .addClass('inv-regex-toggle')
            .text('正则搜索: 关');
        
        const $filter = $('<select>').addClass('inv-filter');
        
        $filter
            .append($('<option>').val('all').text('全部'))
            .append($('<option>').val('equipment').text('装备'))
            .append($('<option>').val('consumable').text('消耗品'))
            .append($('<option>').val('material').text('材料'))
            .append($('<option>').val('misc').text('其他'));
        
        $buttons
            .append($sort)
            .append($regexToggle)
            .append($filter);
        
        $controls
            .append($search)
            .append($buttons);
        
        const $container = $('<div>').addClass('inventory-container');
        
        $container
            .append($controls)
            .append($grid);
        
        return $container;
    }

    function createContextMenu(inv, slot, x, y) {
        $('.item-context-menu').remove();
        
        const $container = $('.inventory-container').parent();
        const item = Item.get(slot.id);
        
        const menu = $('<div>')
            .addClass('item-context-menu')
            .css({
                position: 'fixed',
                left: Math.max(0, x),
                top: Math.max(0, y),
                zIndex: 200200
            });

        
        const $use = $('<div>')
            .addClass('menu-item')
            .text('使用');
        
        let hasSeparator = false;
        debugger;
        if (item && (typeof item.handler === 'function' || (typeof item.handler === 'string' && item.handler.trim() !== ''))) {
            $use.on('touchstart click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = inv.slots.indexOf(slot); 
                handleUseItem(inv, idx, $container);
                menu.remove();
            }).appendTo(menu);
        
            $('<div>')
                .addClass('menu-separator')
                .appendTo(menu);
            hasSeparator = true;
        } else {
            $use.addClass('disabled');
        }

        $('<div>')
            .addClass('menu-item')
            .text('检查')
            .on('touchstart click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (item) {
                    item.inspect();
                } else {
                    Dialog.create(slot.id).wiki(`普普通通的${slot.id}`).open();
                }
                menu.remove();
            })
            .appendTo(menu);
        
        if (!hasSeparator) {
            $('<div>')
                .addClass('menu-separator')
                .appendTo(menu);
        }

        const $split = $('<div>')
            .addClass('menu-item')
            .text('拆分');
        if (slot.count < 2) {
            $split.addClass('disabled');
        } else {
            $split
                .on('touchstart click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSplitItem(inv, slot, $container);
                    menu.remove();
                })
        }

        $split.appendTo(menu);  
        
        const $drop = $('<div>')
            .addClass('menu-item')
            .text('丢弃');
        
        if (item?.permanent) {
            $drop.addClass('disabled');
        } else {
            $drop.on('touchstart click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const slotIdx = inv.slots.indexOf(slot);
                inv.drop(slotIdx, -1);
                menu.remove();
                inv.render($container[0]);
            });
        }
        
        $drop.appendTo(menu);
        
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            $('<div>')
                .addClass('menu-item')
                .text('移动到...')
                .on('touchstart click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    menu.remove();
                    
                    const overlay = $('<div>')
                        .addClass('inventory-move-overlay')
                        .css({
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 200150
                        });
                    
                    const hint = $('<div>')
                        .addClass('move-hint')
                        .text('选择目标位置')
                        .css({
                            position: 'fixed',
                            top: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '8px 16px',
                            zIndex: 200201
                        });
                    
                    const sourceSlot = $(`.inv-slot[data-slot="${inv.slots.indexOf(slot) + 1}"]`);
                    sourceSlot.addClass('move-source');
                    
                    $('body').append(overlay).append(hint);
                    
                    $('.inv-slot').one('touchstart click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const targetIdx = $(this).data('slot') - 1;
                        const sourceIdx = inv.slots.indexOf(slot);
                        
                        if (targetIdx !== sourceIdx) {
                            inv.transfer(inv, sourceIdx, targetIdx);
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
                })
                .appendTo(menu);
        }
        
        $('body').append(menu);
        
        menu.on('click', (e) => {
            e.stopPropagation();
        });

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
        const result = inv.use(idx);
        if (!result.success) {
            Popup.error('使用失败', result.message);
        }
        inv.render($container[0]);
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
            inv.transfer(inv, fromSlot - 1, toSlot - 1);
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

    Inventory.prototype.render = function (output) {
        const inv = this;
        
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
                const idx = $slot.attr('data-slot');
                const slot = inv.slots[idx - 1];
                
                let passesFilter = false;
                if (selectedFilter === 'all') {
                    passesFilter = true;
                } else if (slot) {
                    const item = Item.get(slot.id);
                    const cat = item?.cat?.toLowerCase() ?? 'misc';
                    passesFilter = (cat === selectedFilter);
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
            
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
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
})(); 