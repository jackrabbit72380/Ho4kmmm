(function () {
    let _screenManager = dew.makeScreenManager();
    let itemDatasource = makeItemDatasource();
    let _containerElement = document.getElementById('container');
    let _footerElement = _containerElement.querySelector('.window-footer');
    let _titleElement = _containerElement.querySelector('.window-title');
    let _objectQuotaElement = _containerElement.querySelector('.object-quota');
    let _budget = {};
    let _recent = [];
    let _hidden = false;
    let _itemHistory = [];

    _screenManager.setModel({
        main: makeMainScreen(_screenManager),
        items: makeItemsScreen(_screenManager),
        search: makeSearchScreen(_screenManager),
        prefabs: makePrefabsScreen(_screenManager),
        modal: makeModalScreen(_screenManager),
        tool_settings: makeToolSettingsScreen(_screenManager)
    });

    document.addEventListener('mousedown', function (e) {
        if (e.target == _containerElement) {
            e.preventDefault();
            e.stopPropagation();
			dew.playSound('b_button');
            hide();
        }
    }, false);

    _screenManager.push('main');

    dew.on('show', function (e) {
        updateObjectQuotaText();
        _hidden = false;
        _budget = {};
        for (let item of e.data.budget) {
            var tagIndex = parseInt(item.tagindex, 16);
            _budget[tagIndex] = item;
        }

        dew.command('Settings.Gamepad').then(response => {
            if (parseInt(response) == 1)
                _containerElement.classList.add('using-controller');
            else
                _containerElement.classList.remove('using-controller');
        });

    });

    function makeMainScreen(screenManager) {
        let _screenElement = document.querySelector('.main-screen');
        let _categoryTreeElement = _screenElement.querySelector('.category-tree');
        let _infoBoxElement = _screenElement.querySelector('.window-info-box');
        let _legendElement = _footerElement.querySelector('.main-legend');
        let _categoryTree = dew.makeTreeList(_categoryTreeElement);
        let _active = false;
        let _path = [];
        let _itemsLoaded = false;
        
        _categoryTree.on('change', ({ index, path }) => {
            var helpAttribute = path.getAttribute('help');
            setHelpText(helpAttribute);
        });

        _categoryTree.on('push', pathNode => {
            if (pathNode.getAttribute('name'))
                _path.push(pathNode.getAttribute('name'));
            renderBreadcrumbs(_path);
        });
        _categoryTree.on('pop', () => {
            _path.pop();
            renderBreadcrumbs(_path);
        });

        _categoryTree.on('select', ({ index, element, path }) => {
            if (path.getElementsByTagName('category').length)
                return;

            var id = path.getAttribute('id');
            if (id === 'prefabs') {
                _screenManager.push('prefabs');
            } else if (id === 'recent') {
                _screenManager.push('items', { path: ['RECENTLY USED ITEMS'], items: _itemHistory, shouldDisplayType: true });
            } else if(id === 'map_options') {
                dew.hide();
                dew.command('Forge.MapOptions');
            }
            else {
                var itemNodes = path.getElementsByTagName('item');
                var items = [];
                for (let node of itemNodes) {
                    items.push(makeItem(node))
                }
                screenManager.push('items', { path: _path.concat([path.getAttribute('name')]), items: items });
            }
        });


        document.addEventListener('keydown', e => {
            if (!_active)
                return;
            if (!(!(e.keyCode > 47 && e.keyCode < 58) && // 0-9
                !(e.keyCode > 64 && e.keyCode < 91) && // A-Z
                !(e.keyCode > 96 && e.keyCode < 123))) { // a-z

                screenManager.push('search', { initialQuery: String.fromCharCode(e.which) });
            }
        });

        dew.on('forge_init', function(e) {
            _itemsLoaded = false;
            screenManager.popAll(false);
        });
   
        function transitionIn() {
            _categoryTree.focus();
            _screenElement.classList.add('active');
            _legendElement.classList.remove('hidden');
            _legendElement.addEventListener('mousedown', onLegendClick);
        }

        return {
            activate: function (props = {}) {
                setTitle('Object Browser');
                _active = true;

                if(!_itemsLoaded) {
                    itemDatasource.fetch((err, items) => {
                        _itemsLoaded = true;
                        _categoryTree.setSource(items.firstChild);
                        _categoryTree.gotoRoot();
                        _path = [];
                        renderBreadcrumbs(_path);
                        transitionIn();
                    });
                   
                } else {
                    transitionIn();
                }
            },
            deactivate: function () {
                _active = false;
                _legendElement.classList.add('hidden');
                _screenElement.classList.remove('active');
                _legendElement.removeEventListener('mousedown', onLegendClick);

                _categoryTree.blur();

            },
            onAction: function ({ action }) {
                if (!_active)
                    return;

                switch (action) {
                    case dew.input.Actions.X:
                        hide();
                        dew.playSound('b_button');
                        break;
                    case dew.input.Actions.B:
                        if (_categoryTree.atRoot()) {
                            hide();
                        }
                        break;
                    case dew.input.Actions.Y:
                        screenManager.push('tool_settings');
                        dew.playSound('x_button');
                        break;
                }

            }
        }

        function onLegendClick(e) {
            switch (e.target.rel) {
                case 'select':
                    break;
                case 'back':
                    if (_categoryTree.atRoot()) {
                        hide();
                        dew.playSound('b_button');
                    }
                    else {
                        _categoryTree.pop();
                    }
                    break;
                case 'hide':
                    dew.playSound('b_button');
                    hide();
                    break;
                case 'tool_settings':
                    dew.playSound('a_button');
                    screenManager.push('tool_settings');
                    break;
                default:
                    return;
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
            
        }

        function setHelpText(description) {
            _infoBoxElement.textContent = description || '';
        }

        function renderBreadcrumbs(path) {
            if (!path.length) {
                _screenElement.querySelector('.category-header').innerHTML = '';
                return;
            }

            let html = '';
            for (let p of path)
                html += `<li><a>${escapeHtml(p)}</a></li>`

            _screenElement.querySelector('.category-header').innerHTML = `<ul>${html}</ul>`;
        }
    }

    function makeItemsScreen(screenManager) {
        let _screenElement = document.querySelector('.items-screen');
        let _itemListElement = _screenElement.querySelector('.item-list');
        let _legendElement = _footerElement.querySelector('.list-legend');
        let _infoBoxElement = _screenElement.querySelector('.window-info-box');
        let _pathElement = _screenElement.querySelector('.category-path');

        let _itemList = dew.makeListWidget(_itemListElement, {
            itemSelector: '.item',
            hoverSelection: true,
            hoverClass: 'selected',
            selectedClass: 'selected',
            wrapAround: true
        });
        let _items = [];
        let _active = false;
        let _shouldDisplayType = false;

        _itemList.on('select', ({ index, element }) => {
            var item = _items[index];
            spawnItem(item);
        });

        _itemList.on('selectionChange', ({ index, element }) => {
            setHelpText(_items[index].help || '');
        });

        dew.on('show', function (e) {
            if (_active) {
                // hack: wait on the next tick the budget will be updated, as to execute synchronously
                setTimeout(function () {
                    let selected = _itemList.getSelected();
                    if (!selected)
                        return;
                    let selectedIndex = selected ? selected.index : 0;
                    renderItemList(_items);
                    _itemList.refresh();
                    _itemList.setSelected(selectedIndex);
                }, 1);
            }
        });


        document.addEventListener('keydown', e => {
            if (!_active)
                return;
            if (!(!(e.keyCode > 47 && e.keyCode < 58) && // 0-9
                !(e.keyCode > 64 && e.keyCode < 91) && // A-Z
                !(e.keyCode > 96 && e.keyCode < 123))) { // a-z

                screenManager.push('search', { initialQuery: String.fromCharCode(e.which) });
            }
        });


        return {
            activate: function (props) {
                _active = true;
                _legendElement.classList.remove('hidden');
                _legendElement.addEventListener('mousedown', onLegendClick);
                _screenElement.classList.add('active');
                _itemList.focus();
                if (props && props.items) {
                    _shouldDisplayType = props.shouldDisplayType;
                    _items = props.items;
                    renderItemList(props.items);
                    _itemList.refresh();
                    _itemList.setSelected(0);

                    renderBreadcrumbs(props.path);
                }
            },
            deactivate: function () {
                _active = false;
                _legendElement.classList.add('hidden');
                _legendElement.removeEventListener('mousedown', onLegendClick);
                _screenElement.classList.remove('active');
                _itemList.blur();
            },
            onAction: function ({ action }) {
                if (!_active)
                    return false;
                switch (action) {
                    case dew.input.Actions.X:
                        hide();
                        dew.playSound('b_button');
                        break;
                    case dew.input.Actions.B:
                        setHelpText('');
                        dew.playSound('b_button');
                        screenManager.pop();
                        break;
                }
            }
        }

        function renderItemList(items) {
            let html = '';
            for (let item of items) {
                var budget = _budget[item.tagIndex] || { max_allowed: 255, count_on_map: 0 };

                let maxAllowed = item.maxAllowed || budget.max_allowed;
                var remainingCount = maxAllowed - budget.count_on_map;


                html += `<li class="item">${_shouldDisplayType ? `<span class="type">${item.type}</span>` : ''}
                        <span class="title">${escapeHtml(item.name)}</span><span class="quota">${remainingCount}</span></li>`;
            }
            _itemListElement.innerHTML = html;
        }

        function renderBreadcrumbs(path) {
            if (!path.length) {
                _screenElement.querySelector('.category-header').innerHTML = '';
                return;
            }

            let html = '';
            for (let p of path)
                html += `<li><a>${escapeHtml(p)}</a></li>`

            _screenElement.querySelector('.category-header').innerHTML = `<ul>${html}</ul>`;
        }

        function setHelpText(description) {
            var err = new Error();
            _infoBoxElement.innerHTML = escapeHtml(description || '');
        }

        function onLegendClick(e) {
            switch (e.target.rel) {
                case 'place':
                    break;
                case 'back':
                    dew.playSound('b_button');
                    screenManager.pop();
                    break;
                case 'hide':
                    dew.playSound('b_button');
                    hide();
                    break;
                default:
                    return;
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    function makeSearchScreen(screenManager) {
        let _screenElement = document.querySelector('.search-screen');
        let _searchResultListElement = _screenElement.querySelector('.search-results');
        let _searchInputElement = _screenElement.querySelector('.search-textbox');
        let _searchResultList = dew.makeListWidget(_searchResultListElement, {
            itemSelector: '.item',
            hoverSelection: true,
            hoverClass: 'selected',
            selectedClass: 'selected',
            wrapAround: true
        });
        let _results = [];
        let _active = false;

        _searchResultList.on('select', ({ index, element }) => {
            spawnItem(_results[index]);
        });

        _searchResultListElement.addEventListener('mousemove', e => {
            if (!_active)
                return;
            if (document.activeElement == _searchInputElement) {
                _searchInputElement.blur();
                _searchResultList.focus();
            }
        });

        _searchInputElement.addEventListener('input', e => {
            _results = itemDatasource.search(e.target.value).slice(0, 100);
            renderSearchResults(_results);
        });

        document.addEventListener('keydown', e => {
            if (!_active)
                return;
            if (_searchResultList.hasFocus()) {
                if (!(!(e.keyCode > 47 && e.keyCode < 58) && // 0-9
                    !(e.keyCode > 64 && e.keyCode < 91) && // A-Z
                    !(e.keyCode > 96 && e.keyCode < 123))) {
                    _searchInputElement.focus();
                }
            }

        });

        dew.input.on('scroll', function (type, axis, direction) {
            if (!_active)
                return;

            if (axis === 0 && direction === 1) {
                if (document.activeElement === _searchInputElement) {
                    _searchInputElement.blur();
                    _searchResultList.focus();
                    if (_searchResultList.setSelected(0) != -1)
                        dew.playSound('vertical_navigation');
                    return false;
                }
            }
        });

        _searchInputElement.addEventListener('focus', e => {
            _searchResultList.setSelected(-1);
            _searchResultList.blur();
        });

        return {
            activate: function (props) {
                _footerElement.querySelector('.list-legend').classList.remove('hidden');
                _active = true;
                _screenElement.classList.add('active');
                if (props.initialQuery) {
                    _searchInputElement.focus();
                    _searchInputElement.value = props.initialQuery;
                    _searchResultList.refresh();
                } else {
                    _searchResultList.refresh();
                    _searchResultList.focus();
                }
            },
            deactivate: function () {
                _footerElement.querySelector('.list-legend').classList.add('hidden');
                _active = false;
                _screenElement.classList.remove('active');
                _searchResultList.blur();
                _searchInputElement.blur();
                _searchInputElement.value = '';
            },
            onAction: function ({ action }) {

                if (!_active)
                    return;
                switch (action) {
                    case dew.input.Actions.X:
						if(document.activeElement != _searchInputElement){
							hide();
							dew.playSound('b_button');
						}
                        break;
                    case dew.input.Actions.B:
                        dew.playSound('b_button');
                        screenManager.pop();
                        break;
                }
            }
        }

        function renderSearchResults(results) {
            let html = '';
            for (let result of results) {
                html += `<li class="item"><span class="type">${result.type}</span><span class="title">${escapeHtml(result.name)}</span></li>`;
            }
            _searchResultListElement.innerHTML = html;
        }
    }

    function makeItemDatasource() {
        let _itemsJson = null;
        let _fuse = null;
        let _callbacks = [];

        return {
            search: function (query) {
                return _fuse.search(query);
            },
            fetch: function (callback) {
                fetchInternal(callback);
            }
        }

        function flattenItems(itemDom) {
            let _result = [];
            let _pathStack = [];
            let _nodeVisitors = {
                item: visitItem,
                category: visitCategory
            }

            flatternInternal(itemDom.firstChild);
            return _result;

            function flatternInternal(node) {
                for (let x of node.children)
                    _nodeVisitors[x.nodeName](x);
            }

            function visitItem(node) {
                let item = makeItem(node);
                item.path = _pathStack.slice(0);
                _result.push(item);
            }

            function visitCategory(node) {
                _pathStack.push(node.getAttribute('name'));
                flatternInternal(node);
                _pathStack.pop();
            }
        }

        function fetchInternal(callback) {
            var items = {};

            dew.callMethod('forgePalette').then(r => {
                let data = JSON.parse(r);
                let dom = buildItemsDOM(data);
                _itemsJson = flattenItems(dom);
                _fuse = new Fuse(_itemsJson, {
                    shouldSort: true,
                    threshold: 0.6,
                    location: 0,
                    distance: 40,
                    maxPatternLength: 32,
                    minMatchCharLength: 1,
                    keys: ["name", "type"]
                });
                if (callback)
                    callback(null, dom);
            });
        }
    }

    function makeItem(node) {
        let name = node.getAttribute('name');
        let tagIndex = parseInt(node.getAttribute('tagindex'))
        let help = node.getElementsByTagName('help')[0];
        let properties = null;
        let propertiesNodes = node.getElementsByTagName('setter');
        let type = node.getAttribute('type');

        var valueParsers = {
            'float': parseFloat,
            'int': parseInt
        };

        for (let node of propertiesNodes) {
            properties = properties || {};
            var value = valueParsers[node.getAttribute('type')](node.getAttribute('value'));
            var target = node.getAttribute('target');
            properties[target] = value;
        }

        var item = {
            type: type,
            name: name,
            tagIndex: tagIndex,
            help: help ? help.textContent : '',
            properties: properties
        };

        if (node.getAttribute('max_allowed')) {
            item.maxAllowed = parseInt(node.getAttribute('max_allowed'));
        }
        return item;
    }

    function makePrefabsScreen(screenManager) {
        const _screenElement = document.querySelector('.prefabs-screen');
        let _prefabListElement = _screenElement.querySelector('.prefab-list');
        let _legendElement = _footerElement.querySelector('.prefab-legend');
        let _prefabList = dew.makeListWidget(_prefabListElement, {
            wrapAround: true,
            selectedClass: 'selected',
            hoverClass: 'selected',
            hoverSelection: true
        });
        let _prefabs = null;
        let _lastSelectedIndex = -1;

        _prefabList.on('select', ({ index, element }) => {
            dew.command(`Forge.LoadPrefab "${_prefabs[index].filename}"`).then(hide);
        });

        return {
            activate: function (props) {
                setTitle('Prefabs');
                if (props && !props.noHide)
                    _prefabs = null;
                if (!_prefabs) {
                    fetchPrefabs(prefabs => {
                        renderPrefabList();
                        _screenElement.classList.add('active');
                        _prefabList.refresh();
                        _prefabList.focus();
                        _prefabList.setSelected(_lastSelectedIndex == -1 ? 0 : _lastSelectedIndex);
                        _lastSelectedIndex = -1;
                    });
                } else {
                    _screenElement.classList.add('active');
                    _prefabList.focus();
                }

                _legendElement.classList.remove('hidden');
                _legendElement.addEventListener('mousedown', onLegendClick);
            },
            deactivate: function (props) {
                if (!props.noHide)
                    _screenElement.classList.remove('active');
                _footerElement.querySelector('.prefab-legend').classList.add('hidden');
                _prefabList.blur();

                _legendElement.classList.add('hidden');
                _legendElement.removeEventListener('mousedown', onLegendClick);
            },
            onAction: function ({ action }) {
                switch (action) {
                    case dew.input.Actions.X:
                        hide();
                        dew.playSound('b_button');
                        break;
                    case dew.input.Actions.B:
                        dew.playSound('b_button');
                        screenManager.pop();
                        break;
                    case dew.input.Actions.Y:
                        handleDelete();
                        break;
                }
            }
        }

        function handleDelete() {
            let selected = _prefabList.getSelected();
            if (!selected)
                return;

            let prefab = _prefabs[selected.index];
            screenManager.push('modal', {
                noHide: true,
                type: 0,
                title: 'Confirm Delete',
                body: `You are about to delete prefab &quot${escapeHtml(prefab.name)}&quot;`,
                onAction: ({ action }) => {
                    switch (action) {
                        case dew.input.Actions.A:
                            confirmDelete(selected.index);
                            dew.playSound('a_button');
                            screenManager.pop();
                            break;
                        case dew.input.Actions.B:
                            dew.playSound('b_button');
                            screenManager.pop();
                            break;
                    }
                }
            });
            dew.playSound('x_button');

        }

        function confirmDelete(index) {
            let prefab = _prefabs[index];
            _prefabs = null;
            _lastSelectedIndex = index;
            dew.command(`Forge.DeletePrefab "${prefab.filename}"`).then(response => {
                showToast(`Prefab \"${prefab.name}\" deleted`);
            })
            .catch(response => showToast(response.message));
        }

        function renderPrefabList() {
            let html = '';
            for (let prefab of _prefabs) {
                html += `
                <li class="item">
                    <div class="left-side">
                        <span class="item-name">${escapeHtml(prefab.name)}</span>
                        <span class="item-author">${escapeHtml(prefab.author)}</span>
                    </div>
                    <div class="right-side">
                        <span class="item-object-count">${prefab.object_count}</span>
                    </div>
                </li>`;
            }
            _prefabListElement.innerHTML = html;
        }

        function fetchPrefabs(callback) {
            if (_prefabs)
                return callback(_prefabs);

            dew.command('Forge.DumpPrefabs').then(result => {
                _prefabs = JSON.parse(result);
                callback(_prefabs);
            });
        }

        function onLegendClick(e) {
            switch (e.target.rel) {
                case 'place':
                    dew.playSound('a_button');
                    break;
                case 'back':
                    dew.playSound('b_button');
                    screenManager.pop();
                    break;
                case 'hide':
                    dew.playSound('b_button');
                    hide();
                    break;
                case 'delete':
                    handleDelete();
                    break;
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    function spawnItem(item) {

        if (_itemHistory.indexOf(item) === -1)
            _itemHistory.unshift(item);

        if (item.properties) {
            dew.callMethod('forgeaction', {
                type: 2,
                data: item.properties
            });
        }

        dew.command(`Forge.SpawnItem 0x${item.tagIndex.toString(16)}`, () => { });
        hide();
    }

    function hide() {
        _hidden = true;
        dew.hide();
    }

    function makeModalScreen() {
        let _screenElement = _containerElement.querySelector('.modal-screen');
        let _titleElement = _screenElement.querySelector('.modal-title');
        let _bodyElement = _screenElement.querySelector('.modal-body');
        let _legendElement = null;
        let _onAction = null;

        return {
            activate: function (props) {
                _titleElement.textContent = props.title;
                _bodyElement.innerHTML = props.body;
                _onAction = props.onAction;
                _screenElement.classList.add('active');

                switch (props.type) {
                    case 0:
                        _legendElement = _containerElement.querySelector('.confirm-legend');
                        break;
                }

                _legendElement.classList.remove('hidden');
                _legendElement.addEventListener('mousedown', onLegendClick);

            },
            deactivate: function (props) {
                _screenElement.classList.remove('active');

                _legendElement.classList.add('hidden');
                _legendElement.removeEventListener('mousedown', onLegendClick);
            },
            onAction: action => _onAction(action)
        }


        function onLegendClick(e) {
            switch (e.target.rel) {
                case 'confirm':
                    _onAction({ inputType: 'legend', action: dew.input.Actions.A });
                    break;
                case 'cancel':
                    _onAction({ inputType: 'legend', action: dew.input.Actions.B });
                    break;
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    function makeToolSettingsScreen(screenManager) {
        const toggleOptions = [{ label: 'Enabled', value: 1 }, { label: 'Disabled', value: 0 }]

        let _screenElement = _containerElement.querySelector('.tool-settings-screen');
        let _propertyGridElement = _screenElement.querySelector('.property-grid');
        let _legendElement = _containerElement.querySelector('.tool-settings-legend');
        let _propertyGrid = dew.makePropertyGrid(_propertyGridElement);
        let _saving = false;


        let preload = {
            'Forge.MonitorSpeed': true,
            'Forge.MonitorNoclip': true,
            'Forge.SelectionRenderer': true,
            'Forge.ShowInvisibles': true,
            'Forge.GrabDistance': true,
            'Forge.RotationSensitivity': true,
            'Forge.RotationSnap': true,
            'Forge.Magnets': true,
            'Forge.MagnetsStrength': true,
            'Forge.CloneDepth': true,
            'Forge.CloneMultiplier': true,
            'Forge.ShowWorldBounds': true
        };

        let data = {};


        function makeDewProperty(variable, label, type, meta, description) {
            return {
                label: label,
                type: type,
                getValue: () => data[variable] || 0,
                setValue: (value) => {
                    dew.command(`${variable} ${value}`);
                },
                meta: meta,
                description: description
            };
        }

        let model = _propertyGrid.createModel();
        model.group('Monitor', m => {
            m.add(makeDewProperty('Forge.MonitorSpeed', 'Monitor Speed', 'spinner', [
                { label: 'Z-Fight Fixer', value: 0 },
                { label: 'Slower', value: 1 },
                { label: 'Slow', value: 2 },
                { label: 'Normal', value: 3 },
                { label: 'Fast', value: 4 },
                { label: 'Faster', value: 5 },
                { label: 'Fastest', value: 6 }
            ]));
            m.add(makeDewProperty('Forge.MonitorNoclip', 'Noclip', 'spinner', [
                { label: 'Disabled', value: 0 },
                { label: 'Enabled', value: 1 }
            ]));


            m.add(makeDewProperty('Forge.GrabDistance', 'Grab Distance', 'range', { min: 1, max: 60, step: 0.1 }));
            m.add(makeDewProperty('Forge.RotationSensitivity', 'Rotation Sensitvity', 'range', { min: 0, max: 4, step: 0.05 }));
            m.add(makeDewProperty('Forge.RotationSnap', 'Rotation Snap', 'spinner', [
                { label: 'Off', value: 0 },
                { label: '3', value: 1 },
                { label: '5', value: 2 },
                { label: '15', value: 3 },
                { label: '30', value: 4 },
                { label: '45', value: 5 },
                { label: '90', value: 6 },
            ]));


            m.add(makeDewProperty('Forge.SelectionRenderer', 'Selection Renderer', 'spinner', [
                { label: 'Default', value: 0 },
                { label: 'Box', value: 1 }
            ]))

            m.add(makeDewProperty('Forge.ShowInvisibles', 'Show Invisibles', 'spinner', toggleOptions));

            m.add(makeDewProperty('Forge.ShowWorldBounds', 'World Bounds', 'spinner', [
                { label: 'Hidden', value: 0 },
                { label: 'Visible', value: 1 }
            ]));
        });

        model.group('Magnets', m => {
            m.add(makeDewProperty('Forge.Magnets', 'Magnets', 'spinner', toggleOptions));
            m.add(makeDewProperty('Forge.MagnetsStrength', 'Magnet Strength', 'range', { min: 0, max: 5, step: 0.01 }));
        });

        model.group('Duplicating', m => {
            m.add(makeDewProperty('Forge.CloneMultiplier', 'Multiplier', 'range', { min: 1, max: 50, step: 1, isInteger: true }));
            m.add(makeDewProperty('Forge.CloneDepth', 'Depth', 'range', { min: 0, max: 5, step: 0.01 }));
        });



        _propertyGrid.setModel(model);

        return {
            activate: function (props) {
                setTitle('Tool Settings');

                dew.getCommands().then(function (commands) {
                    for (let cmd of commands) {
                        if (preload[cmd.name]) {
                            data[cmd.name] = cmd.value;
                        }
                    }
                    _screenElement.classList.add('active');

                    _legendElement.classList.remove('hidden');
                    _legendElement.addEventListener('mousedown', onLegendClick);
                    _propertyGrid.refresh();


                }).catch(err => {
                    console.error(err);
                });

                _propertyGrid.focus();

            },
            deactivate: function () {
                _screenElement.classList.remove('active');

                _legendElement.classList.add('hidden');
                _legendElement.removeEventListener('mousedown', onLegendClick);

                _propertyGrid.blur();
            },
            onAction: function ({ action }) {
                switch (action) {
                    case dew.input.Actions.B:
                        screenManager.pop();
                        dew.playSound('b_button');
                        break;
                    case dew.input.Actions.X:
                        hide();
                        dew.playSound('b_button');
                        break;
                    case dew.input.Actions.Y:
                        saveSettings();
                        dew.playSound('a_button');
                        break;
                }
            }
        }

        function onLegendClick(e) {
            switch (e.target.rel) {
                case 'select':
                    break;
                case 'back':
                    dew.playSound('b_button');
                    screenManager.pop();
                    break;
                case 'hide':
                    dew.playSound('b_button');
                    hide();
                    break;
                case 'save_settings':
                    dew.playSound('a_button');
                    saveSettings();
                    break;
                default:
                    return;
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        function saveSettings() {
            if (_saving)
                return;

            _saving = true;
            dew.command('WriteConfig').then(response => {
                showToast('Settings Saved');
            })
                .catch(response => {
                    showToast(response.message);
                })
                .then(() => {
                    setTimeout(function () { _saving = false; }, 3500);
                });
        }

    }

    function updateObjectQuotaText() {
        dew.command('Forge.Budget', {}).then(response => {
            var quota = JSON.parse(response);
            _objectQuotaElement.innerHTML = `${quota.total_used} / ${quota.total_available}`;
        });
    }


    function setTitle(text) {
        _titleElement.innerHTML = escapeHtml(text || '');
    }

    function showToast(message) {
        dew.toast({body: `<div style="font-size: 1.2em; padding: 4px">${escapeHtml(message)}</div>`});
    }

    function buildItemsDOM(data) {
        let doc = document.implementation.createDocument(null, "root", null);
        let categories = data.paletteCategories;
        let categoryNodes = {};
        let itemsByCategory = {};
        // group items by category
        for(let item of data.palette) {
            if(!itemsByCategory[item.categoryIndex])
                itemsByCategory[item.categoryIndex] = [];
            itemsByCategory[item.categoryIndex].push(item);
        }
        // build the category nodes, attaching items at the same time
        for(let i = 0; i < categories.length; i++) {
            let category = categories[i];
            var node = categoryNodes[i] = buildCategoryDOMNode(category);
            
            if(itemsByCategory[i]) {
                for(let item of itemsByCategory[i]) {
                    let itemNode = buildPaletteEntryDOMNode(item);
                    itemNode.setAttribute('type', PALETTE_ITEM_TYPE_NAMES[item.type]);
                    node.appendChild(itemNode); 
                }
            }
        }
        // build the category hierarchy
        for(let i = 0; i < categories.length; i++) {
            let category = categories[i];
            
            if(category.parentCategoryIndex >= 0) {
                if(categoryNodes[category.parentCategoryIndex]) {
                    categoryNodes[category.parentCategoryIndex].appendChild(categoryNodes[i]);
                }
            } else {
                doc.documentElement.appendChild(categoryNodes[i]);
            }
        }

        appendAdditionalRootDOMNodes();
        return doc;

        function appendAdditionalRootDOMNodes() {
            let prefabsNode = doc.createElement('category');
            prefabsNode.setAttribute('id', 'prefabs');
            prefabsNode.setAttribute('name', 'PREFABS');

            let recentNode = doc.createElement('category');
            recentNode.setAttribute('id', 'recent');
            recentNode.setAttribute('name', 'RECENTLY USED');

            let mapOptionsNode = doc.createElement('category');
            mapOptionsNode.setAttribute('id', 'map_options');  
            mapOptionsNode.setAttribute('name', 'MAP OPTIONS');

            doc.documentElement.appendChild(prefabsNode);
            doc.documentElement.appendChild(recentNode);
            doc.documentElement.appendChild(mapOptionsNode);
        }
    
        function buildObjectPropertySetterDOMNode(setter) {
            var node = doc.createElement('setter');
            node.setAttribute('target', OBJECT_PROPERTY_TARGET_NAMES[setter.target]);
            node.setAttribute('type', setter.type);
            node.setAttribute('value', setter.value);
       
            if(setter.hidden)
                node.setAttribute('hidden', true);        
            return node;  
        }
        function buildPaletteEntryDOMNode(entry) {
            var node = doc.createElement('item');
            node.setAttribute('name', entry.name);
            node.setAttribute('tagindex', `0x${entry.tagIndex.toString(16)}`);
            if(entry.maxAllowed > 0)
                node.setAttribute('max_allowed', entry.maxAllowed);
    
            if(entry.setters) {
                for(let setter of entry.setters) {
                    node.appendChild(buildObjectPropertySetterDOMNode(setter));
                }
            }
    
            if(entry.descriptionIndex >= 0 && entry.descriptionIndex < data.descriptions.length) {
                node.appendChild(buildHelpDOMNode(data.descriptions[entry.descriptionIndex])); 
            }
    
            return node;
        } 
        function buildCategoryDOMNode(category) {
            var node = doc.createElement('category');
            node.setAttribute('name', category.name);
    
            if(category.descriptionIndex >= 0 && category.descriptionIndex < data.descriptions.length) {
                node.setAttribute('help', data.descriptions[category.descriptionIndex]); 
            }
                
            return node;
        }
        function buildHelpDOMNode(text) {
            var node = doc.createElement('help');
            var helpTextNode = doc.createTextNode(text);
            node.appendChild(helpTextNode);
            return node;
        }
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

})();