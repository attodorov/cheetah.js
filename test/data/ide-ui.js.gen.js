{
    if (!window._p) {
        window._p = {};
        window._p.__callstack = {};
    }
}
'use strict';
define('ide-ui', function (require, exports, module) {
    var __start = new Date().getTime();
    var toolboxMetadata = require('ide-toolbox');
    var autocomplete = require('ide-autocomplete');
    (function ($) {
        var __start = new Date().getTime();
        $.widget('ui.igStudio', {
            options: {
                packages: [
                    'igniteui',
                    'bootstrap'
                ],
                defaultIconPath: 'images/gear_icon.jpg',
                showResponsiveLayouts: true,
                codeToDesignRefreshInterval: 500,
                toolboxSearchDelay: 300,
                editContentDelay: 500
            },
            events: {
                componentDragging: 'componentDragging',
                componentDragged: 'componentDragged',
                componentDropping: 'componentDropping',
                componentDropped: 'componentDropped',
                componentRemoving: 'componentRemoving',
                componentRemoved: 'componentRemoved',
                componentClick: 'componentClick',
                componentDblClick: 'componentDblClick',
                codeUpdating: 'codeUpdating',
                codeUpdated: 'codeUpdated',
                designSurfaceUpdating: 'designSurfaceUpdating',
                designSurfaceUpdated: 'designSurfaceUpdated'
            },
            widget: function () {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('widget', __ms);
                }
                return this.element;
            },
            _createWidget: function (options, element) {
                var __start = new Date().getTime();
                $.Widget.prototype._createWidget.apply(this, arguments);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_createWidget', __ms);
                }
            },
            _setOption: function (key, value) {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setOption', __ms);
                }
            },
            _create: function () {
                var __start = new Date().getTime();
                this.startms = new Date().getTime();
                this._packages = {};
                this._codeProviders = {};
                this._selectedPkgs = [];
                this.maxColLength = 1000;
                this.isDesign = true;
                this.splitMode = false;
                this.componentIds = [];
                this.rootNode = {};
                this.hoveredComponent = null;
                this.selectedComponent = null;
                this.firstload = true;
                this._lastq = [];
                this._cssDeps = [];
                this._snap = true;
                this._jsDeps = [];
                this._jsDepsSrc = [];
                this._lazyLoadedScripts = [];
                this.previewWindow = null;
                this._styleBlocks = [];
                this.editor = ace.edit('editor');
                this.session = this.editor.getSession();
                this.editor.setTheme('ace/theme/monokai');
                this.session.setMode('ace/mode/html');
                var i, packageNames = this.options.packages, $this = this, BasePackageProvider = require('ide-packageproviderbase');
                toolboxMetadata.defaultToolboxIcon = this.options.defaultIconPath;
                autocomplete.init(this.editor, this);
                var loadedPackages = 0;
                var len = packageNames.length;
                $('.loading-designer-inner').text('Loading ' + packageNames[0] + ' package (1 of ' + len + ')');
                var bar = $('.progress-bar');
                window.requestAnimationFrame(function () {
                    var __start = new Date().getTime();
                    bar.css('width', '20%');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                for (i = 0; i < packageNames.length; i++) {
                    (function (i) {
                        var __start = new Date().getTime();
                        toolboxMetadata.registerPackage(packageNames[i]).then(function (packageInfo) {
                            var __start = new Date().getTime();
                            $('.loading-designer-inner').text('Loading ' + packageNames[i] + ' package (' + (i + 1) + ' of ' + len + ')');
                            var progressVal = parseInt(20 + 80 * i / packageNames.length, 10);
                            window.requestAnimationFrame(function () {
                                var __start = new Date().getTime();
                                bar.css('width', progressVal + '%');
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                            return packageInfo;
                        }).then(function (packageInfo) {
                            var __start = new Date().getTime();
                            autocomplete.registerPackage(packageInfo);
                            $this._packages[packageNames[i]] = packageInfo;
                            var packageProvider = new BasePackageProvider({
                                    ide: $this,
                                    editor: $this.editor,
                                    packageInfo: packageInfo,
                                    defaultPlugin: packageInfo.defaultComponentPlugin
                                });
                            $this._codeProviders[packageNames[i]] = packageProvider;
                            var compList = packageInfo.components;
                            for (var comp in compList) {
                                if (compList.hasOwnProperty(comp) && compList[comp] && compList[comp].componentPlugin) {
                                    (function (i, cmp, pkg, pkgProvider) {
                                        var __start = new Date().getTime();
                                        require(['../' + pkg.pluginsPath + '/' + cmp.componentPlugin], function (ComponentPlugin) {
                                            var __start = new Date().getTime();
                                            pkgProvider.registerComponent(cmp.id, ComponentPlugin);
                                            {
                                                var __ms = new Date().getTime() - __start;
                                                _putstat('anonymous', __ms);
                                            }
                                        });
                                        {
                                            var __ms = new Date().getTime() - __start;
                                            _putstat('anonymous', __ms);
                                        }
                                    }(i, compList[comp], packageInfo, packageProvider));
                                }
                            }
                            loadedPackages++;
                            if (loadedPackages === packageNames.length) {
                                $this._setupSurface();
                            }
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                        });
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    }(i));
                }
                this._setupConfirmDialog();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_create', __ms);
                }
            },
            _hideLoading: function () {
                var __start = new Date().getTime();
                $('.loading-designer').css('display', 'none');
                $('.loading-designer-inner').text('Loading Web Designer');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_hideLoading', __ms);
                }
            },
            _showLoading: function (msg) {
                var __start = new Date().getTime();
                $('.loading-designer-inner').text(msg);
                $('.loading-designer').css('display', 'block');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_showLoading', __ms);
                }
            },
            _setupSurface: function () {
                var __start = new Date().getTime();
                var $this = this, component, components, i, markup, html, itemElement, provider, packageNames = this.options.packages;
                $('.toolbox-content').css('overflow', 'auto');
                $(window).on({
                    'resize': function () {
                        var __start = new Date().getTime();
                        var minimizebtn = $('.minimize-toolbox');
                        minimizebtn.css({
                            top: 0,
                            left: $('.right').position().left - minimizebtn.width()
                        });
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('undefined', __ms);
                        }
                    }
                });
                $('.right-area,.footer').on('mousedown', function (event) {
                    var __start = new Date().getTime();
                    var target = $(event.target);
                    if (!target.hasClass('code-button') && !target.hasClass('design-button')) {
                        $this._deselectComponent();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                if (this.options.showResponsiveLayouts === true) {
                    this._setupRWDLayoutArea();
                }
                this._setupToolboxSearch();
                this._initToolboxShowHideBtns();
                $('<div></div>').prependTo('#designer').attr('id', 'dfcontainer').addClass('frame-container');
                html = this._buildInitialMarkup();
                $('<iframe></iframe>').attr('id', 'designer-frame').attr('src', 'about:blank').addClass('design-frame').addClass('frame').on('load', $.proxy(this._loadHandler, this)).prependTo('#dfcontainer').contents().find('body').addClass('design-surface');
                $('#editor_container').css({
                    position: 'absolute',
                    left: '-10000px',
                    top: '-10000px'
                });
                this.session.insert({
                    row: 0,
                    column: 0
                }, html);
                this._initRangeClass();
                this.session.setUseWrapMode(true);
                this.currentText = this.editor.getValue();
                this.parsedText = this.currentText;
                this.session.on('change', function (e) {
                    var __start = new Date().getTime();
                    if ($this.editor.isFocused()) {
                        $this.wasDirty = true;
                        clearInterval($this.updateTimer);
                        $this.updateTimer = setInterval($.proxy($this._updateSurface, $this), $this.options.codeToDesignRefreshInterval);
                        var text = $this.editor.getValue();
                        text = text.substring(text.indexOf('<body>'), text.length - 1);
                        text = text.replace('<body>', '');
                        text = text.substring(0, text.indexOf('</body>'));
                        text = text.replace('</body>', '');
                        $('#designer-frame').contents().find('body')[0].innerHTML = text;
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.left').resizable({
                    handles: 'e',
                    start: this._startFrameFix,
                    stop: this._stopFrameFix
                });
                $('.right').resizable({
                    handles: 'w',
                    resize: function (event, ui) {
                        var __start = new Date().getTime();
                        $(this).css('left', 'auto');
                        $('.surface-buttons').css('padding-right', ui.size.width);
                        var minimizebtn = $('.minimize-toolbox');
                        minimizebtn.css({
                            top: 0,
                            left: $('.right').position().left - minimizebtn.width()
                        });
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('resize', __ms);
                        }
                    },
                    start: this._startFrameFix,
                    stop: this._stopFrameFix
                });
                var toolboxmap = [];
                $('.toolbox-area').each(function () {
                    var __start = new Date().getTime();
                    var $this = $(this), cat = $this.attr('data-category');
                    var list = $('<ul></ul>').insertAfter($this).addClass('ig-layout').addClass('ig-layout-flow');
                    toolboxmap[cat] = list;
                    if (cat === 'hidden') {
                        list.css('display', 'none');
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                for (i = 0; i < packageNames.length; i++) {
                    provider = toolboxMetadata.getPackageInfo(packageNames[i]);
                    components = provider.components;
                    var spritePrefix = null;
                    if (provider.iconSpriteCssFile) {
                        spritePrefix = provider.iconSpriteCssPrefix;
                        var linkSrc = provider.iconsPath + '/' + provider.iconSpriteCssFile;
                        var linkRef = '<link rel="stylesheet" href="' + linkSrc + '" type="text/css"></link>';
                        $('head').prepend(linkRef);
                    }
                    for (component in components) {
                        if (components.hasOwnProperty(component)) {
                            if (components[component].toolboxVisible === false) {
                                continue;
                            }
                            var icon = components[component].icon;
                            var iconcss = icon.substring(0, icon.indexOf('.') !== -1 ? icon.indexOf('.') : icon.length);
                            var imgMarkup = spritePrefix ? '<div class=\'iconspr ' + spritePrefix + ' ' + iconcss + '\'></div>' : '<img class=\'toolbox-icon\' src=\'' + toolboxMetadata.resolveIcon(icon) + '\'></img>';
                            markup = '<li class=\'toolbox-item ig-layout-flow-item item-label label\' data-type=\'' + components[component].id + '\'' + ' data-lib=\'' + provider.name + '\'' + ' data-cat=\'' + components[component].category + '\'' + ' title=\'' + 'Drag and drop this to add a ' + components[component].toolboxTitle + ' to your page' + '\'>' + imgMarkup + '<h6 style=\'padding-top:5px;margin-top:0px;\' class=\'toolbox-item-label\'>' + components[component].toolboxTitle + '</h6></li>';
                            var itemContainer = toolboxmap.hidden;
                            var category = components[component].category;
                            if (toolboxmap[category] !== null && typeof toolboxmap[category] !== 'undefined') {
                                itemContainer = toolboxmap[category];
                            }
                            itemElement = $(markup).appendTo(itemContainer);
                            if (components[component].defaultOptions) {
                                itemElement.data('defaultOptions', components[component].defaultOptions);
                            } else {
                                itemElement.data('defaultOptions', {});
                            }
                            if (components[component].dataSource) {
                                itemElement.attr('data-dataSource', components[component].dataSource);
                            }
                            if (components[component].width) {
                                itemElement.attr('data-width', components[component].width);
                            }
                            if (components[component].height) {
                                itemElement.attr('data-height', components[component].height);
                            }
                            if (components[component].visual === false) {
                                itemElement.attr('data-visual', false);
                            }
                        }
                    }
                }
                for (var toolboxItem in toolboxmap) {
                    if (toolboxmap.hasOwnProperty(toolboxItem)) {
                        var toolboxUl = toolboxmap[toolboxItem];
                        if (toolboxUl.children().length === 0) {
                            $('.toolbox-area[data-category=' + toolboxItem + ']').css('display', 'none');
                        }
                    }
                }
                $('.toolbox-item, .toolbox-item-dragged').draggable({
                    helper: function (event) {
                        var __start = new Date().getTime();
                        var $this = $(this), lib = $this.attr('data-lib'), id, comp, provider;
                        provider = toolboxMetadata.getPackageInfo(lib);
                        components = provider.components;
                        id = $this.attr('data-type');
                        comp = components[id];
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('helper', __ms);
                        }
                        return $('<img></img>').attr('src', toolboxMetadata.resolveIcon(comp.dragDropIcon, comp.icon)).addClass('toolbox-item-dragged').attr('data-lib', lib).attr('data-type', comp.id).attr('data-title', comp.toolboxTitle).attr('data-width', comp.width).attr('data-height', comp.height).attr('data-visual', comp.visual).attr('data-dataSource', comp.dataSource).css('opacity', 0.5);
                    },
                    start: function (event, args) {
                        var __start = new Date().getTime();
                        var target = $(event.target), nonvisual = $('.nonvisual-area');
                        if (target.attr('data-visual') === 'false' && nonvisual.is(':hidden') && nonvisual.find('li.ig-layout-flow-item').length === 0) {
                            $('.nonvisual-area-droplabel').css('display', '');
                            $('#designer-frame').addClass('frame-nonvisual');
                            nonvisual.show('slide', { direction: 'down' }, 500);
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('start', __ms);
                        }
                    },
                    stop: function (event, args) {
                        var __start = new Date().getTime();
                        if ($('.nonvisual-area').find('li.ig-layout-flow-item').length === 0) {
                            $this._hideNonVisualArea();
                        } else {
                            $('.nonvisual-area-droplabel').css('display', 'none');
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('stop', __ms);
                        }
                    },
                    containment: '.ide',
                    appendTo: 'body',
                    revert: 'invalid',
                    cursor: 'move',
                    cursorAt: {
                        top: 0,
                        left: 0
                    },
                    iframeFix: true,
                    scroll: false
                });
                $(document).keyup(function (event) {
                    var __start = new Date().getTime();
                    if (event.keyCode === 46) {
                        var element = $('#designer-frame').contents().find('body .selected-iframe');
                        if (element.length === 0) {
                            element = $('.nonvisual-list').children('.selected-iframe');
                        }
                        $this._removeComponent(element[0]);
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('body').mousedown(function (event) {
                    var __start = new Date().getTime();
                    $('.contextmenu').css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.center').droppable({
                    accept: '.toolbox-item[data-visual!=false]',
                    drop: function (event, ui) {
                        var __start = new Date().getTime();
                        var body = $('#designer-frame').contents().find('body'), i, arr, r, t, codeProvider, markers, placeholder, totalComponentCount, id, height, extraIndent = 1, title, width, data, options, lib, inside = false, insideOffset = null, defaultOptions, code, descriptor, droppable, insideOffsetCount = 0, codeRange, htmlRange, htmlCode, codeMarker, htmlMarker, droppables, pkg, cmp;
                        var dropDefault = function (container, element) {
                            var __start = new Date().getTime();
                            if (container && $(container).is('div')) {
                                element.insertAfter(container);
                            } else {
                                element.appendTo(body);
                            }
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('dropDefault', __ms);
                            }
                        };
                        var el = $('#designer-frame').contents()[0].elementFromPoint(ui.position.left, ui.position.top);
                        var $compElement = $(el);
                        var comp = null, hostCodeProvider;
                        if (!$compElement.hasClass('ig-component')) {
                            if ($compElement.attr('data-droppablechild') !== 'true') {
                                $compElement = $compElement.closest('.ig-component');
                                el = $compElement[0];
                            } else {
                                el = $compElement.closest('.ig-component')[0];
                            }
                        }
                        if ($compElement.is('body') && $this.componentIds.length > 0) {
                            comp = $this.componentIds[$this.componentIds.length - 1];
                        } else {
                            if (el) {
                                comp = $this.componentById(el.id);
                                hostCodeProvider = $this._codeProviders[comp.lib];
                            }
                            if (comp === null) {
                                comp = $this.componentIds[$this.componentIds.length - 1];
                            }
                        }
                        t = ui.helper.attr('data-type');
                        lib = ui.helper.attr('data-lib');
                        codeProvider = $this._codeProviders[lib];
                        totalComponentCount = $this._getComponentCount(t);
                        totalComponentCount++;
                        while ($('#designer-frame').contents()[0].getElementById(t + totalComponentCount)) {
                            totalComponentCount++;
                        }
                        id = t + totalComponentCount;
                        height = ui.helper.attr('data-height');
                        title = ui.helper.attr('data-title');
                        width = ui.helper.attr('data-width');
                        data = ui.helper.attr('data-dataSource');
                        descriptor = {
                            type: t,
                            id: id,
                            data: data,
                            ide: $this,
                            attrs: {}
                        };
                        pkg = $this._packages[lib];
                        if (pkg) {
                            cmp = pkg.components[t];
                            if (cmp) {
                                $this._promiseCmp = cmp.loadInfo();
                            }
                        }
                        $this._addDesignerDependency(codeProvider.getHeadMarkupFor(descriptor));
                        placeholder = $(codeProvider.getMarkupFor(descriptor));
                        if (hostCodeProvider && hostCodeProvider.isDroppableChild($compElement[0])) {
                            droppable = $compElement;
                            inside = true;
                            insideOffset = $compElement.index();
                        } else if (hostCodeProvider && hostCodeProvider.hasDroppableChildren($compElement[0])) {
                            droppables = hostCodeProvider.getDroppableChildren($compElement[0]);
                            $.each(droppables, function () {
                                var __start = new Date().getTime();
                                var $this = $(this), pos = $this.position(), left = pos.left, top = pos.top, mleft = ui.position.left, mtop = ui.position.top, width = $this.width(), height = $this.height();
                                if (mleft > left && mleft < left + width && (mtop > top && mtop < top + height)) {
                                    droppable = $this;
                                    inside = true;
                                    insideOffset = insideOffsetCount;
                                    {
                                        var __ms = new Date().getTime() - __start;
                                        _putstat('anonymous', __ms);
                                    }
                                    return false;
                                }
                                insideOffsetCount++;
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                        }
                        var lastElem = null;
                        var elemsList = body.children();
                        for (i = elemsList.length - 1; i >= 0; i--) {
                            if ($(elemsList[i]).data('marker')) {
                                lastElem = $(elemsList[i]);
                                break;
                            }
                        }
                        if (droppable) {
                            placeholder.appendTo(droppable);
                        } else {
                            dropDefault(el, placeholder);
                        }
                        placeholder.attr({
                            'id': id,
                            'data-lib': lib,
                            'data-type': t,
                            'data-title': title
                        });
                        placeholder.addClass('ig-component');
                        options = {
                            height: height,
                            width: width,
                            id: id,
                            type: t,
                            lib: lib
                        };
                        if (data && window[data]) {
                            options.dataSource = window[data];
                        }
                        defaultOptions = $('li[data-type=' + t + ']').data('defaultOptions');
                        for (var key in defaultOptions) {
                            if (defaultOptions.hasOwnProperty(key) && defaultOptions[key] instanceof Array) {
                                for (var p = 0; p < defaultOptions[key].length; p++) {
                                    if (defaultOptions[key][p].hasOwnProperty('dataSource') && window[defaultOptions[key][p].dataSource]) {
                                        defaultOptions[key][p].dataSourceVal = defaultOptions[key][p].dataSource;
                                        defaultOptions[key][p].dataSource = window[defaultOptions[key][p].dataSource];
                                    }
                                }
                            }
                        }
                        options = $.extend({
                            width: options.width,
                            height: options.height,
                            dataSource: options.dataSource
                        }, defaultOptions);
                        descriptor.placeholder = placeholder;
                        descriptor.options = options;
                        var needsLazyLoad = $this._needsLazyLoad(codeProvider, t);
                        if (needsLazyLoad) {
                            $this._showLoading('Loading ' + t + ' dependencies');
                        }
                        var initDelayed = function () {
                            var __start = new Date().getTime();
                            if (codeProvider.requiresInitialization()) {
                                $this._ensureDependenciesLoaded(codeProvider, t, function () {
                                    var __start = new Date().getTime();
                                    codeProvider.initComponent(descriptor);
                                    if (needsLazyLoad) {
                                        if (placeholder) {
                                            $this._selectComponent(placeholder[0]);
                                        }
                                        $this._hideLoading();
                                    }
                                    {
                                        var __ms = new Date().getTime() - __start;
                                        _putstat('anonymous', __ms);
                                    }
                                });
                                code = codeProvider.getCodeEditorScriptFor(descriptor);
                                if (code && code.codeString) {
                                    if (!code.lineCount) {
                                        code.lineCount = code.codeString.split('\n');
                                    }
                                    var offset = 0;
                                    if ($this.componentIds.length > 0 && comp && comp.codeMarker && !inside) {
                                        codeRange = comp.codeMarker.range;
                                        offset = codeRange.end.row;
                                    } else {
                                        codeRange = $this.editor.find('<script id="code">\n');
                                        offset = codeRange.end.row + 1;
                                    }
                                    $this.session.insert({
                                        row: offset,
                                        column: codeRange.end.column + 1
                                    }, code.codeString);
                                    r = $this.createAndAddMarker(offset, 0, offset + code.lineCount, 0);
                                    codeMarker = {
                                        range: r,
                                        extraMarkers: {},
                                        baseIndent: 4
                                    };
                                    codeProvider.addExtraMarkers({
                                        marker: codeMarker,
                                        codeObj: code,
                                        type: t,
                                        rclass: $this.RangeClass
                                    });
                                    codeMarker.id = r.id;
                                }
                            }
                            var hasVisualComponents = false;
                            for (i = 0; i < $this.componentIds.length; i++) {
                                if ($this.componentIds[i].visual) {
                                    hasVisualComponents = true;
                                    break;
                                }
                            }
                            if (!hasVisualComponents) {
                                htmlRange = $this.editor.find('<body>');
                                htmlRange.end.row++;
                                htmlRange.end.column = 0;
                            } else if (comp.visual) {
                                htmlRange = comp.htmlMarker.range;
                                if (inside) {
                                    extraIndent += comp.level > 0 ? comp.level : 0;
                                    if (insideOffset !== null) {
                                        htmlRange = comp.htmlMarker.extraMarkers.children[insideOffset];
                                        extraIndent++;
                                        htmlRange = new htmlRange.constructor(htmlRange.end.row - 1, 0, htmlRange.end.row - 1, 0);
                                    } else {
                                        htmlRange = new htmlRange.constructor(htmlRange.end.row - 1, 0, htmlRange.end.row - 1, 0);
                                    }
                                } else {
                                    if (lastElem.length > 0) {
                                        var lastMarker = lastElem.data('marker');
                                        htmlRange = new htmlRange.constructor(lastMarker.end.row + 1, 0, lastMarker.end.row + 1, 0);
                                    } else {
                                        htmlRange = new htmlRange.constructor(htmlRange.end.row, 0, htmlRange.end.row, 0);
                                    }
                                }
                            }
                            descriptor.extraIndent = extraIndent;
                            htmlCode = codeProvider.getCodeEditorMarkupFor(descriptor);
                            if (htmlCode) {
                                $this.session.insert({
                                    row: htmlRange.end.row,
                                    column: htmlRange.end.column + 1
                                }, htmlCode.codeString);
                                r = new $this.RangeClass(htmlRange.end.row, 0, htmlRange.end.row + htmlCode.lineCount, 0);
                                r.start = $this.session.doc.createAnchor(r.start);
                                r.end = $this.session.doc.createAnchor(r.end);
                                var classResult, idResult;
                                if (htmlCode.codeString.indexOf('class=') !== -1) {
                                    classResult = $this.editor.find({
                                        needle: /class="(.*)?"/,
                                        start: r.start
                                    });
                                }
                                if (htmlCode.codeString.indexOf('id=') !== -1) {
                                    idResult = $this.editor.find({
                                        needle: /id="(.*)?"/,
                                        start: r.start
                                    });
                                }
                                if (classResult) {
                                    classResult = new $this.RangeClass(classResult.start.row, classResult.start.column, classResult.end.row, classResult.end.column - 1);
                                    $this.addMarker(classResult);
                                }
                                if (idResult) {
                                    idResult = new $this.RangeClass(idResult.start.row, idResult.start.column, idResult.end.row, idResult.end.column - 1);
                                    $this.addMarker(idResult);
                                }
                                htmlMarker = {
                                    range: r,
                                    extraMarkers: {
                                        classMarker: classResult,
                                        idMarker: idResult
                                    }
                                };
                                if (htmlCode.extraMarkers && Array.isArray(htmlCode.extraMarkers)) {
                                    arr = htmlCode.extraMarkers;
                                    markers = [];
                                    for (i = 0; i < arr.length; i++) {
                                        var marker = new $this.RangeClass(r.start.row + arr[i].rowOffset, r.start.column + arr[i].colOffset, r.start.row + arr[i].rowOffset + arr[i].rowCount, r.start.column + arr[i].colOffset + arr[i].colCount);
                                        marker.start = $this.session.doc.createAnchor(marker.start);
                                        marker.end = $this.session.doc.createAnchor(marker.end);
                                        markers.push(marker);
                                    }
                                    htmlMarker.extraMarkers.children = markers;
                                }
                                htmlMarker.id = $this.session.addMarker(r, 'customMarker', 'text', true);
                            }
                            var headCode = codeProvider.getCodeEditorHeadMarkupFor(descriptor);
                            var headMarker = null;
                            if (headCode) {
                                var headRange = $this.editor.find('</head>');
                                $this.session.insert({
                                    row: headRange.end.row,
                                    column: 0
                                }, headCode.codeString);
                                headMarker = new $this.RangeClass(headRange.end.row, 0, headRange.end.row + headCode.lineCount, 0);
                                headMarker.start = $this.session.doc.createAnchor(headMarker.start);
                                headMarker.end = $this.session.doc.createAnchor(headMarker.end);
                                headMarker.id = $this.session.addMarker(headMarker, 'customMarker', 'text', true);
                            }
                            $this.componentIds.push({
                                id: id,
                                lib: lib,
                                title: title,
                                type: t,
                                visual: true,
                                providerType: codeProvider.getProviderType(t),
                                codeMarker: codeMarker,
                                htmlMarker: htmlMarker,
                                headMarker: headMarker,
                                level: extraIndent > 0 ? extraIndent : 0
                            });
                            if (descriptor.options) {
                                $this.componentIds[$this.componentIds.length - 1].options = descriptor.options;
                            }
                            $this._syncDesigner();
                            if (!needsLazyLoad && placeholder) {
                                $this._selectComponent(placeholder[0]);
                            }
                            $this._initddreoder();
                            ga('send', 'event', 'dragdrop', 'dragging and droppping from the toolbox', lib + ':' + t, $this._getComponentCount(t));
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('initDelayed', __ms);
                            }
                        };
                        if ($this._promiseCmp) {
                            $this._promiseCmp.then(function () {
                                var __start = new Date().getTime();
                                initDelayed();
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                        } else {
                            initDelayed();
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('drop', __ms);
                        }
                    }
                });
                $('.code-button').click(function () {
                    var __start = new Date().getTime();
                    var button = $(this);
                    if ($this.splitMode) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    }
                    if (button.hasClass('selected')) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    } else {
                        $this._adorners.css('display', 'none');
                        button.addClass('selected');
                        $('.design-button').removeClass('selected');
                        $('.view-button').removeClass('selected');
                        $this.isDesign = false;
                        $('.prop-tooltip').css('display', 'none');
                        $('.designer').hide();
                        $('#editor_container').css({
                            position: 'static',
                            left: '',
                            top: ''
                        });
                        $this.editor.focus();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.design-button').click(function () {
                    var __start = new Date().getTime();
                    var button = $(this);
                    if (button.hasClass('selected')) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    } else {
                        if ($this._adorners.css('display') === 'none') {
                            $this._adorners.css('display', 'block');
                        }
                        button.addClass('selected');
                        $('.code-button').removeClass('selected');
                        $('.view-button').removeClass('selected');
                        $this.editor.blur();
                        if (!$this.splitMode) {
                            $('#editor_container').css({
                                position: 'absolute',
                                left: '-10000px',
                                top: '-10000px'
                            });
                        }
                        $this._findChanges();
                        $this.wasDirty = false;
                        $('.designer').show();
                        $this.isDesign = true;
                        $('#designer-frame').addClass('design-frame');
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.preview-button').click(function () {
                    var __start = new Date().getTime();
                    if (!$this.previewWindow || $this.previewWindow.closed) {
                        var width = parseInt(window.innerWidth * 0.8, 10);
                        var height = parseInt(window.innerHeight * 0.8, 10);
                        $this.previewWindow = window.open('', '_blank', 'width=' + width + ',height=' + height);
                        $this.previewWindow.document.open();
                        $this._previewCode = $this.editor.getValue();
                        $this.previewWindow.document.write($this.editor.getValue());
                        $this.previewWindow.document.close();
                        $this.previewWindow.document.title = 'Web Designer Preview';
                        if (!$this._refreshPreviewTimerID) {
                            $this._refreshPreviewTimerID = setInterval($.proxy($this._refreshPreview, $this), 2000);
                        }
                    } else {
                        $this._refreshPreview();
                        $this.previewWindow.focus();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                this.session.on('change', function (e) {
                    var __start = new Date().getTime();
                    if ($this.isDesign && !$this.splitMode) {
                        $this.currentText = $this.editor.getValue();
                    } else if (e.data.action === 'removeText') {
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $this.updateTimer = setInterval($.proxy($this._updateSurface, $this), $this.options.codeToDesignRefreshInterval);
                var designLayer = $('<div></div>').appendTo('#dfcontainer').css('overflow', 'hidden');
                $('<div></div>').appendTo(designLayer).addClass('hovered-component').css('display', 'none');
                var selectedComponent = $('<div></div>').appendTo(designLayer).addClass('selected-component').css('display', 'none');
                var nonvisArea = $('<div></div>').appendTo('#dfcontainer').addClass('nonvisual-area').css('display', 'none');
                $('<label>Drop Here</label>').appendTo(nonvisArea).addClass('nonvisual-area-droplabel');
                $('.nonvisual-area').droppable({
                    accept: '.toolbox-item[data-visual=false]',
                    hoverClass: 'nonvisual-area-hover',
                    activeClass: 'nonvisual-area-active',
                    drop: function (event, ui) {
                        var __start = new Date().getTime();
                        var t, lib, codeProvider, totalComponentCount, id, code, descriptor, pkg, cmp, codeRange, r, codeMarker, title;
                        var area = $('.nonvisual-area'), list = area.find('ul');
                        if (list.length === 0) {
                            list = $('<ul></ul>').appendTo(area).addClass('nonvisual-list ig-layout ig-layout-flow');
                            list.on('click', '.nonvisual-item', function (event) {
                                var __start = new Date().getTime();
                                $this._selectFrameworkComponent($(event.target));
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                            list.on('contextmenu', function (event) {
                                var __start = new Date().getTime();
                                $this._contextComponent = event.target;
                                $('.context-menu').css({
                                    display: 'block',
                                    left: event.pageX + 2,
                                    top: event.pageY + 2
                                });
                                event.preventDefault();
                                event.stopPropagation();
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                        }
                        var item = $('<li></li>').appendTo(list).addClass('ig-layout-flow-item btn nonvisual-item ig-component');
                        var defaultOptions = $('li[data-type=' + t + ']').data('defaultOptions');
                        var options = $.extend({
                                id: id,
                                type: t,
                                lib: lib
                            }, defaultOptions);
                        t = ui.helper.attr('data-type');
                        lib = ui.helper.attr('data-lib');
                        codeProvider = $this._codeProviders[lib];
                        totalComponentCount = $this._getComponentCount(t);
                        totalComponentCount++;
                        while ($('#designer-frame').contents()[0].getElementById(t + totalComponentCount)) {
                            totalComponentCount++;
                        }
                        id = t + totalComponentCount;
                        item.text(id).attr('data-title', id);
                        title = id;
                        descriptor = {
                            type: t,
                            id: id
                        };
                        pkg = $this._packages[lib];
                        if (pkg) {
                            cmp = pkg.components[t];
                            if (cmp) {
                                $this._promiseCmp = cmp.loadInfo();
                            }
                        }
                        var needsLazyLoad = $this._needsLazyLoad(codeProvider, t);
                        if (needsLazyLoad) {
                            $this._showLoading('Loading ' + t + ' dependencies');
                        }
                        descriptor.options = options;
                        var initDelayed = function () {
                            var __start = new Date().getTime();
                            $this._ensureDependenciesLoaded(codeProvider, t, function () {
                                var __start = new Date().getTime();
                                codeProvider.initComponent(descriptor);
                                if (needsLazyLoad) {
                                    if (placeholder) {
                                        $this._selectFrameworkComponent(item);
                                    }
                                    $this._hideLoading();
                                }
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                            code = codeProvider.getCodeEditorScriptFor(descriptor);
                            if (code && code.codeString) {
                                if (!code.lineCount) {
                                    code.lineCount = code.codeString.split('\n');
                                }
                                var offset = 0;
                                if ($this.componentIds.length > 0) {
                                    for (var i = 0; i < $this.componentIds.length; i++) {
                                        if ($this.componentIds[i].codeMarker) {
                                            codeRange = $this.componentIds[i].codeMarker.range;
                                            offset = codeRange.end.row;
                                            break;
                                        }
                                    }
                                }
                                if (!codeRange) {
                                    codeRange = $this.editor.find('<script id="code">\n');
                                    offset = codeRange.end.row + 1;
                                }
                                $this.session.insert({
                                    row: offset,
                                    column: 0
                                }, code.codeString);
                                r = $this.createAndAddMarker(offset, 0, offset + code.lineCount, 0);
                                codeMarker = {
                                    range: r,
                                    extraMarkers: {},
                                    baseIndent: 4
                                };
                                codeProvider.addExtraMarkers({
                                    marker: codeMarker,
                                    codeObj: code,
                                    type: t,
                                    rclass: $this.RangeClass
                                });
                                codeMarker.id = r.id;
                            }
                            item.attr({
                                'id': id,
                                'data-lib': lib,
                                'data-type': t,
                                'data-title': title
                            });
                            $this.componentIds.push({
                                id: id,
                                lib: lib,
                                title: title,
                                type: t,
                                visual: false,
                                providerType: codeProvider.getProviderType(t),
                                codeMarker: codeMarker
                            });
                            if (descriptor.options) {
                                $this.componentIds[$this.componentIds.length - 1].options = descriptor.options;
                            }
                            $this._syncDesigner();
                            if (!needsLazyLoad) {
                                $this._selectFrameworkComponent(item);
                            }
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('initDelayed', __ms);
                            }
                        };
                        if ($this._promiseCmp) {
                            $this._promiseCmp.then(function () {
                                var __start = new Date().getTime();
                                initDelayed();
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                        } else {
                            initDelayed();
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('drop', __ms);
                        }
                    }
                });
                $('<div></div>').appendTo(selectedComponent).css({
                    position: 'relative',
                    width: '100%',
                    height: '100%'
                });
                $('<div></div>').appendTo('#dfcontainer').addClass('tag-placeholder');
                var adorners = $('<div></div>').appendTo('body').addClass('adorners');
                adorners.css({
                    position: 'absolute',
                    top: -10000,
                    left: -10000
                });
                this._addDefaultAdorners(adorners);
                $('.right-area > .nano').nanoScroller();
                this._setupInspector();
                this._setupMenu();
                var elemsTree = $('.elements');
                var toolboxContainer = $('.toolbox-container');
                var container = $('.elements-container');
                var searchAndElementsHeight = parseInt($('.toolbox-search').height(), 10);
                searchAndElementsHeight += parseInt(elemsTree.height(), 10);
                toolboxContainer.css('height', 'calc(\'100%-' + searchAndElementsHeight + 'px\')');
                this._initialToolboxHeight = toolboxContainer.height();
                var rightArea = $('.right-area');
                var newPadding = parseInt(rightArea.css('padding-bottom'), 10) + parseInt(rightArea.css('border-bottom-width'), 10) + parseInt(elemsTree.outerHeight(), 10) + parseInt(elemsTree.css('border-top-width'), 10) * 2;
                rightArea.css('padding-bottom', newPadding);
                this._initialPadding = newPadding;
                elemsTree.find('.elements-label').click(function (event) {
                    var __start = new Date().getTime();
                    if (container.is(':visible')) {
                        $this._hideElementsTree();
                    } else {
                        $this._showElementsTree();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.context-menu li').on('click', function (e) {
                    var __start = new Date().getTime();
                    if (!$this._contextComponent) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    }
                    if ($(this).attr('data-action') === 'remove') {
                        $this._removeComponent($this._contextComponent);
                    }
                    $('.context-menu').css('display', 'none');
                    e.preventDefault();
                    e.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupSurface', __ms);
                }
            },
            _clearDragFn: function () {
                var __start = new Date().getTime();
                if (this._isDragging) {
                    this._isDragging = false;
                    this._dragClone = null;
                    if ($('.drag-clone').length > 0) {
                        $('.drag-clone').remove();
                    }
                    this._draggedElement = null;
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_clearDragFn', __ms);
                }
            },
            _endDragFn: function (el) {
                var __start = new Date().getTime();
                this._isMouseDown = false;
                if (this._isDragging) {
                    this._isDragging = false;
                    this._dragClone = null;
                    if (this._adornersHidden === true) {
                        this._restoreAdorners();
                    }
                    if ($('.drag-clone').length > 0) {
                        $('.drag-clone').remove();
                    }
                    var $el, comp;
                    el = this._resolveElement(el);
                    $el = $(el);
                    if (el && this._draggedElement) {
                        var draggedEl = $(this._draggedElement);
                        var draggedMarker = draggedEl.data('marker');
                        if (draggedEl.hasClass('ig-component')) {
                            comp = this._findComponent(draggedEl);
                            draggedMarker = comp.htmlMarker.range;
                        }
                        var targetMarker = $(el).data('marker');
                        draggedEl.insertAfter(el);
                        this._selectComponent(this._draggedElement);
                        var rows = draggedMarker.end.row - draggedMarker.start.row;
                        this.session.moveText(draggedMarker, {
                            row: targetMarker.end.row + 1,
                            column: 0
                        });
                        var endCol = targetMarker.end.row + 1;
                        var newMarker = new this.RangeClass(endCol, 0, endCol + rows, 0);
                        this.addMarker(newMarker);
                        if (comp) {
                            this.session.removeMarker(comp.htmlMarker.id);
                            comp.htmlMarker.range = newMarker;
                            comp.htmlMarker.id = newMarker.id;
                        } else {
                            draggedEl.data('marker', newMarker);
                        }
                        this._refreshAll();
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_endDragFn', __ms);
                }
            },
            _hideNonVisualArea: function () {
                var __start = new Date().getTime();
                $('.nonvisual-area').hide('slide', { direction: 'down' }, 500, function () {
                    var __start = new Date().getTime();
                    $('#designer-frame').removeClass('frame-nonvisual');
                    $('.nonvisual-area-droplabel').css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_hideNonVisualArea', __ms);
                }
            },
            _processFileDependencies: function (provider, deps, fileType) {
                var __start = new Date().getTime();
                if (!provider) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_processFileDependencies', __ms);
                    }
                    return [];
                }
                if (!Array.isArray(deps)) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_processFileDependencies', __ms);
                    }
                    return [];
                }
                var processedDeps = new Array(deps.length);
                for (var i = 0; i < deps.length; i++) {
                    var dep = typeof deps[i] === 'string' ? deps[i] : deps[i].url;
                    if (dep && typeof dep === 'string') {
                        if (dep.indexOf('<script') !== -1 || dep.indexOf('<link') !== -1) {
                            processedDeps[i] = deps[i];
                            continue;
                        }
                        switch (fileType.toLowerCase()) {
                        case 'stylesheet':
                            if (dep !== deps[i]) {
                                processedDeps[i] = {
                                    url: '<link rel="stylesheet" href="' + dep + '">',
                                    lazyLoad: deps[i].lazyLoad,
                                    id: deps[i].id
                                };
                            } else {
                                processedDeps[i] = '<link rel="stylesheet" href="' + deps[i] + '">';
                            }
                            break;
                        case 'script':
                            if (dep !== deps[i]) {
                                processedDeps[i] = {
                                    url: '<script src="' + dep + '"></script>',
                                    lazyLoad: deps[i].lazyLoad,
                                    id: deps[i].id
                                };
                            } else {
                                processedDeps[i] = '<script src="' + deps[i] + '"></script>';
                            }
                            break;
                        default:
                            console.error('Uknown fileType \'' + fileType + '\' in processFileDependencies for \'' + provider + '\'. Expected types are \'style\' for CSS or \'script\' for JS.');
                        }
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_processFileDependencies', __ms);
                }
                return processedDeps;
            },
            _addDesignerDependency: function (dep) {
                var __start = new Date().getTime();
                if (dep) {
                    var frameHead = $('#designer-frame').contents().find('head');
                    if (!frameHead.length) {
                        console.error('Could not find designer frame head element.');
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('_addDesignerDependency', __ms);
                        }
                        return;
                    }
                    dep.each(function () {
                        var __start = new Date().getTime();
                        var alreadyExists = false, current = $(this);
                        switch (current.prop('tagName')) {
                        case 'LINK':
                            alreadyExists = frameHead.find('link[href="' + current.attr('href') + '"]').length;
                            break;
                        case 'SCRIPT':
                            alreadyExists = frameHead.find('script[src="' + current.attr('href') + '"]').length;
                            break;
                        }
                        if (!alreadyExists) {
                            current.attr('async', '');
                            frameHead.append(current);
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_addDesignerDependency', __ms);
                }
            },
            _needsLazyLoad: function (codeProvider, componentType) {
                var __start = new Date().getTime();
                var pkgScriptDeps = codeProvider.settings.packageInfo.scripts;
                var component = codeProvider.settings.packageInfo.components[componentType];
                var deps = component.dependsOn;
                var i, j;
                for (i = 0; i < pkgScriptDeps.length; i++) {
                    if (pkgScriptDeps[i].lazyLoad === true && !this._lazyLoadedScripts[pkgScriptDeps[i].id]) {
                        for (j = 0; deps && j < deps.length; j++) {
                            if (deps[j] === pkgScriptDeps[i].id) {
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('_needsLazyLoad', __ms);
                                }
                                return true;
                            }
                        }
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_needsLazyLoad', __ms);
                }
                return false;
            },
            _ensureDependenciesLoaded: function (codeProvider, componentType, callback) {
                var __start = new Date().getTime();
                var component = codeProvider.settings.packageInfo.components[componentType];
                var pkgScriptDeps = codeProvider.settings.packageInfo.scripts;
                var i, j, allLoaded = true;
                var deps = component.dependsOn;
                var that = this;
                allLoaded = !this._needsLazyLoad(codeProvider, componentType);
                if (allLoaded) {
                    callback();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_ensureDependenciesLoaded', __ms);
                    }
                    return;
                }
                var combinedCallback = function (data) {
                    var __start = new Date().getTime();
                    var allLoaded = true;
                    for (var i = 0; i < deps.length; i++) {
                        if (!that._lazyLoadedScripts[deps[i]] || !that._lazyLoadedScripts[deps[i]] === deps[i].url) {
                            allLoaded = false;
                        }
                    }
                    if (allLoaded) {
                        callback();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('combinedCallback', __ms);
                    }
                };
                var meta = null, loaded = false;
                if (deps && deps.length) {
                    loaded = false;
                    for (i = 0; i < deps.length; i++) {
                        if (!this._lazyLoadedScripts[deps[i]]) {
                            for (j = 0; j < pkgScriptDeps.length; j++) {
                                if (pkgScriptDeps[j].id && pkgScriptDeps[j].id === deps[i]) {
                                    if (!pkgScriptDeps[j].lazyLoad) {
                                        loaded = true;
                                    } else {
                                        meta = pkgScriptDeps[j];
                                    }
                                    break;
                                }
                            }
                            if (!loaded && meta) {
                                this._loadScript(meta.url, meta, combinedCallback);
                                this._addDesignerScriptRef(meta.url);
                            }
                        }
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_ensureDependenciesLoaded', __ms);
                }
            },
            _addDesignerScriptRef: function (url) {
                var __start = new Date().getTime();
                var codeRange = this.editor.find('<script id="code">\n');
                var urlRef = '\t\t<script src="' + url + '"></script>\n';
                this.session.insert({
                    row: codeRange.start.row - 1,
                    column: 0
                }, urlRef);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_addDesignerScriptRef', __ms);
                }
            },
            _loadScript: function (url, meta, callback) {
                var __start = new Date().getTime();
                var frame = document.getElementById('designer-frame');
                var script = frame.contentWindow.document.createElement('script');
                script.type = 'text/javascript';
                script.src = url;
                script.async = '';
                if (callback) {
                    script.onload = callback;
                }
                frame.contentWindow.document.head.appendChild(script);
                if (meta) {
                    this._lazyLoadedScripts[meta.id] = url;
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_loadScript', __ms);
                }
            },
            _buildInitialMarkup: function () {
                var __start = new Date().getTime();
                var cssString = '';
                var jsString = '';
                var cssDep = [];
                var jsDep = [];
                var jsDepSrc = [];
                var i, html;
                for (var provider in this._codeProviders) {
                    if (this._codeProviders.hasOwnProperty(provider)) {
                        $.merge(cssDep, this._processFileDependencies(this._codeProviders[provider], this._codeProviders[provider].getStyleDependencies(), 'stylesheet'));
                        $.merge(jsDep, this._processFileDependencies(this._codeProviders[provider], this._codeProviders[provider].getScriptDependencies(), 'script'));
                        $.merge(jsDepSrc, this._codeProviders[provider].getScriptDependencies());
                    }
                }
                for (i = 0; i < cssDep.length; i++) {
                    this._cssDeps.push(cssDep[i]);
                    cssString += '\t\t' + cssDep[i] + '\n';
                }
                var dsDep = '<script src="js/datasources.js"></script>';
                this._jsDepsSrc.push('js/datasources.js');
                for (i = 0; i < jsDep.length; i++) {
                    this._jsDeps.push(jsDep[i]);
                    this._jsDepsSrc.push(jsDepSrc[i]);
                    if (typeof jsDep[i] === 'string') {
                        jsString += '\t\t' + jsDep[i] + '\n';
                    } else if (typeof jsDep[i] === 'object' && !jsDep[i].lazyLoad) {
                        jsString += '\t\t' + jsDep[i].url + '\n';
                    }
                }
                html = '<!DOCTYPE html>\n' + '<html>\n' + '\t<head>\n' + '\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' + cssString + jsString + '\t\t' + dsDep + '\n' + '\t\t<script id="code">\n' + '\t\t\t$(document).ready(function () {\n\n' + '\t\t\t});\n' + '\t\t</script>\n' + '\t</head>\n' + '\t<body>\n\n' + '\t</body>\n' + '</html>';
                this._initialCode = html;
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_buildInitialMarkup', __ms);
                }
                return html;
            },
            _refreshPreview: function () {
                var __start = new Date().getTime();
                var currentCode = this.editor.getValue();
                var previewCode = this._previewCode;
                if (this.previewWindow && !this.previewWindow.closed && previewCode !== currentCode) {
                    this._previewCode = currentCode;
                    this.previewWindow.document.open();
                    this.previewWindow.document.write(currentCode);
                    this.previewWindow.document.close();
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_refreshPreview', __ms);
                }
            },
            _resolveElement: function (e) {
                var __start = new Date().getTime();
                if (!e) {
                    throw new Error('element is not defined - cannot resolve.');
                }
                if (e && (e.tagName && (e.tagName.toLowerCase() === 'document' || e.tagName.toLowerCase() === 'body') || typeof e.tagName === 'undefined')) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_resolveElement', __ms);
                    }
                    return null;
                }
                var $e = $(e), knownComponent = $e.closest('.ig-component'), provider, desc;
                if (knownComponent.length === 0) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_resolveElement', __ms);
                    }
                    return e;
                } else {
                    provider = this._codeProviders[knownComponent.attr('data-lib')];
                    desc = {
                        type: knownComponent.attr('data-type'),
                        element: $e
                    };
                    if (provider.isContainer(desc)) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('_resolveElement', __ms);
                        }
                        return e;
                    } else {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('_resolveElement', __ms);
                        }
                        return knownComponent[0];
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_resolveElement', __ms);
                }
            },
            _hoverComponent: function (event, element) {
                var __start = new Date().getTime();
                var hbox = $('.hovered-component'), $element = $(element), tag = $('.tag-placeholder'), offset;
                var frame = $('#designer-frame');
                var mleft = parseInt(frame.css('margin-left'), 10);
                var pad;
                if (frame.hasClass('design-frame')) {
                    if (this.hoveredComponent === null || element !== this.hoveredComponent) {
                        offset = $element.offset();
                        pad = parseInt(frame.css('padding-left'), 10);
                        var owidth = $element.outerWidth();
                        var oheight = $element.outerHeight();
                        hbox.css({
                            width: owidth,
                            height: oheight,
                            left: offset.left + mleft + pad,
                            top: offset.top,
                            display: 'block'
                        });
                        tag.css({
                            left: offset.left + mleft + pad,
                            top: offset.top - tag.outerHeight(),
                            display: 'block'
                        });
                        if ($element.attr('data-type')) {
                            tag.text($element.attr('data-type'));
                        } else if (element && element.nodeName) {
                            tag.text(element.nodeName);
                        }
                        this.hoveredComponent = element;
                        if (event) {
                            event.stopPropagation();
                        }
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_hoverComponent', __ms);
                }
            },
            _syncDesigner: function () {
                var __start = new Date().getTime();
                this.currentText = this.editor.getValue();
                this.parsedText = this.currentText;
                this._parseCode(this.currentText);
                if (this.rootNode.children) {
                    this._linkTrees(this.rootNode, $('#designer-frame').contents().children().get(0));
                    this._rebuildDesignerNavTree();
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_syncDesigner', __ms);
                }
            },
            _getComponentCount: function (t) {
                var __start = new Date().getTime();
                var count = 0;
                for (var i = 0; i < this.componentIds.length; i++) {
                    if (this.componentIds[i].type === t) {
                        count++;
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_getComponentCount', __ms);
                }
                return count;
            },
            _selectFrameworkComponent: function (element) {
                var __start = new Date().getTime();
                this._selectComponent(element, true, false);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_selectFrameworkComponent', __ms);
                }
            },
            _selectComponent: function (element, nonvisual, buildBreadcrumb) {
                var __start = new Date().getTime();
                var sbox = $('.selected-component'), $element = $(element), offset, frame = $('#designer-frame'), lib = $element.attr('data-lib'), type = $element.attr('data-type'), that = this, pkg, component, found = false, cmp, htmlMarker;
                if (!lib && !type) {
                    lib = 'html';
                    type = element.tagName.toLowerCase();
                    pkg = this._packages[lib];
                    if (pkg) {
                        for (component in pkg.components) {
                            if (pkg.components.hasOwnProperty(component)) {
                                for (var i = 0; i < pkg.components[component].tags.length; i++) {
                                    if (type === pkg.components[component].tags[i]) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    type = component;
                                    break;
                                }
                            }
                        }
                        if (!element.id) {
                            $element.attr('data-title', pkg.components[component].toolboxTitle);
                            $element.attr('data-lib', lib);
                            $element.attr('data-type', type);
                            element.id = type + (this._getComponentCount(type) + 1);
                            htmlMarker = {
                                range: $element.data('marker'),
                                extraMarkers: {}
                            };
                            this.componentIds.push({
                                id: element.id,
                                lib: lib,
                                title: pkg.components[component].toolboxTitle,
                                type: type,
                                visual: true,
                                providerType: this._codeProviders[lib].getProviderType(type),
                                codeMarker: null,
                                htmlMarker: htmlMarker,
                                headMarker: null
                            });
                        } else {
                            found = !undef(this.componentById(element.id));
                            if (!found) {
                                $element.attr('data-title', pkg.components[component].toolboxTitle);
                                $element.attr('data-lib', lib);
                                $element.attr('data-type', type);
                                htmlMarker = {
                                    range: $element.data('marker'),
                                    extraMarkers: {}
                                };
                                this.componentIds.push({
                                    id: element.id,
                                    lib: lib,
                                    title: pkg.components[component].toolboxTitle,
                                    type: type,
                                    visual: true,
                                    providerType: this._codeProviders[lib].getProviderType(type),
                                    codeMarker: null,
                                    htmlMarker: htmlMarker,
                                    headMarker: null
                                });
                            }
                        }
                        cmp = pkg.components[type];
                        if (cmp) {
                            this._promiseCmp = cmp.loadInfo();
                        }
                    }
                }
                if (frame.hasClass('design-frame')) {
                    this.selectedComponent = element;
                    this._updateSelectionBox(true);
                    $('.adorner-hlabel:first').text($element.attr('data-title'));
                    if (typeof buildBreadcrumb === 'undefined' || buildBreadcrumb === true) {
                        $('.dom-nav').empty();
                        this._breadcrumbs(element);
                    }
                    this.internalSelect = true;
                    if (!nonvisual) {
                        $('.dom-tree').igTree('expandToNode', $('.dom-tree').igTree('nodesByValue', $element.data('id')), true);
                    }
                    $('.search-filterlist').css('display', 'none');
                }
                $element.addClass('selected-iframe');
                $('.adorner-prop-menu').remove();
                if (!$element.is('head, script, link')) {
                    if (this._promiseCmp) {
                        this._promiseCmp.then(function () {
                            var __start = new Date().getTime();
                            that._updatePropertyExplorer($element, type, lib, nonvisual);
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                        });
                    } else {
                        this._updatePropertyExplorer($element, type, lib, nonvisual);
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_selectComponent', __ms);
                }
            },
            _updateSelectionBox: function (init) {
                var __start = new Date().getTime();
                if (!this.selectedComponent || $(this.selectedComponent).is('head, script, link')) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_updateSelectionBox', __ms);
                    }
                    return;
                }
                var $element = $(this.selectedComponent), offset = $element.offset(), frame = $('#designer-frame'), sbox = $('.selected-component'), hbox, tag, mleft = parseInt(frame.css('margin-left'), 10), pad = parseInt(frame.css('padding-left'), 10), owidth = $element.outerWidth(), oheight = $element.outerHeight(), pos = sbox.position();
                if (mleft === 0 && window.mozInnerScreenX !== null) {
                    mleft = frame.position().left;
                }
                if ($element.hasClass('nonvisual-item')) {
                    pad = 0;
                }
                if (sbox.outerWidth() !== owidth || sbox.outerHeight() !== oheight || pos.left !== offset.left + mleft + pad || pos.top !== offset.top) {
                    sbox.css({
                        width: owidth,
                        height: oheight,
                        left: offset.left + mleft + pad,
                        top: offset.top,
                        display: 'block'
                    });
                }
                if (this._snap || init) {
                    this._adornersTop = offset.top;
                    this._adornersLeft = offset.left + mleft + owidth + pad;
                    this._ensureAdornersVisible();
                    this._adorners.css({
                        top: this._adornersTop,
                        left: this._adornersLeft
                    });
                }
                if (this.hoveredComponent) {
                    hbox = $('.hovered-component');
                    tag = $('.tag-placeholder');
                    $element = $(this.hoveredComponent);
                    offset = $element.offset();
                    pad = parseInt(frame.css('padding-left'), 10);
                    owidth = $element.outerWidth();
                    oheight = $element.outerHeight();
                    hbox.css({
                        width: owidth,
                        height: oheight,
                        left: offset.left + mleft + pad,
                        top: offset.top,
                        display: 'block'
                    });
                    tag.css({
                        left: offset.left + mleft + pad,
                        top: offset.top - tag.outerHeight(),
                        display: 'block'
                    });
                }
                this._selectionTimeout = setTimeout($.proxy(this._updateSelectionBox, this), 500);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_updateSelectionBox', __ms);
                }
            },
            _setupRWDLayoutArea: function () {
                var __start = new Date().getTime();
                var that = this;
                var Mustache = require('mustache');
                var ddtmpl = $('#dropdownTemplate').html();
                var layoutArea = $('<div></div>').prependTo('.toolbox-content').addClass('layout-container');
                $('<div></div>').text('LAYOUT').addClass('ide-label').appendTo(layoutArea).css({ cursor: 'pointer' });
                var breakpoints = $('<div></div>').appendTo(layoutArea).addClass('layout-breakpoints');
                var layoutfw = $('<div></div>').appendTo(layoutArea).addClass('layout-frameworks');
                $('<span></span>').appendTo(breakpoints).text('Designing Layout & Styles for:').addClass('layout-breakpoints-label layout-label');
                var breakpointsData = {
                        titleText: 'Select CSS breakpoint to view and edit its styles',
                        dropdownId: 'breakpoints',
                        defaultVal: 'All/Default (No Breakpoint)',
                        defaultKey: 'default',
                        defaultItemText: 'ALL / DEFAULT (NO BREAKPOINT)',
                        closeOnClick: false
                    };
                var breakpointsHtml = Mustache.to_html(ddtmpl, breakpointsData);
                breakpoints.append(breakpointsHtml);
                $('.layout-edit-descr-val>input,.layout-edit-min-val>input,.layout-edit-max-val>input').focus(function (event) {
                    var __start = new Date().getTime();
                    that._internalFormEditing = true;
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).blur(function (event) {
                    var __start = new Date().getTime();
                    that._internalFormEditing = false;
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var editButton = $('<button></button>').appendTo('body').addClass('brk-edit-button ig-hidden').attr('title', 'Edit This Breakpoint').on('mouseup', function (event) {
                        var __start = new Date().getTime();
                        var form = $('.layout-edit-form');
                        if (form.is(':visible') && !form.hasClass('ig-hidden')) {
                            form.css('display', 'none');
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                            return;
                        }
                        var button = $(this);
                        var currentItem = button.data('item');
                        var pos = currentItem.offset();
                        var li = button.data('item');
                        form.css({
                            display: 'block',
                            left: pos.left,
                            top: pos.top,
                            width: currentItem.innerWidth() - 40
                        }).data('item', li);
                        $('.layout-edit-remove').data('item', li);
                        $('.layout-edit-save').data('item', li);
                        $('.layout-edit-descr-val > input').val(li.attr('data-text'));
                        $('.layout-edit-min-val > input').val(li.attr('data-min'));
                        $('.layout-edit-max-val > input').val(li.attr('data-max'));
                        if (form.hasClass('ig-hidden')) {
                            form.removeClass('ig-hidden');
                        }
                        that._internalFormFocus = true;
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    }).on('mousedown click', function (event) {
                        var __start = new Date().getTime();
                        event.preventDefault();
                        event.stopPropagation();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                $('<span></span>').appendTo('body').addClass('brk-hover-label').css('display', 'none');
                $('.layout-edit-save').on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    var li = $(this).data('item');
                    var text = $('.layout-edit-descr-val > input').val();
                    var minText = $('.layout-edit-min-val > input').val();
                    var maxText = $('.layout-edit-max-val > input').val();
                    li.attr('data-text', text);
                    li.attr('data-min', minText);
                    li.attr('data-max', maxText);
                    var newLeft = parseInt(parseInt(minText, 10) * li.width() / 2600, 10);
                    var newWidth = parseInt(parseInt(maxText, 10) * li.width() / 2600, 10);
                    li.find('.brk-item-slider').css('left', newLeft);
                    li.find('.brk-slider-inner').css('width', newWidth);
                    li.find('.brk-slider-min div:nth-child(2)').text(minText);
                    li.find('.brk-slider-max div:nth-child(2)').text(maxText);
                    if (li.attr('data-custom') !== true) {
                        li.attr('data-custom', true);
                    }
                    that._changeBreakpoint(li, true);
                    $('.layout-edit-form').css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.layout-edit-remove').on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    var item = $(this).data('item');
                    var deviceItem = $('.device-menu li[data-key=' + item.attr('data-key') + ']');
                    var prevLayoutItem = $('.layout-menu li[data-key=' + item.attr('data-key') + ']').prev();
                    if (that._mediamkr) {
                        var mkr = that._mediamkr.mqueries[item.attr('data-key')];
                        if (mkr) {
                            var codeToRemove = that.session.getTextRange(mkr);
                            var offset = codeToRemove.substring(0, codeToRemove.indexOf('{')).split('\n').length;
                            var queryContents = that.session.getTextRange(new that.RangeClass(mkr.start.row + offset, 0, mkr.end.row + 1, 0));
                            queryContents = queryContents.substring(0, queryContents.lastIndexOf('}'));
                            that.session.insert({
                                row: that._mediamkr.marker.end.row - 3,
                                column: 0
                            }, queryContents + '\n');
                            that.session.remove(mkr);
                            mkr.end.detach();
                            mkr.start.detach();
                            that.session.removeMarker(mkr.id);
                            that._mediamkr.mqueries[item.attr('data-key')] = null;
                            that._lastq.pop();
                        }
                    }
                    deviceItem.removeClass('disabled device-layout-disabled');
                    $(this).css('top', -10000);
                    item.remove();
                    if (prevLayoutItem.length === 0) {
                        var newSel = $('.device-menu li[data-key=default]');
                        that._changeBreakpoint(newSel);
                    } else {
                        that._changeBreakpoint(prevLayoutItem);
                    }
                    $('.layout-edit-form').css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mousedown click', function (event) {
                    var __start = new Date().getTime();
                    event.preventDefault();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('<span></span>').appendTo(editButton).addClass('glyphicon glyphicon-edit');
                var brkmenu = breakpoints.find('.dropdown-menu');
                var breakpointsTitle = $('<li><a style=\'display:inline;\'>' + breakpointsData.titleText + '</a></li>').appendTo(brkmenu).addClass('breakpoints-title brk-item');
                $('<li><a>' + breakpointsData.defaultItemText + '</a></li>').appendTo(brkmenu).addClass('breakpoints-default brk-item').attr('data-key', breakpointsData.defaultKey).attr('data-text', breakpointsData.defaultVal);
                $('.breakpoints-title').on('mousedown mouseup click', function (event) {
                    var __start = new Date().getTime();
                    that._ddopenpersist = true;
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.breakpoints-default').on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    that._changeBreakpoint($(event.target));
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mousedown click', function (event) {
                    var __start = new Date().getTime();
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var deviceButton = $('<button></button>').appendTo(breakpointsTitle).addClass('device-button ig-dropdown');
                $('<span></span>').appendTo(deviceButton).addClass('glyphicon glyphicon-plus device-icon');
                var devicesData = {
                        dropdownId: 'devices',
                        devices: [
                            {
                                key: 'phone',
                                text: 'Phone',
                                min: '0px',
                                max: '320px'
                            },
                            {
                                key: 'phone_landscape',
                                text: 'Phone Landscape',
                                min: '321px',
                                max: ''
                            },
                            {
                                key: 'tablet',
                                text: 'Tablet',
                                min: '321px',
                                max: '767px'
                            },
                            {
                                key: 'tablet_landscape',
                                text: 'Tablet Landscape',
                                min: '768px',
                                max: '1024px'
                            },
                            {
                                key: 'desktop',
                                text: 'Desktop',
                                min: '1224px',
                                max: ''
                            },
                            {
                                key: 'huge_desktop',
                                text: 'Huge Desktop',
                                min: '1824px',
                                max: ''
                            },
                            {
                                key: 'custom',
                                text: 'Other',
                                min: '0',
                                max: ''
                            }
                        ]
                    };
                this._bkeys = devicesData.devices;
                this._bkeys.push({ key: 'default' });
                var devicetmpl = $('#deviceTemplate').html();
                var devicesHtml = Mustache.to_html(devicetmpl, devicesData);
                deviceButton.attr('data-id', devicesData.dropdownId).attr('title', 'Add New Breakpoint');
                var devicesContainer = $(devicesHtml).appendTo('body').addClass('device-container');
                deviceButton.on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    that._toggleDropDown(deviceButton, devicesContainer);
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mousedown click', function (event) {
                    var __start = new Date().getTime();
                    event.stopPropagation();
                    event.preventDefault();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.device-menu > li').on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    var $this = $(this), target = $(event.target);
                    if (target.hasClass('disabled') || target.closest('li').hasClass('disabled')) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    }
                    var ddlist = target.closest('ul');
                    var dd = $('body').find('.ig-dropdown[data-id=' + ddlist.attr('data-id') + ']');
                    that._addDeviceLayoutItem({
                        currentlist: brkmenu,
                        devicelist: ddlist,
                        key: $this.attr('data-key'),
                        text: $this.attr('data-text'),
                        min: $this.attr('data-min'),
                        max: $this.attr('data-max')
                    });
                    that._toggleDropDown(dd, ddlist);
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mousedown click', function (event) {
                    var __start = new Date().getTime();
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('<span></span>').appendTo(layoutfw).text('Grid/Framework').addClass('layout-fw-label layout-label');
                var texts = [];
                var pkgs = this.options.packages;
                texts.push({
                    key: 'none',
                    text: 'None/Vanilla CSS'
                });
                for (var i = 0; i < pkgs.length; i++) {
                    var provider = toolboxMetadata.getPackageInfo(pkgs[i]);
                    var hasLayoutItems = false;
                    if (provider.components) {
                        for (var cname in provider.components) {
                            if (provider.components.hasOwnProperty(cname)) {
                                if (provider.components[cname].category === 'layout') {
                                    hasLayoutItems = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (hasLayoutItems) {
                        texts.push({
                            text: provider.toolboxTitle,
                            key: pkgs[i]
                        });
                    }
                }
                var frameworksData = {
                        defaultVal: 'None/Vanilla CSS',
                        defaultKey: 'none',
                        dropdownId: 'frameworks',
                        closeOnClick: true,
                        itemTexts: texts
                    };
                var frameworksHtml = Mustache.to_html(ddtmpl, frameworksData);
                layoutfw.append(frameworksHtml);
                layoutfw.find('.dropdown-menu').css('width', layoutfw.find('.ig-dropdown:visible').width());
                $('.layout-menu[data-id=frameworks] > li').on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    var $this = $(this), ddlist = $(event.target).closest('ul');
                    var dd = $('body').find('.ig-dropdown[data-id=' + ddlist.attr('data-id') + ']');
                    $('.layout-frameworks .ig-dropdown-label').text($this.attr('data-text')).attr('data-key', $this.attr('data-key'));
                    that._changeLayoutFramework($this.attr('data-key'));
                    if (dd.attr('data-closeonitemclick') === 'false') {
                        that._ddopenpersist = true;
                    } else {
                        that._toggleDropDown(dd, ddlist);
                    }
                    that._dditemclick = true;
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mousedown click', function (event) {
                    var __start = new Date().getTime();
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('.ig-dropdown-label,.ig-dropdown-button').on('mousedown', function (event) {
                    var __start = new Date().getTime();
                    var target = $(event.target), dd = target.closest('.ig-dropdown');
                    var ddlist = dd.find('ul');
                    if (ddlist.length === 0) {
                        ddlist = $('body').find('ul[data-id=' + dd.attr('data-id') + ']');
                    }
                    that._ddopenpersist = false;
                    that._dditemclick = false;
                    that._toggleDropDown(dd, ddlist);
                    if (ddlist.is(':visible')) {
                        $('input.ig-hidden').attr('data-id', dd.attr('data-id')).focus();
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mouseup click', function (event) {
                    var __start = new Date().getTime();
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var closeFn = function () {
                    var __start = new Date().getTime();
                    if (that._internalFormEditing) {
                        that._internalFormEditing = false;
                        $('.abs-edit-form').css('display', 'none');
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('closeFn', __ms);
                        }
                        return;
                    }
                    if (that._ddopenpersist) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('closeFn', __ms);
                        }
                        return;
                    }
                    var id = $(this).attr('data-id');
                    var dd = $('.ig-dropdown[data-id=' + id + ']');
                    var ddlist = $('.dropdown-menu[data-id=' + id + ']');
                    if (!that._dditemclick) {
                        setTimeout(function () {
                            var __start = new Date().getTime();
                            that._toggleDropDown(dd, ddlist, false);
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                        }, 20);
                    } else {
                        that._dditemclick = false;
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('closeFn', __ms);
                    }
                };
                $('input.ig-hidden').blur(function () {
                    var __start = new Date().getTime();
                    if (that._internalFormFocus) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    }
                    var fn = $.proxy(closeFn, this);
                    fn();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).keyup(function (event) {
                    var __start = new Date().getTime();
                    if (event.keyCode === 27) {
                        if (that._internalFormFocus) {
                            $('.abs-edit-form').css('display', 'none');
                            that._internalFormFocus = true;
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                            return;
                        }
                        var fn = $.proxy(closeFn, this);
                        fn();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                layoutArea.find('ul').appendTo('body').css('display', 'none');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupRWDLayoutArea', __ms);
                }
            },
            _hideLayoutHoverUI: function () {
                var __start = new Date().getTime();
                $('.brk-edit-button:not(:hover),.brk-hover-label:not(:hover)').css({
                    left: -10000,
                    top: -10000
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_hideLayoutHoverUI', __ms);
                }
            },
            _closeDropDowns: function () {
                var __start = new Date().getTime();
                var that = this;
                this._internalFormEditing = false;
                $('.dropdown-menu').each(function () {
                    var __start = new Date().getTime();
                    that._toggleDropDown(null, $(this), false);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_closeDropDowns', __ms);
                }
            },
            _toggleDropDown: function (target, list, open) {
                var __start = new Date().getTime();
                if (this._internalFormEditing) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_toggleDropDown', __ms);
                    }
                    return;
                }
                var visible = list.is(':visible');
                if (visible || open === false) {
                    list.find('.ig-dropdown').each(function () {
                        var __start = new Date().getTime();
                        $('.dropdown-menu[data-id=' + $(this).attr('data-id') + ']:visible').css('display', 'none');
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    list.css('display', 'none');
                    $('.abs-edit-form').css('display', 'none');
                    this._hideLayoutHoverUI();
                } else if (open === true || typeof open === 'undefined' && !visible) {
                    var pos = target.offset();
                    $('.dropdown-menu:visible').each(function () {
                        var __start = new Date().getTime();
                        if (!$.contains(this, target[0])) {
                            $(this).css('display', 'none');
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    list.css({
                        display: 'block',
                        left: pos.left - (list.width() - target.outerWidth()),
                        top: pos.top + target.outerHeight()
                    });
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_toggleDropDown', __ms);
                }
            },
            _addDeviceLayoutItem: function (descriptor) {
                var __start = new Date().getTime();
                var ul = descriptor.currentlist, min = descriptor.min, max = descriptor.max, key = descriptor.key, text = descriptor.text, that = this;
                var devicelist = descriptor.devicelist;
                devicelist.find('li[data-key=' + key + ']').addClass('disabled device-layout-disabled');
                var item = $('<li></li>').addClass('item-' + key).addClass('brk-item-added').attr({
                        'data-text': text,
                        'data-key': key,
                        'data-min': min,
                        'data-max': max
                    }).appendTo(ul).on('mouseover', function (event) {
                        var __start = new Date().getTime();
                        var li = $(this), pos = li.offset(), button = $('.brk-edit-button'), hoverLabel = $('.brk-hover-label');
                        button.css({
                            left: pos.left + li.outerWidth() - button.outerWidth(),
                            top: pos.top
                        }).data('item', li);
                        if (!that._isBrkResizing) {
                            hoverLabel.text(li.attr('data-text')).css({
                                display: '',
                                left: pos.left + parseInt(li.outerWidth() / 2 - hoverLabel.width() / 2, 10),
                                top: pos.top
                            });
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    }).on('mouseout', function (event) {
                        var __start = new Date().getTime();
                        that._hideLayoutHoverUI();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    }).on('mouseup', function (event) {
                        var __start = new Date().getTime();
                        if (!that._isresizing) {
                            that._changeBreakpoint($(event.target));
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    }).on('mousedown click', function (event) {
                        var __start = new Date().getTime();
                        event.preventDefault();
                        event.stopPropagation();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                var slider = $('<div></div>').addClass('brk-item-slider').appendTo(item);
                var minMarker = $('<div></div>').addClass('brk-slider-min').appendTo(slider);
                $('<div></div>').appendTo(minMarker).text('MIN');
                $('<div></div>').appendTo(minMarker).text(min);
                var contentMarker = $('<div></div>').addClass('brk-slider-inner').appendTo(slider);
                var maxMarker = $('<div></div>').addClass('brk-slider-max').appendTo(slider);
                $('<div></div>').appendTo(maxMarker).text('MAX');
                $('<div></div>').appendTo(maxMarker).text(max);
                var iw = item.innerWidth();
                var mw = maxMarker.width();
                contentMarker.resizable({
                    handles: 'e, w',
                    maxWidth: iw - mw * 3 - 16,
                    resize: function (e, ui) {
                        var __start = new Date().getTime();
                        var li = ui.element.closest('.brk-item-added');
                        var min = slider.find('.brk-slider-min div:nth-child(2)');
                        var max = slider.find('.brk-slider-max div:nth-child(2)');
                        var origLeft = slider.data('origLeft');
                        if (typeof origLeft === 'undefined') {
                            origLeft = 0;
                        }
                        var minChanged = false, maxChanged = false;
                        var left = parseInt(ui.element.css('left'), 10);
                        var oldLeft = parseInt(slider.css('left'), 10);
                        if (!$.isNumeric(oldLeft)) {
                            oldLeft = 0;
                        }
                        if (!$.isNumeric(left)) {
                            left = 0;
                        }
                        if (oldLeft !== left && left !== 0) {
                            if (left > 0) {
                                left = left + origLeft;
                                slider.css('left', left);
                            } else {
                                left = origLeft - Math.abs(left);
                                if (left < 0) {
                                    left = 0;
                                    ui.element.width(slider.data('prevWidth'));
                                }
                                slider.css('left', left);
                            }
                            minChanged = true;
                        } else if (left === 0 && oldLeft !== 0 && $('body').css('cursor') === 'w-resize') {
                            slider.css('left', 0);
                            minChanged = true;
                        } else {
                            maxChanged = true;
                        }
                        slider.data('prevWidth', ui.element.width());
                        if (minChanged) {
                            ui.element.css('left', 0);
                            var newMin = parseInt(left / li.width() * 2600, 10);
                            if (newMin < 0) {
                                newMin = 0;
                            }
                            min.text(newMin + 'px');
                            li.attr({
                                'data-min': min.text(),
                                'data-custom': true
                            });
                        }
                        if (maxChanged) {
                            var newMax = parseInt(ui.size.width / li.width() * 2600 + parseInt(min.text(), 10), 10);
                            max.text(newMax + 'px');
                            li.attr({
                                'data-max': max.text(),
                                'data-custom': true
                            });
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('resize', __ms);
                        }
                    },
                    start: function (e, ui) {
                        var __start = new Date().getTime();
                        var orig = parseInt(slider.css('left'), 10);
                        if (!$.isNumeric(orig)) {
                            orig = 0;
                        }
                        slider.data('origLeft', orig);
                        that._isresizing = true;
                        ui.element.closest('.brk-item-added').css({ cursor: 'default' });
                        $('.brk-hover-label').css('display', 'none');
                        that._isBrkResizing = true;
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('start', __ms);
                        }
                    },
                    stop: function (e, ui) {
                        var __start = new Date().getTime();
                        var orig = parseInt(slider.css('left'), 10);
                        if (!$.isNumeric(orig)) {
                            orig = 0;
                        }
                        slider.data('origLeft', orig);
                        that._isresizing = false;
                        var li = ui.element.closest('.brk-item-added');
                        that._changeBreakpoint(li, true);
                        li.css({ cursor: 'pointer' });
                        $('.brk-hover-label').css('display', '');
                        that._isBrkResizing = false;
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('stop', __ms);
                        }
                    }
                });
                this._changeBreakpoint(item, true);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_addDeviceLayoutItem', __ms);
                }
            },
            _changeLayoutFramework: function (fw) {
                var __start = new Date().getTime();
                var container = $('.layout-frameworks');
                var items = container.find('.ig-layout-flow');
                if (items.length === 0) {
                    items = $('<ul></ul>').appendTo(container).addClass('ig-layout ig-layout-flow');
                }
                items.children().appendTo($('.hidden-area').next());
                $('.toolbox-item').filter('[data-lib=' + fw + '][data-cat=layout]').appendTo(items);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_changeLayoutFramework', __ms);
                }
            },
            _changeBreakpoint: function (item, update) {
                var __start = new Date().getTime();
                var ddlist = item.closest('.dropdown-menu');
                if (!item.is('li')) {
                    item = item.closest('li');
                }
                var dd = $('body').find('.ig-dropdown[data-id=' + ddlist.attr('data-id') + ']');
                if (!update) {
                    this._toggleDropDown(dd, ddlist, false);
                }
                $('.layout-breakpoints .ig-dropdown-label').text(item.attr('data-text')).attr('data-key', item.attr('data-key'));
                var key = item.attr('data-key');
                var min = parseInt(item.attr('data-min'), 10);
                var max = parseInt(item.attr('data-max'), 10);
                var frame = $('#designer-frame');
                var keys = this._bkeys;
                var title = key;
                for (var i = 0; i < keys.length; i++) {
                    if (frame.hasClass(keys[i].key)) {
                        frame.removeClass(keys[i].key);
                    }
                    if (keys[i].key === key) {
                        title = keys[i].text;
                    }
                }
                frame.addClass(key);
                if (item.attr('data-custom')) {
                    if (min) {
                        frame.css('min-width', min);
                    }
                    if (max) {
                        frame.css({
                            'width': max,
                            'max-width': max
                        });
                    }
                }
                if (key !== 'default') {
                    if (this._mediamkr === null || typeof this._mediamkr === 'undefined') {
                        var mkr;
                        if (this._styleBlockMarker) {
                            mkr = this._styleBlockMarker;
                        } else {
                            var mediablock = '\t\t<style>\n\t\t</style>\n';
                            var pos = this.editor.find('</head>');
                            this.session.insert({
                                row: pos.end.row,
                                column: 0
                            }, mediablock);
                            mkr = new this.RangeClass(pos.end.row, 0, pos.end.row + 4, 0);
                            this.addMarker(mkr);
                        }
                        this._mediamkr = {
                            marker: mkr,
                            mqueries: {}
                        };
                    }
                    var queries = this._mediamkr.mqueries;
                    var mquery = '\n\t\t\t/***\t' + title + '\t***/';
                    mquery += '\n\t\t\t@media screen ';
                    if (min && min >= 0) {
                        mquery += 'and (min-width: ' + min + 'px) ';
                    }
                    if (max && max > 0) {
                        mquery += 'and (max-width: ' + max + 'px) ';
                    }
                    mquery += ' {\n\n\t\t\t}';
                    var brkMkr;
                    if (!queries[key]) {
                        var mparent = this._mediamkr.marker;
                        var pRow, pCol;
                        if (this._lastq.length > 0) {
                            var tmpq = this._lastq[this._lastq.length - 1];
                            pRow = tmpq.end.row;
                            pCol = tmpq.end.column + 1;
                        } else {
                            pRow = mparent.start.row;
                            pCol = this.session.getLine(pRow).length;
                        }
                        this.session.insert({
                            row: pRow,
                            column: pCol
                        }, mquery);
                        var mqueryMkr = new this.RangeClass(pRow, pCol, pRow + 4, 4);
                        this._lastq.push(mqueryMkr);
                        this.addMarker(mqueryMkr);
                        this._mediamkr.mqueries[key] = mqueryMkr;
                        brkMkr = mqueryMkr;
                    } else if (update) {
                        var qmkr = queries[key];
                        var textRange = this.session.getTextRange(qmkr);
                        if (item.attr('data-text') && item.attr('data-text') !== title) {
                            textRange = textRange.replace(/\/\*\*\*\t(.+)\t\*\*\*\//, '/***\t' + item.attr('data-text') + '\t***/');
                        }
                        if (min) {
                            if (textRange.indexOf('min-width') === -1) {
                                textRange = textRange.replace('@media screen', '@media screen and (min-width: ' + min + 'px)');
                            } else {
                                textRange = textRange.replace(/min-width: ([0-9]+)px/, 'min-width: ' + min + 'px');
                            }
                        }
                        if (max) {
                            if (textRange.indexOf('max-width') === -1) {
                                textRange = textRange.replace('{', 'and (max-width: ' + max + 'px) {');
                            } else {
                                textRange = textRange.replace(/max-width: ([0-9]+)px/, 'max-width: ' + max + 'px');
                            }
                        }
                        var newMkr = new this.RangeClass(qmkr.start.row, qmkr.start.column, qmkr.end.row, qmkr.end.column);
                        this.session.replace(qmkr, textRange);
                        this.session.removeMarker(qmkr.id);
                        this.addMarker(newMkr);
                        queries[key] = newMkr;
                        brkMkr = newMkr;
                        if (this._lastq.length > 0) {
                            this._lastq[this._lastq.length - 1] = newMkr;
                        }
                    }
                    $('.frame-container').css('background-color', '#787878');
                    this._selectedBreakpoint = brkMkr;
                    this._selectedBreakpointName = key;
                } else {
                    this._selectedBreakpoint = null;
                    this._selectedBreakpointName = null;
                    $('.frame-container').css('background-color', 'white');
                    $('#designer-frame').css({
                        'min-width': '',
                        'max-width': '',
                        'width': ''
                    });
                }
                this._deselectComponent();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_changeBreakpoint', __ms);
                }
            },
            _initToolboxShowHideBtns: function () {
                var __start = new Date().getTime();
                var minimizebtn = $('.minimize-toolbox'), maximizebtn = $('.maximize-toolbox'), that = this;
                var width = minimizebtn.width();
                var rightArea = $('.right');
                minimizebtn.css({
                    top: 0,
                    left: rightArea.position().left - width
                }).click(function () {
                    var __start = new Date().getTime();
                    rightArea.css('padding-bottom', 0).hide('slide', { direction: 'right' }, 500, function () {
                        var __start = new Date().getTime();
                        maximizebtn.css({
                            top: 0,
                            left: $('body').width() - width
                        }).css('display', '');
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    $(this).css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                maximizebtn.click(function () {
                    var __start = new Date().getTime();
                    var $this = $(this);
                    $this.css('display', 'none');
                    rightArea.show('slide', { direction: 'right' }, 500, function () {
                        var __start = new Date().getTime();
                        minimizebtn.css('display', '').css({
                            top: 0,
                            left: rightArea.position().left - width
                        });
                        rightArea.css('padding-bottom', that._initialPadding);
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                minimizebtn.css({ display: '' });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_initToolboxShowHideBtns', __ms);
                }
            },
            _showClearBtn: function (sbox) {
                var __start = new Date().getTime();
                var pos = sbox.offset();
                var button = $('.clear-button');
                button.css({
                    display: 'block',
                    left: pos.left + sbox.innerWidth() - button.outerWidth(),
                    top: pos.top + parseInt(sbox.height() / 2) - parseInt(button.innerHeight() / 4)
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_showClearBtn', __ms);
                }
            },
            _setupClearBtn: function (input, filterFn) {
                var __start = new Date().getTime();
                var that = this;
                $('.clear-button').on('mousedown', function (event) {
                    var __start = new Date().getTime();
                    that._isClearing = true;
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).on('mouseup', function (event) {
                    var __start = new Date().getTime();
                    that._isClearing = false;
                    $('.clear-button').css('display', 'none');
                    input.val('');
                    filterFn();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupClearBtn', __ms);
                }
            },
            _setupSearch: function (input, filterFn) {
                var __start = new Date().getTime();
                var that = this;
                input.keyup(function (event) {
                    var __start = new Date().getTime();
                    if (typeof that._searchId !== 'undefined') {
                        clearTimeout(that._searchId);
                    }
                    if (event.keyCode === 27) {
                        input.val('');
                        filterFn();
                        $('.clear-button').css('display', 'none');
                    } else {
                        if ($('.clear-button').is(':hidden') && input.val() !== '') {
                            that._showClearBtn(input);
                        } else if (input.val() === '' && $('.clear-button').is(':visible')) {
                            $('.clear-button').css('display', 'none');
                        }
                    }
                    that._searchId = setTimeout(filterFn, that.options.toolboxSearchDelay);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).focus(function (event) {
                    var __start = new Date().getTime();
                    if (input.val() !== '') {
                        that._showClearBtn(input);
                        setTimeout(function () {
                            var __start = new Date().getTime();
                            input.select();
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                        }, 10);
                    }
                    $('.search-filterlist').css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).blur(function (event) {
                    var __start = new Date().getTime();
                    if (!that._isClearing) {
                        $('.clear-button').css('display', 'none');
                        $('.search-filterlist').css('display', 'none');
                    } else {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                this._setupClearBtn(input, filterFn);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupSearch', __ms);
                }
            },
            _setupToolboxSearch: function () {
                var __start = new Date().getTime();
                var input = $('.toolbox-search-input'), that = this, pkgs = this._selectedPkgs;
                var filterFn = function () {
                    var __start = new Date().getTime();
                    var val = input.val().toLowerCase();
                    var filterStr = '';
                    for (var i = 0; i < pkgs.length; i++) {
                        if (i > 0) {
                            filterStr += ',';
                        }
                        filterStr += '[data-lib=' + pkgs[i] + ']';
                    }
                    var items = $('.toolbox-item').filter(filterStr);
                    if (val === '' || val === null || typeof val === 'undefined') {
                        items.css('display', '');
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('filterFn', __ms);
                        }
                        return;
                    }
                    items.each(function () {
                        var __start = new Date().getTime();
                        var $this = $(this);
                        var type = $this.attr('data-type').toLowerCase();
                        var lib = $this.attr('data-lib').toLowerCase();
                        var displayName = $this.find('.toolbox-item-label').text().toLowerCase();
                        if (type.startsWith(val) || lib.startsWith(val) || displayName.startsWith(val) || type === val || lib === val || displayName === val || type.indexOf(val) !== -1 || lib.indexOf(val) !== -1 || displayName.indexOf(val) !== -1) {
                            if ($this.css('display') === 'none') {
                                $this.css('display', '');
                            }
                        } else if ($this.css('display') !== 'none') {
                            $this.css('display', 'none');
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('filterFn', __ms);
                    }
                };
                that._setupSearch(input, filterFn);
                var filterList = $('.toolbox-search-filterlist');
                if (filterList.length === 0) {
                    filterList = $('<ul></ul>').appendTo('body').addClass('list-group toolbox-search-filterlist').css('display', 'none');
                }
                var packageNames = this.options.packages;
                for (var i = 0; i < packageNames.length; i++) {
                    var provider = toolboxMetadata.getPackageInfo(packageNames[i]);
                    var item = $('<li></li>').appendTo(filterList).addClass('list-group-item').addClass('toolbox-filter-item');
                    that._selectedPkgs.push(packageNames[i]);
                    $('<input></input>').attr('type', 'checkbox').prependTo(item).attr('checked', 'checked').click(function () {
                        var __start = new Date().getTime();
                        var $this = $(this), item = $this.closest('li'), pkgs = that._selectedPkgs, pkg;
                        input.val('');
                        pkg = item.attr('data-package');
                        if ($(this).is(':checked')) {
                            pkgs.push(pkg);
                            $('.toolbox-item').filter('[data-lib=' + pkg + ']').css('display', '');
                        } else {
                            for (var j = 0; j < pkgs.length; j++) {
                                if (pkgs[j] === pkg) {
                                    pkgs.splice(j, 1);
                                    $('.toolbox-item').filter('[data-lib=' + pkg + ']').css('display', 'none');
                                    break;
                                }
                            }
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    $('<a></a>').appendTo(item).text(provider.toolboxTitle).addClass('toolbox-filter-label');
                    item.attr('data-package', packageNames[i]);
                }
                $('.toolbox-search-filter').click(function () {
                    var __start = new Date().getTime();
                    var $this = $(this);
                    var toolboxFilter = $('.toolbox-search');
                    if (filterList.is(':visible')) {
                        filterList.css('display', 'none');
                        $this.removeClass('filter-open');
                    } else {
                        filterList.css({
                            display: '',
                            left: toolboxFilter.offset().left,
                            top: toolboxFilter.offset().top + toolboxFilter.height(),
                            width: toolboxFilter.width()
                        });
                        $this.addClass('filter-open');
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupToolboxSearch', __ms);
                }
            },
            _setupInspector: function () {
                var __start = new Date().getTime();
                var inspector = $('.inspector-button'), that = this, body;
                body = $('#designer-frame').contents().find('body');
                inspector.click(function () {
                    var __start = new Date().getTime();
                    if (inspector.hasClass('inspector-enabled')) {
                        inspector.removeClass('inspector-enabled');
                        body.off('mouseenter', that._hoverSelector, that._hoverFn);
                        that._unhoverFn();
                    } else {
                        inspector.addClass('inspector-enabled');
                        body.on('mouseenter', that._hoverSelector, that._hoverFn);
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).addClass('inspector-enabled');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupInspector', __ms);
                }
            },
            _setupMenu: function () {
                var __start = new Date().getTime();
                var Mustache = require('mustache');
                var that = this;
                $('.menu-button').click(function (event) {
                    var __start = new Date().getTime();
                    var offset = $(this).offset();
                    var menu = $('.start-menu');
                    if (menu.is(':visible')) {
                        menu.css('display', 'none');
                    } else {
                        menu.css({
                            left: offset.left,
                            top: offset.top - menu.outerHeight(),
                            display: 'inline-block'
                        });
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var menuItems = {
                        items: [
                            {
                                key: 'save',
                                text: 'Save Screen'
                            },
                            {
                                key: 'load',
                                text: 'Load Screen'
                            }
                        ]
                    };
                var menuTmpl = $('#menuTemplate').html();
                var devicesHtml = Mustache.to_html(menuTmpl, menuItems);
                $(devicesHtml).appendTo('body').css('display', 'none');
                $('.start-menu').on('click', 'li', function (event) {
                    var __start = new Date().getTime();
                    var $this = $(this);
                    var item = $this.is('li') ? $this : $this.closest('li');
                    if (item.attr('data-key') === 'save') {
                        if (typeof Storage !== 'undefined') {
                            localStorage.indexHtml = that.editor.getValue();
                            console.log('screen successfully saved.');
                        } else {
                            console.log('No support for Web Storage');
                        }
                    } else if (item.attr('data-key') === 'load') {
                        if (typeof Storage !== 'undefined') {
                            that.editor.setValue(localStorage.indexHtml);
                            that.currentText = '';
                            that._findChanges();
                        }
                    }
                    $('.start-menu').css('display', 'none');
                    event.preventDefault();
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupMenu', __ms);
                }
            },
            _showElementsTree: function () {
                var __start = new Date().getTime();
                var container = $('.elements-container'), toolboxContainer = $('.toolbox-container');
                container.css('display', 'block');
                var totalHeight = parseInt($('.right-area').height(), 10);
                var searchHeight = parseInt($('.toolbox-search').height(), 10);
                var containerHeight = parseInt(container.height(), 10);
                toolboxContainer.animate({ height: totalHeight - searchHeight - containerHeight }, 500, function () {
                    var __start = new Date().getTime();
                    toolboxContainer.nanoScroller();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_showElementsTree', __ms);
                }
            },
            _hideElementsTree: function () {
                var __start = new Date().getTime();
                var toolboxContainer = $('.toolbox-container');
                var fullHeight = parseInt(this._initialToolboxHeight, 10);
                var container = $('.elements-container');
                toolboxContainer.animate({ height: fullHeight }, 500, function () {
                    var __start = new Date().getTime();
                    container.css('display', 'none');
                    toolboxContainer.css('height', '100%');
                    toolboxContainer.nanoScroller();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_hideElementsTree', __ms);
                }
            },
            _breadcrumbs: function (elem) {
                var __start = new Date().getTime();
                var list = $('<div></div>').addClass('breadcrumbs-list flat'), $elem = $(elem), listData = [], i, that = this;
                var totalWidth = 0;
                var domNav = $('.dom-nav');
                var container = $('.dom-nav .breadcrumbs');
                if (container.length === 0) {
                    container = $('<div></div>').appendTo(domNav).addClass('breadcrumbs');
                }
                list.appendTo(container);
                while ($elem.length) {
                    var css = $elem.attr('class') && $elem.attr('class') !== '' ? $elem.attr('class') : '', toBreak = false;
                    css = css.replace('ig-component', '').replace('selected-iframe', '').replace('design-surface', '');
                    css = css.trim().replace(/ /g, '.');
                    if (css !== '') {
                        css = '.' + css;
                    }
                    if ($elem.is('body')) {
                        $elem.attr({
                            'data-lib': 'html',
                            'data-type': 'container',
                            'data-title': 'body'
                        });
                    }
                    if ($elem.is('html')) {
                        $elem.attr({
                            'data-lib': 'html',
                            'data-type': 'container',
                            'data-title': 'html'
                        });
                        toBreak = true;
                    }
                    listData.push({
                        text: $elem[0].nodeName + css,
                        elem: $elem[0]
                    });
                    if (toBreak) {
                        break;
                    }
                    $elem = $elem.parent();
                }
                listData.reverse();
                for (i = 0; i < listData.length; i++) {
                    var item = $('<a></a>').appendTo(list).attr('href', '#');
                    item.data('elemRef', listData[i].elem).text(listData[i].text).attr('title', listData[i].text);
                    totalWidth += item.outerWidth();
                }
                var _removearrows = function () {
                    var __start = new Date().getTime();
                    if ($('.left-arrow').length > 0) {
                        $('.left-arrow').remove();
                    }
                    if ($('.right-arrow').length > 0) {
                        $('.right-arrow').remove();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_removearrows', __ms);
                    }
                };
                var _addScroll = function () {
                    var __start = new Date().getTime();
                    var continuousScrollId = null;
                    var scrollLeftStep = function () {
                        var __start = new Date().getTime();
                        var scrollLeft = container.scrollLeft();
                        if (scrollLeft - 20 >= 0) {
                            container.scrollLeft(scrollLeft - 20);
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('scrollLeftStep', __ms);
                        }
                    };
                    var scrollRightStep = function () {
                        var __start = new Date().getTime();
                        var scrollLeft = container.scrollLeft();
                        if (scrollLeft + container.width() < list.outerWidth()) {
                            container.scrollLeft(scrollLeft + 20);
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('scrollRightStep', __ms);
                        }
                    };
                    var _doscroll = function (event) {
                        var __start = new Date().getTime();
                        var target = $(event.target);
                        if (!target.hasClass('arrow')) {
                            target = target.closest('.arrow');
                        }
                        target.hasClass('left-arrow') ? scrollLeftStep() : scrollRightStep();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('_doscroll', __ms);
                        }
                    };
                    list.addClass('scrolling');
                    domNav.css('margin-left', 0);
                    _removearrows();
                    var leftArrow = $('<div><div class=\'left-arrow-inner\'></div></div>').insertBefore(domNav).addClass('arrow left-arrow');
                    leftArrow.css('margin-left', 10);
                    $('<div><div class=\'right-arrow-inner\'></div></div>').insertAfter(domNav).addClass('arrow right-arrow');
                    $('.arrow').on({
                        'mousedown': function (event) {
                            var __start = new Date().getTime();
                            continuousScrollId = setInterval(function () {
                                var __start = new Date().getTime();
                                _doscroll(event);
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            }, 50);
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('undefined', __ms);
                            }
                        },
                        'mouseup': function (event) {
                            var __start = new Date().getTime();
                            clearInterval(continuousScrollId);
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('undefined', __ms);
                            }
                        }
                    });
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_addScroll', __ms);
                    }
                };
                $('.dom-nav .breadcrumbs a').click(function (event) {
                    var __start = new Date().getTime();
                    var $this = $(this);
                    $('.crumb-selected').removeClass('crumb-selected').removeClass('active');
                    $this.addClass('crumb-selected').addClass('active');
                    that._hoverComponent(null, $this.data('elemRef'));
                    that._selectComponent($this.data('elemRef'), false, false);
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                    return false;
                });
                list.width(totalWidth);
                _removearrows();
                $(window).resize(function () {
                    var __start = new Date().getTime();
                    if (list.outerWidth() > container.width()) {
                        _addScroll();
                    } else {
                        _removearrows();
                        domNav.css('margin-left', 10);
                        list.removeClass('scrolling');
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                if (totalWidth > container.width()) {
                    _addScroll();
                } else {
                    domNav.css('margin-left', 10);
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_breadcrumbs', __ms);
                }
            },
            _addDefaultAdorners: function (parent) {
                var __start = new Date().getTime();
                var $this = this;
                var header = $('<div></div>').appendTo(parent).addClass('adorner-header');
                this._adorners = parent;
                $('<div></div>').appendTo(header).addClass('adorner-hmin glyphicon glyphicon-remove').click(function (event) {
                    var __start = new Date().getTime();
                    var adorner = $(this).closest('.adorners');
                    $this._snap = true;
                    adorner.children('.adorner-header').css('display', 'none');
                    adorner.children('.adorner-wrapper').css('display', 'none');
                    adorner.addClass('adorners-minimized');
                    adorner.children('.adorner-min-button').css('display', '');
                    if ($this.selectedComponent) {
                        var $selected = $($this.selectedComponent);
                        var offset = $selected.offset();
                        var frame = $('#designer-frame');
                        var pad = parseInt(frame.css('padding-left'), 10);
                        var mleft = parseInt(frame.css('margin-left'), 10);
                        var owidth = $selected.outerWidth();
                        $this._adornersTop = offset.top;
                        $this._adornersLeft = offset.left + mleft + owidth + pad;
                        adorner.css({
                            left: $this._adornersLeft,
                            top: $this._adornersTop
                        });
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var left = $('<div></div>').prependTo(header).addClass('adorner-hleft');
                var adornerMoveFn = function (event) {
                    var __start = new Date().getTime();
                    if (this._adornerMove) {
                        var mleft = parseInt($('#designer-frame').css('margin-left'), 10);
                        var extraOffsets = this._adorners.data('extraOffset');
                        if (typeof extraOffsets === 'undefined') {
                            extraOffsets = {
                                'x': 0,
                                'y': 0
                            };
                        }
                        this._adorners.css({
                            left: event.pageX + mleft - extraOffsets.x,
                            top: event.pageY - extraOffsets.y
                        });
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('adornerMoveFn', __ms);
                    }
                };
                var wrapper = $('<div class="adorner-wrapper"></div>').appendTo(parent);
                $('<div></div>').appendTo(wrapper).addClass('adorner-content');
                $('<span></span>').appendTo(parent).addClass('adorner-min-button glyphicon glyphicon-fullscreen').css('display', 'none').click(function (event) {
                    var __start = new Date().getTime();
                    $this._adorners.children('.adorner-header').css('display', '');
                    $this._adorners.children('.adorner-wrapper').css('display', '');
                    $this._adorners.removeClass('adorners-minimized');
                    $this._adorners.children('.adorner-min-button').css('display', 'none');
                    $this._ensureAdornersVisible(true);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                header.on('mousedown', function (e) {
                    var __start = new Date().getTime();
                    if (!$(e.target).hasClass('adorner-hmin') && !$(e.target).is('a')) {
                        var pos = $this._adorners.offset();
                        $this._snap = false;
                        $this._adorners.data('extraOffset', {
                            'x': e.pageX - pos.left,
                            'y': e.pageY - pos.top
                        });
                        if (!$this._adorners.hasClass('adorners-minimized')) {
                            $this._adornerMove = true;
                            $this._adorners.addClass('adorners-move');
                            var func = $.proxy(adornerMoveFn, $this);
                            $('#designer-frame').contents().find('body').on('mousemove', func).on('mouseup', function (event) {
                                var __start = new Date().getTime();
                                if ($this._adornerMove) {
                                    $this._adornerMove = false;
                                    $('#designer-frame').contents().find('body').off('mousemove', func);
                                    $this._adorners.removeClass('adorners-move');
                                    $this._adornersLeft = $this._adorners.css('left');
                                    $this._adornersTop = $this._adorners.css('top');
                                }
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                            });
                        }
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                $('<div class="input-group prop-search"><input type="text"' + 'class="form-control prop-search-input" placeholder="Search ..."/>' + '</div>').appendTo('.adorner-content');
                var events = $('<div></div>').appendTo('.adorner-content').addClass('adorner-events-list');
                var props = $('<div></div>').appendTo('.adorner-content').addClass('adorner-props-list');
                $('<div>EVENTS</div>').prependTo(events).addClass('adorner-label adorner-events-label');
                $('<div>PROPERTIES/OPTIONS</div>').prependTo(props).addClass('adorner-label adorner-props-label');
                var input = $('.prop-search-input');
                var filterFn = function () {
                    var __start = new Date().getTime();
                    var val = input.val().toLowerCase();
                    var exprs = [
                            {
                                fieldName: 'propName',
                                expr: val,
                                cond: 'contains',
                                logic: 'OR'
                            },
                            {
                                fieldName: 'propValue',
                                expr: val,
                                cond: 'contains',
                                logic: 'OR'
                            }
                        ];
                    $('#eventGrid').igGridFiltering('filter', exprs, true);
                    $('#propertyGrid').igGridFiltering('filter', exprs, true);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('filterFn', __ms);
                    }
                };
                $this._setupSearch(input, filterFn);
                $('<div id="tooltip_container"></div>').appendTo('body').addClass('prop-tooltip').css('display', 'none').append('<div class="tooltip-content"></div>').mouseenter(function () {
                    var __start = new Date().getTime();
                    $('.prop-tooltip').css('display', 'block');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                }).mouseleave(function () {
                    var __start = new Date().getTime();
                    $('.prop-tooltip').css('display', 'none');
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_addDefaultAdorners', __ms);
                }
            },
            _updateSurface: function () {
                var __start = new Date().getTime();
                var update = false, isSplit;
                isSplit = this.splitMode || $('.designer').is(':visible') && $('#editor-container').is(':visible');
                if (this.componentIds && this.componentIds.length > 0) {
                    for (var i = 0; i < this.componentIds.length; i++) {
                        if (this.componentIds[i].codeMarker) {
                            update = true;
                        }
                    }
                }
                if (this.currentText !== this.editor.getValue() && update && isSplit) {
                    console.log('Updating designer surface. Called from setInterval()');
                    this._findChanges();
                } else if (this.parsedText !== this.editor.getValue()) {
                    this._parseCode(this.editor.getValue());
                    this._linkTrees(this.rootNode, $('#designer-frame').contents().children(0));
                    this._rebuildDesignerNavTree();
                    this.parsedText = this.editor.getValue();
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_updateSurface', __ms);
                }
            },
            _findComponent: function (element, remove) {
                var __start = new Date().getTime();
                var id = element.attr('id');
                var lib = element.attr('data-lib');
                for (var i = this.componentIds.length - 1; i >= 0; i--) {
                    if (this.componentIds[i].id === id && this.componentIds[i].lib === lib) {
                        if (remove) {
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('_findComponent', __ms);
                            }
                            return this.componentIds.splice(i, 1)[0];
                        } else {
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('_findComponent', __ms);
                            }
                            return this.componentIds[i];
                        }
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_findComponent', __ms);
                }
                return null;
            },
            _removeComponent: function (element) {
                var __start = new Date().getTime();
                var $element = $(element), comp = $element.hasClass('ig-component'), compObj;
                if (comp) {
                    compObj = this._findComponent($element, true);
                    if (compObj) {
                        if (compObj.codeMarker) {
                            this.session.remove(compObj.codeMarker.range);
                            compObj.codeMarker.range.end.detach();
                            compObj.codeMarker.range.start.detach();
                            this.session.removeMarker(compObj.codeMarker.id);
                        }
                        if (compObj.htmlMarker) {
                            this.session.remove(compObj.htmlMarker.range);
                            compObj.htmlMarker.range.end.detach();
                            compObj.htmlMarker.range.start.detach();
                            this.session.removeMarker(compObj.htmlMarker.id);
                        }
                        if (compObj.headMarker) {
                            this.session.remove(compObj.headMarker);
                            compObj.headMarker.end.detach();
                            compObj.headMarker.start.detach();
                            this.session.removeMarker(compObj.headMarker.id);
                            $('head').find('[data-id=' + element.id + ']').remove();
                        }
                    } else {
                        console.log('component not found/registered!');
                    }
                } else {
                    this.session.remove($element.data('marker'));
                    $element.data('marker').start.detach();
                    $element.data('marker').end.detach();
                }
                if ($element.hasClass('nonvisual-item') && $('.nonvisual-list').children().length === 1) {
                    this._hideNonVisualArea();
                }
                $element.remove();
                this._deselectComponent();
                $('.property_area').remove();
                if ($('#propertyGrid').data('igGrid')) {
                    $('#propertyGrid').igGrid('destroy');
                }
                $('.dom-nav').empty();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_removeComponent', __ms);
                }
            },
            _ensureAdornersVisible: function (setNewPos) {
                var __start = new Date().getTime();
                var height = this._adorners.height();
                var width = this._adorners.width();
                var comp = $(this.selectedComponent);
                var pos = comp.offset();
                var container = $('#dfcontainer');
                var containerHeight = container.height();
                var containerWidth = container.width();
                if (height + this._adornersTop > containerHeight) {
                    this._adornersTop -= height + this._adornersTop - containerHeight;
                }
                if (width + this._adornersLeft > containerWidth) {
                    if (pos.left - width < 0) {
                        this._adornersLeft -= width + this._adornersLeft - containerWidth;
                    } else {
                        this._adornersLeft = pos.left - width;
                    }
                }
                if (setNewPos) {
                    this._adorners.css({
                        top: this._adornersTop,
                        left: this._adornersLeft
                    });
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_ensureAdornersVisible', __ms);
                }
            },
            _restoreAdorners: function () {
                var __start = new Date().getTime();
                this._ensureAdornersVisible();
                this._adorners.css({
                    left: this._adornersLeft,
                    top: this._adornersTop
                });
                $('.tag-placeholder').css({
                    left: this._tagHolderLeft,
                    top: this._tagHolderTop
                });
                this._adornersHidden = false;
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_restoreAdorners', __ms);
                }
            },
            _hideAdorners: function () {
                var __start = new Date().getTime();
                var tagHolder = $('.tag-placeholder');
                this._adornersLeft = this._adorners.css('left');
                this._adornersTop = this._adorners.css('top');
                this._tagHolderLeft = tagHolder.css('left');
                this._tagHolderTop = tagHolder.css('top');
                this._adorners.css({
                    left: -10000,
                    top: -10000
                });
                tagHolder.css({
                    left: -10000,
                    top: -10000
                });
                this._adornersHidden = true;
                $('.search-filterlist').css('display', 'none');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_hideAdorners', __ms);
                }
            },
            _deselectComponent: function () {
                var __start = new Date().getTime();
                clearTimeout(this._selectionTimeout);
                $('.selected-component,.hovered-component,.tag-placeholder,.adorners,.prop-tooltip').css({
                    left: -10000,
                    top: -10000
                });
                if (this.selectedComponent) {
                    $(this.selectedComponent).removeClass('selected-iframe');
                    this.selectedComponent = null;
                }
                $('.search-filterlist').css('display', 'none');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_deselectComponent', __ms);
                }
            },
            _loadHandler: function () {
                var __start = new Date().getTime();
                var frameHead, body, that = this, fcontents, i;
                fcontents = $('#designer-frame').contents();
                frameHead = fcontents.find('head');
                body = fcontents.find('body');
                fcontents.find('html').css('height', '100%');
                if (frameHead.length === 0) {
                    frameHead = $('<head></head>').appendTo(fcontents);
                }
                body.css({
                    width: '100%',
                    height: '100%',
                    padding: '0px',
                    margin: '0px'
                });
                if (this.firstload) {
                    $('<link rel="stylesheet" type="text/css" id="idecss" href="css/iframe-ide.css">').appendTo(frameHead);
                    for (i = 0; i < this._cssDeps.length; i++) {
                        frameHead.append($(this._cssDeps[i]).attr('async', ''));
                    }
                    for (i = 0; i < this._jsDepsSrc.length; i++) {
                        var lazyLoad = false, srcUrl = '', scriptMeta = null;
                        if (typeof this._jsDepsSrc[i] === 'object') {
                            scriptMeta = this._jsDepsSrc[i];
                            if (scriptMeta.lazyLoad) {
                                lazyLoad = true;
                            } else {
                                srcUrl = scriptMeta.url;
                            }
                        } else {
                            srcUrl = this._jsDepsSrc[i];
                        }
                        if (!lazyLoad) {
                            this._loadScript(srcUrl, scriptMeta && scriptMeta.id ? scriptMeta : null);
                        }
                    }
                }
                fcontents.ready(function () {
                    var __start = new Date().getTime();
                    body.keyup(function (event) {
                        var __start = new Date().getTime();
                        if (event.keyCode === 46) {
                            that._removeComponent(that.selectedComponent);
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    var selector = '.ig-component,div,span,p,table,tr,td,video,audio,br,span,h1,h2,h3,h4,h5,h6,ul,li,ol,a,img';
                    var editableSelector = 'td,span,div,li,h1,h2,h3,h4,h5,h6,a,p,tr,table,ul,ol';
                    that._hoverSelector = selector;
                    that._hoverFn = function (event) {
                        var __start = new Date().getTime();
                        var el = this;
                        el = that._resolveElement(el);
                        that._hoverComponent(event, el);
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('that._hoverFn', __ms);
                        }
                    };
                    that._unhoverFn = function (event) {
                        var __start = new Date().getTime();
                        var boxes = $('.hovered-component,.tag-placeholder');
                        boxes.css({
                            top: -10000,
                            left: -10000
                        });
                        that.hoveredComponent = null;
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('that._unhoverFn', __ms);
                        }
                    };
                    body.on('mouseenter', selector, that._hoverFn);
                    body.on('mouseleave', selector, that._unhoverFn);
                    var mouseMoveFn = function (event) {
                        var __start = new Date().getTime();
                        that._inFrame = true;
                        if (that._isMouseDown) {
                            if (that._oldMouseX && Math.abs(that._oldMouseX - event.pageX) < 5 && (that._oldMouseY && Math.abs(that._oldMouseY - event.pageY) < 5)) {
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('mouseMoveFn', __ms);
                                }
                                return;
                            }
                            that._isDragging = true;
                            if (that._adornersHidden !== true) {
                                that._hideAdorners();
                            }
                            var mleft = parseInt($('#designer-frame').css('margin-left'), 10);
                            if (that._dragClone === null || typeof that._dragClone === 'undefined' || that._dragClone && that._dragClone.length === 0) {
                                var el = this;
                                el = that._resolveElement(el);
                                that._draggedElement = el;
                                that._dragClone = $('<div></div>').addClass('drag-clone').appendTo('body').append($(el).clone()).css({
                                    position: 'absolute',
                                    left: event.pageX + mleft,
                                    top: event.pageY
                                });
                            } else {
                                that._dragClone.css({
                                    left: event.pageX + mleft,
                                    top: event.pageY
                                });
                            }
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('mouseMoveFn', __ms);
                        }
                    };
                    that._initddreoder();
                    body.on('click', function (event) {
                        var __start = new Date().getTime();
                        if ($(event.target).not(selector)) {
                            that._deselectComponent();
                        }
                        $('.context-menu').css('display', 'none');
                        that._closeDropDowns();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    body.on('mousedown', selector, function (e) {
                        var __start = new Date().getTime();
                        that._selectElemResolved = that._resolveElement(this);
                        if (that._selectElemResolved !== that.selectedComponent) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    body.on('click', selector, function (event) {
                        var __start = new Date().getTime();
                        that._selectElem = this;
                        that._selectEvt = event;
                        event.stopPropagation();
                        that._selectTimeoutID = setTimeout($.proxy(that._selectDelayed, that), 100);
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    body.on('dblclick', editableSelector, function (event) {
                        var __start = new Date().getTime();
                        var el = this;
                        clearTimeout(that._selectTimeoutID);
                        el = that._resolveElement(el);
                        if (el && !$(el).hasClass('ig-component')) {
                            that._trigger(that.events.componentDblClick, event, {
                                ide: that,
                                element: $(this)
                            });
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    body.on('blur keypress paste change cut', '[contenteditable]', function (event) {
                        var __start = new Date().getTime();
                        clearTimeout(that._editTimeoutID);
                        that._contenteditable = $(event.target);
                        that._editTimeoutID = setTimeout($.proxy(that._onEditContent, that), that.options.editContentDelay);
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    that.element.on('igstudiocomponentdblclick', function (e, args) {
                        var __start = new Date().getTime();
                        if (that._contenteditable) {
                            that._contenteditable.removeAttr('contenteditable');
                            that._contenteditable.off('blur');
                        }
                        that._contenteditable = args.element;
                        args.element.attr('contenteditable', true);
                        $('.selected-component,.hovered-component').css({
                            left: -10000,
                            top: -10000
                        });
                        args.element.focus();
                        e.stopPropagation();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    if (that.rootNode.children) {
                        that._linkTrees(that.rootNode, fcontents.children(0));
                        that._rebuildDesignerNavTree();
                    }
                    if (!that.firstload) {
                        $('.loading-designer').css('display', 'none');
                    } else {
                        $('.loading-designer,.loading-body').css('display', 'none');
                        $('.loading-designer-inner').text('Refreshing Designer');
                        $('.loading-progress').css('display', 'none');
                        $('.loading-designer').css('padding-top', 50);
                        that.firstload = false;
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_loadHandler', __ms);
                }
            },
            _initddreoder: function () {
                var __start = new Date().getTime();
                var selector = '.ig-component,div,span,p,table,tr,td,video,audio,br,span,h1,h2,h3,h4,h5,h6,ul,li,ol,a,img';
                var fcontents = $('#designer-frame').contents();
                var targets = fcontents.find('.ig-component').addBack();
                var that = this;
                var mouseMoveFn = function (event) {
                    var __start = new Date().getTime();
                    that._inFrame = true;
                    if (that._isMouseDown) {
                        if (that._oldMouseX && Math.abs(that._oldMouseX - event.pageX) < 5 && (that._oldMouseY && Math.abs(that._oldMouseY - event.pageY) < 5)) {
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('mouseMoveFn', __ms);
                            }
                            return;
                        }
                        that._isDragging = true;
                        if (that._adornersHidden !== true) {
                            that._hideAdorners();
                        }
                        var mleft = parseInt($('#designer-frame').css('margin-left'), 10);
                        if (that._dragClone === null || typeof that._dragClone === 'undefined' || that._dragClone && that._dragClone.length === 0) {
                            var el = this;
                            el = that._resolveElement(el);
                            that._draggedElement = el;
                            that._dragClone = $('<div></div>').addClass('drag-clone').appendTo('body').append($(el).clone()).css({
                                position: 'absolute',
                                left: event.pageX + mleft,
                                top: event.pageY
                            });
                        } else {
                            that._dragClone.css({
                                left: event.pageX + mleft,
                                top: event.pageY
                            });
                        }
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('mouseMoveFn', __ms);
                    }
                };
                targets.off('mousemove');
                targets.on('mousemove', selector + ',body', mouseMoveFn);
                var mouseDownFn = function (event) {
                    var __start = new Date().getTime();
                    if (event.which === 3) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('mouseDownFn', __ms);
                        }
                        return;
                    }
                    that._oldMouseX = event.pageX;
                    that._oldMouseY = event.pageY;
                    that._isMouseDown = true;
                    $('.context-menu').css('display', 'none');
                    $('.contextmenu').css('display', 'none');
                    var fn = function () {
                        var __start = new Date().getTime();
                        if (!this._inFrame) {
                            this._isMouseDown = false;
                            this._clearDragFn();
                        } else {
                            clearTimeout(this._dragReorderID);
                            this._dragReorderID = setTimeout($.proxy(fn, this), 300);
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('fn', __ms);
                        }
                    };
                    that._dragReorderID = setTimeout($.proxy(fn, that), 300);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('mouseDownFn', __ms);
                    }
                };
                targets.off('mousedown');
                targets.on('mousedown', selector, mouseDownFn);
                var mouseUpFn = function (event) {
                    var __start = new Date().getTime();
                    clearTimeout(that._dragReorderID);
                    if (that._inFrame) {
                        that._endDragFn(this);
                    } else {
                        that._clearDragFn();
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('mouseUpFn', __ms);
                    }
                };
                targets.off('mouseup');
                targets.on('mouseup', selector + ',body', mouseUpFn);
                targets.on('contextmenu', function (event) {
                    var __start = new Date().getTime();
                    var mousex = event.pageX, mousey = event.pageY;
                    var el = that._resolveElement(event.target), $el = $(el);
                    if (!$el.hasClass('ig-component')) {
                        $el = $el.closest('.ig-component');
                        el = $el[0];
                    }
                    if ($el.length === 0 || !$el.hasClass('ig-component')) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    }
                    if (el !== that.selectedComponent) {
                        that._hoverComponent(event, el);
                    }
                    that._contextComponent = el;
                    $('.context-menu').css({
                        display: 'block',
                        left: mousex + 2,
                        top: mousey + 2
                    });
                    event.preventDefault();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var mouseOutFn = function (event) {
                    var __start = new Date().getTime();
                    that._inFrame = false;
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('mouseOutFn', __ms);
                    }
                };
                targets.off('mouseleave');
                targets.on('mouseleave', mouseOutFn);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_initddreoder', __ms);
                }
            },
            _onEditContent: function () {
                var __start = new Date().getTime();
                var editelem = this._contenteditable;
                if (editelem !== null && typeof editelem !== 'undefined') {
                    if (editelem.is('input')) {
                        var m = editelem.data('marker');
                        var inputVal = ' value="' + editelem.val() + '"';
                        var range = this.editor.find(new RegExp(' value="(.*)?"'), { start: m });
                        if (range === null || typeof range === 'undefined') {
                            this.session.insert({
                                row: m.start.row,
                                column: m.start.column + 6
                            }, inputVal);
                        } else {
                            this.session.replace(range, inputVal);
                        }
                        this._refreshAll();
                    } else {
                        var marker = editelem.data('contentMarker');
                        var code = this.session.getTextRange(marker);
                        if (code !== editelem.html()) {
                            this.session.replace(marker, editelem.html());
                            this._refreshAll();
                        }
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_onEditContent', __ms);
                }
            },
            _refreshAll: function () {
                var __start = new Date().getTime();
                this.currentText = this.editor.getValue();
                this._parseCode(this.currentText);
                if (this.rootNode.children) {
                    this._linkTrees(this.rootNode, $('#designer-frame').contents().children(0));
                    this._rebuildDesignerNavTree();
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_refreshAll', __ms);
                }
            },
            _selectDelayed: function () {
                var __start = new Date().getTime();
                var el = this._selectElemResolved ? this._selectElemResolved : this._resolveElement(this._selectElem), sel = this.editor.getSelection(), $el = $(el);
                this._selectElemResolved = null;
                this._selectComponent(el);
                if ($el.data('marker')) {
                    sel.setSelectionRange($el.data('marker'));
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_selectDelayed', __ms);
                }
            },
            _startFrameFix: function (event, ui) {
                var __start = new Date().getTime();
                var frame, div;
                if ($('#temp_div').length > 0) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_startFrameFix', __ms);
                    }
                    return;
                }
                frame = $('#designer-frame');
                div = $('<div></div>');
                $('#designer').append(div);
                div.attr('id', 'temp_div');
                div.css({
                    position: 'absolute',
                    top: 0,
                    left: 0
                });
                div.height('100%');
                div.width('100%');
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_startFrameFix', __ms);
                }
            },
            _stopFrameFix: function (event, ui) {
                var __start = new Date().getTime();
                $('#temp_div').remove();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_stopFrameFix', __ms);
                }
            },
            _findChanges: function () {
                var __start = new Date().getTime();
                var val, doc, r;
                if (this.currentText !== this.editor.getValue() || this.wasDirty) {
                    this._deselectComponent();
                    $('.loading-designer').css('display', 'block');
                    console.log('document <-> code editor dirty, reloading iframe.');
                    var i, htmlRange, code;
                    val = this.editor.getValue();
                    var tempSession = new this.session.constructor(val);
                    for (i = 0; i < this.componentIds.length; i++) {
                        if (!this.componentIds[i].htmlMarker) {
                            continue;
                        }
                        htmlRange = this.componentIds[i].htmlMarker.range;
                        r = new this.RangeClass(htmlRange.start.row, 0, htmlRange.start.row, this.maxColLength);
                        code = tempSession.getTextRange(r);
                        if (code.indexOf('class=') !== -1 && code.indexOf('ig-component') === -1) {
                            code = code.replace(/class="(.*?)"/, 'class="$1 ig-component"');
                        } else {
                            code = code.replace(/<([\w-]+)/, '<$1 class="ig-component"');
                        }
                        code = code.replace(/<([\w-]+)/, '<$1 data-lib=' + this.componentIds[i].lib + ' data-type=' + this.componentIds[i].type + ' data-title=' + this.componentIds[i].title + ' ');
                        tempSession.replace(r, code);
                    }
                    this.currentText = val;
                    this._parseCode(val);
                    doc = $('#designer-frame').contents()[0];
                    doc.open('text/html', 'replace');
                    var framecss = '<link rel="stylesheet" type="text/css" id="idecss" href="css/iframe-ide.css">\n';
                    var src = tempSession.getValue();
                    src = src.replace('<head>\n', '<head>\n' + framecss);
                    doc.write(src);
                    doc.close();
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_findChanges', __ms);
                }
            },
            _parseCode: function (val) {
                var __start = new Date().getTime();
                var level = 0, maxLevel = 0, id = 0, currentNode, that = this, parser;
                that.extraChars = 0;
                parser = require('htmlparser');
                try {
                    parser(val, {
                        start: function (tag, attrs, unary, offset, contentOffset) {
                            var __start = new Date().getTime();
                            if (typeof currentNode === 'undefined') {
                                that.rootNode = {
                                    tagName: tag,
                                    startOffset: offset,
                                    startContentOffset: contentOffset,
                                    children: [],
                                    id: id++,
                                    parent: null
                                };
                                currentNode = that.rootNode;
                            } else {
                                var node = {
                                        tagName: tag,
                                        attrs: attrs,
                                        startOffset: offset,
                                        startContentOffset: contentOffset,
                                        children: [],
                                        id: id++,
                                        parent: currentNode
                                    };
                                if (that.unary && currentNode.children.length > 0) {
                                    currentNode.children[currentNode.children.length - 1].endOffset = offset - that.extraChars;
                                    that.extraChars = 0;
                                }
                                currentNode.children.push(node);
                                if (!unary) {
                                    currentNode = node;
                                    level++;
                                }
                                that.unary = unary;
                            }
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('start', __ms);
                            }
                        },
                        end: function (tag, offset, contentOffset) {
                            var __start = new Date().getTime();
                            if (that.unary && currentNode.children.length > 0 && typeof currentNode.children[currentNode.children.length - 1].endOffset === 'undefined') {
                                currentNode.children[currentNode.children.length - 1].endOffset = contentOffset - that.extraChars;
                                that.extraChars = 0;
                            }
                            if (level > maxLevel) {
                                maxLevel = level;
                            }
                            level--;
                            currentNode.endOffset = offset;
                            currentNode.endContentOffset = contentOffset;
                            currentNode = currentNode.parent;
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('end', __ms);
                            }
                        },
                        chars: function (text) {
                            var __start = new Date().getTime();
                            that.extraChars = text.length;
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('chars', __ms);
                            }
                        },
                        comment: function (text) {
                            var __start = new Date().getTime();
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('comment', __ms);
                            }
                        }
                    });
                } catch (e) {
                    console.log(e);
                }
                that.maxLevel = maxLevel;
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_parseCode', __ms);
                }
            },
            _initRangeClass: function () {
                var __start = new Date().getTime();
                if (this.RangeClass) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_initRangeClass', __ms);
                    }
                    return;
                }
                this.RangeClass = this.editor.find('<html').constructor;
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_initRangeClass', __ms);
                }
            },
            _rebuildDesignerNavTree: function () {
                var __start = new Date().getTime();
                var tree = $('.dom-tree'), i, that = this, maxLevel = this.maxLevel;
                if (tree.length === 0) {
                    tree = $('<div></div>').appendTo('.elements-container').addClass('dom-tree');
                }
                var bindingsObj = {
                        childDataProperty: 'children',
                        textKey: 'tagNameDetail',
                        valueKey: 'id'
                    };
                if (tree.data('igTree')) {
                    tree.igTree('destroy');
                }
                tree.igTree({
                    dataSource: [that.rootNode],
                    bindings: bindingsObj,
                    dragAndDrop: true,
                    dragAndDropSettings: {
                        customDropValidation: function () {
                            var __start = new Date().getTime();
                            if (!$(this).is('li[data-path=0_1]') && $(this).closest('li[data-role=node]').attr('data-path').indexOf('0_1') === 0) {
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('customDropValidation', __ms);
                                }
                                return true;
                            }
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('customDropValidation', __ms);
                            }
                            return false;
                        }
                    },
                    height: 300,
                    selectionChanged: function (event, args) {
                        var __start = new Date().getTime();
                        var sel = that.editor.getSelection();
                        sel.setSelectionRange(args.selectedNodes[0].data.marker);
                        if (!that.isDesign) {
                            that.editor.focus();
                        } else {
                            if (!that.internalSelect) {
                                that._selectComponent(args.selectedNodes[0].data.domRef);
                            }
                            that.internalSelect = false;
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('selectionChanged', __ms);
                        }
                    }
                });
                $('.dom-tree li[data-role=node] > a').on('contextmenu', function (event) {
                    var __start = new Date().getTime();
                    var $target = $(event.target), nodeElement = $target.closest('li');
                    var node = tree.igTree('nodeDataFor', nodeElement.data('path'));
                    var contextmenu = $('.contextmenu');
                    if (contextmenu.length === 0) {
                        contextmenu = $('<ul></ul>').addClass('contextmenu').css('display', 'none').appendTo('body');
                    } else {
                        contextmenu.empty();
                    }
                    if ($(node.domRef).hasClass('ig-component')) {
                        var removeItem = $('<li></li>').text('Remove component').appendTo(contextmenu).data('component', node.domRef);
                        removeItem.addClass('contextmenu-item').mousedown(function (event) {
                            var __start = new Date().getTime();
                            that._removeComponent($(this).data('component'));
                            tree.igTree('removeAt', nodeElement.data('path'));
                            $('.contextmenu').css('display', 'none');
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                        });
                        contextmenu.css({
                            display: '',
                            position: 'absolute',
                            left: event.clientX,
                            top: event.clientY
                        });
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_rebuildDesignerNavTree', __ms);
                }
            },
            _linkTrees: function (root, doc) {
                var __start = new Date().getTime();
                var offsets = this._calcEditorOffsets();
                this._linkSubTree(root, doc, offsets);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_linkTrees', __ms);
                }
            },
            _linkSubTree: function (item, domNode, offsets) {
                var __start = new Date().getTime();
                var $domNode = $(domNode), detail = '';
                item.domRef = domNode;
                if ($domNode.hasClass('ig-component')) {
                    detail += ':' + $domNode.attr('data-type');
                }
                item.tagNameDetail = item.tagName + detail;
                item.marker = this._createMarker(item.startOffset, item.endOffset, offsets);
                item.contentMarker = this._createMarker(item.startContentOffset, item.endContentOffset, offsets);
                $domNode.data('marker', item.marker);
                $domNode.data('contentMarker', item.contentMarker);
                $domNode.data('id', item.id);
                for (var i = 0; item.children && i < item.children.length; i++) {
                    if ($domNode.children('[data-design-visible-child=true]').length > 0) {
                        this._linkSubTree(item.children[i], $domNode.children('[data-design-visible-child=true]').get(i), offsets);
                    } else {
                        this._linkSubTree(item.children[i], $domNode.children().get(i), offsets);
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_linkSubTree', __ms);
                }
            },
            _createMarker: function (startOffset, endOffset, offsets) {
                var __start = new Date().getTime();
                var startRow = this._findRow(offsets, 0, offsets.length, startOffset);
                var startCol = startOffset - offsets[startRow];
                var endRow = this._findRow(offsets, 0, offsets.length, endOffset);
                var endCol = endOffset - offsets[endRow];
                var range = new this.RangeClass(startRow, startCol, endRow, endCol);
                range.start = this.session.doc.createAnchor(range.start);
                range.end = this.session.doc.createAnchor(range.end);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_createMarker', __ms);
                }
                return range;
            },
            _findRow: function (offsets, startRow, endRow, offsetPos) {
                var __start = new Date().getTime();
                if (startRow > endRow) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_findRow', __ms);
                    }
                    return -1;
                }
                if (startRow + 1 === endRow) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_findRow', __ms);
                    }
                    return startRow;
                }
                var mid = Math.floor((startRow + endRow) / 2);
                if (offsetPos < offsets[mid]) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_findRow', __ms);
                    }
                    return this._findRow(offsets, startRow, mid, offsetPos);
                } else if (offsetPos > offsets[mid]) {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_findRow', __ms);
                    }
                    return this._findRow(offsets, mid, endRow, offsetPos);
                } else {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_findRow', __ms);
                    }
                    return mid;
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_findRow', __ms);
                }
            },
            _calcEditorOffsets: function () {
                var __start = new Date().getTime();
                var offsets = [];
                var count = this.session.getLength();
                var currentOffset = 0, newLinesCount = this.session.getDocument().getNewLineCharacter().length;
                offsets.push(currentOffset);
                var text = this.session.getLines(0, count);
                for (var i = 0; i < count; i++) {
                    currentOffset += text[i].length + newLinesCount;
                    offsets.push(currentOffset);
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_calcEditorOffsets', __ms);
                }
                return offsets;
            },
            _updatePropertyExplorer: function (element, type, lib, nonvisual) {
                var __start = new Date().getTime();
                var data = [], evtData = [], count = 0, evtCount = 0, props, events, evt, prop, $this = this, title, codeProvider, descriptor, pkg, comp, compObject, codeMarker, htmlMarker, customSheet, id, cssClass;
                codeProvider = this._codeProviders[lib];
                pkg = this._packages[lib];
                comp = pkg ? pkg.components[type] : null;
                id = element.attr('id');
                cssClass = $.trim(element.attr('class').replace('ig-component', '').replace('selected-iframe', ''));
                compObject = $this.componentById(id);
                title = compObject ? compObject.title : element.attr('data-title');
                if (comp) {
                    $('.adorner-wrapper').css('left', 0);
                    this._removeExtraAdorners();
                    if (codeProvider.hasCustomRenderer(comp)) {
                        customSheet = $('.adorner-summary-sheet').show();
                        if (customSheet.length === 0) {
                            customSheet = $('<div class="adorner-summary-sheet"><div class="adorner-custom-container"></div><div class="adorner-custom-footer"><a href="#" class="adorner-all-properties">All Events & Properties</a></div></div>');
                            $('.adorner-wrapper').prepend(customSheet);
                            customSheet.on('click', 'a.adorner-all-properties', function (event) {
                                var __start = new Date().getTime();
                                $this.adornerMoveLeft();
                                event.stopPropagation();
                                {
                                    var __ms = new Date().getTime() - __start;
                                    _putstat('anonymous', __ms);
                                }
                                return false;
                            });
                        }
                        customSheet.attr('data-property', title);
                        $('.adorner-content').attr('data-property', 'all props');
                        this.currentAdorner(customSheet);
                        codeMarker = compObject.codeMarker;
                        htmlMarker = compObject.htmlMarker;
                        codeProvider.render(customSheet.children('.adorner-custom-container'), {
                            type: comp.id,
                            id: id,
                            element: element,
                            codeMarker: codeMarker,
                            htmlMarker: htmlMarker,
                            editor: $this.editor,
                            editorSession: $this.session,
                            rangeClass: $this.RangeClass,
                            iframe: window.frames[0]
                        });
                    } else {
                        $('.adorner-summary-sheet').hide().removeAttr('data-property');
                        this.currentAdorner($('.adorner-content').attr('data-property', title));
                    }
                    if (!nonvisual) {
                        data.push({
                            id: count,
                            propName: 'id',
                            defaultValue: id,
                            propValue: id,
                            propType: 'string',
                            description: 'HTML id attribute. Used for setting unique identifier to referencing in scripts.',
                            valueOptions: null
                        });
                        count++;
                        data.push({
                            id: count,
                            propName: 'class',
                            defaultValue: '',
                            propValue: cssClass,
                            propType: 'string',
                            description: 'CSS classes for this element. You can have more than one separated by spaces.',
                            valueOptions: null
                        });
                        count++;
                    }
                    if (comp.properties) {
                        props = comp.properties;
                        for (prop in props) {
                            if (props.hasOwnProperty(prop)) {
                                descriptor = {
                                    type: type,
                                    propName: prop,
                                    placeholder: element,
                                    defaultValue: props[prop].defaultValue,
                                    iframe: window.frames[0]
                                };
                                data.push({
                                    id: count,
                                    propName: prop,
                                    defaultValue: props[prop].defaultValue,
                                    propValue: codeProvider.getPropValue(descriptor),
                                    propType: props[prop].type,
                                    description: props[prop].description,
                                    valueOptions: props[prop].valueOptions,
                                    displayProp: props[prop].designerDisplayProperty,
                                    schema: props[prop].schema
                                });
                            }
                            count++;
                        }
                    }
                    if (comp.events) {
                        events = comp.events;
                        for (evt in events) {
                            if (events.hasOwnProperty(evt)) {
                                evtData.push({
                                    id: evtCount,
                                    propName: evt,
                                    propValue: '',
                                    propType: 'event',
                                    description: events[evt].description,
                                    args: events[evt].args
                                });
                            }
                            evtCount++;
                        }
                    }
                    var propertyExplorer = require('ide-propertyexplorer');
                    var eventOptions = {
                            element: element,
                            updatingEnabled: false,
                            id: 'eventGrid',
                            containerId: 'events',
                            parent: $('.adorner-events-list'),
                            data: evtData,
                            type: type,
                            compObject: compObject,
                            provider: codeProvider,
                            ide: this
                        };
                    propertyExplorer(eventOptions);
                    $('.adorner-props-list').height(500 - $('.adorner-events-list').height());
                    var options = {
                            element: element,
                            id: 'propertyGrid',
                            containerId: 'props',
                            parent: $('.adorner-props-list'),
                            data: data,
                            type: type,
                            compObject: compObject,
                            provider: codeProvider,
                            ide: this
                        };
                    propertyExplorer(options);
                } else {
                    $('.adorner-props-list:nth-child(2)').empty();
                    $('.adorner-events-list:nth-child(2)').empty();
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_updatePropertyExplorer', __ms);
                }
            },
            currentAdorner: function (adorner) {
                var __start = new Date().getTime();
                if (adorner) {
                    this._currentAdorner = adorner;
                    this._adornerBreadcrumbs();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('currentAdorner', __ms);
                    }
                    return;
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('currentAdorner', __ms);
                }
                return this._currentAdorner;
            },
            adornerMoveLeft: function () {
                var __start = new Date().getTime();
                var self = this;
                $('.adorner-wrapper').animate({ left: '-=250' }, 250, function () {
                    var __start = new Date().getTime();
                    self.currentAdorner(self._currentAdorner.next());
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('adornerMoveLeft', __ms);
                }
            },
            adornerMoveRight: function (element) {
                var __start = new Date().getTime();
                var wrapper = $('.adorner-wrapper'), left = parseInt(wrapper.css('left'), 10), header = $('.adorner-header'), distance = this._currentAdorner.index() - element.index(), self = this;
                wrapper.animate({ left: '+=' + distance * 250 }, 250, function () {
                    var __start = new Date().getTime();
                    element.nextAll().each(function (index, element) {
                        var __start = new Date().getTime();
                        var el = $(this);
                        if (!el.hasClass('adorner-content')) {
                            el.remove();
                        }
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                    });
                    self.currentAdorner(element);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('adornerMoveRight', __ms);
                }
            },
            _adornerBreadcrumbs: function () {
                var __start = new Date().getTime();
                var list = $('<div></div>').addClass('breadcrumbs-list flat'), props = [], i, self = this, width = 0;
                $('.adorner-wrapper').children().each(function (index, element) {
                    var __start = new Date().getTime();
                    var prop = $(this).attr('data-property');
                    if (prop) {
                        props.push(prop);
                    }
                    if ($(this) === self._currentAdorner) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return;
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                var container = $('.adorner-header .breadcrumbs');
                if (container.length === 0) {
                    container = $('<div class=\'breadcrumbs\'></div>').appendTo('.adorner-hleft');
                }
                container.empty().append(list);
                for (i = props.length - 1; i >= 0; i--) {
                    width += $('<a href=\'#\' data-property=\'' + props[i] + '\'>' + props[i] + '</a>').prependTo(list).outerWidth();
                    if (width > container.outerWidth()) {
                        list.children().first().text('...').attr('title', props[i]);
                        break;
                    }
                }
                $('.adorner-header .breadcrumbs a').click(function (event) {
                    var __start = new Date().getTime();
                    var $this = $(this);
                    if ($this.attr('data-property') === self._currentAdorner.attr('data-property')) {
                        event.stopPropagation();
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return false;
                    }
                    self.adornerMoveRight($('.adorner-wrapper').children('[data-property=\'' + $this.attr('data-property') + '\']'));
                    event.stopPropagation();
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                    return false;
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_adornerBreadcrumbs', __ms);
                }
            },
            _removeExtraAdorners: function () {
                var __start = new Date().getTime();
                $('.adorner-wrapper').children().not('.adorner-summary-sheet,.adorner-content').remove();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_removeExtraAdorners', __ms);
                }
            },
            designerBody: function () {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('designerBody', __ms);
                }
                return $('#designer-frame').contents().find('body');
            },
            designerDocument: function () {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('designerDocument', __ms);
                }
                return $('#designer-frame').contents();
            },
            addMarker: function (mkr) {
                var __start = new Date().getTime();
                mkr.start = this.session.doc.createAnchor(mkr.start);
                mkr.end = this.session.doc.createAnchor(mkr.end);
                mkr.id = this.session.addMarker(mkr, 'customMarker', 'text', true);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('addMarker', __ms);
                }
            },
            createAndAddMarker: function (startRow, startCol, endRow, endCol) {
                var __start = new Date().getTime();
                var range = new this.RangeClass(startRow, startCol, endRow, endCol);
                this.addMarker(range);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('createAndAddMarker', __ms);
                }
                return range;
            },
            _tabStr: function (n) {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_tabStr', __ms);
                }
                return new Array(n + 1).join('\t');
            },
            _propCodeDefaultVal: function (type, defaultValMeta) {
                var __start = new Date().getTime();
                if (type === 'number') {
                    var val = parseInt(defaultValMeta, 10);
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_propCodeDefaultVal', __ms);
                    }
                    return isNaN(val) ? 0 : val;
                } else if (type === 'bool' || type === 'boolean') {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_propCodeDefaultVal', __ms);
                    }
                    return Boolean(defaultValMeta);
                } else if (type === 'literal') {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_propCodeDefaultVal', __ms);
                    }
                    return defaultValMeta;
                } else if (type === 'date') {
                    if (defaultValMeta && defaultValMeta.getTime) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('_propCodeDefaultVal', __ms);
                        }
                        return defaultValMeta;
                    } else {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('_propCodeDefaultVal', __ms);
                        }
                        return 'new Date()';
                    }
                } else if (defaultValMeta !== null && typeof defaultValMeta !== 'undefined') {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_propCodeDefaultVal', __ms);
                    }
                    return '"' + defaultValMeta + '"';
                } else {
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('_propCodeDefaultVal', __ms);
                    }
                    return '""';
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_propCodeDefaultVal', __ms);
                }
            },
            getObjectCodeString: function (obj, tabs) {
                var __start = new Date().getTime();
                var val = '{\n';
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        var subType = typeof obj[prop];
                        if (subType === 'string') {
                            val += this._tabStr(tabs + 1) + prop + ': "' + obj[prop] + '",\n';
                        } else if (subType === 'boolean' || subType === 'number') {
                            val += this._tabStr(tabs + 1) + prop + ': ' + obj[prop] + ',\n';
                        } else if (subType === 'object' && obj[prop] && obj[prop].length) {
                            val += this._tabStr(tabs + 1) + prop + ': ' + this.getArrayCodeString(obj[prop], tabs + 1) + ',\n';
                        } else if (subType === 'object' && obj[prop]) {
                            val += this._tabStr(tabs + 1) + prop + ': ' + this.getObjectCodeString(obj[prop], tabs + 1) + ',\n';
                        }
                    }
                }
                val = val.substring(0, val.length - 2);
                val += '\n' + this._tabStr(tabs) + '}';
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('getObjectCodeString', __ms);
                }
                return val;
            },
            getArrayCodeString: function (obj, tabs) {
                var __start = new Date().getTime();
                var val = '[\n' + this._tabStr(tabs + 1);
                for (var i = 0; i < obj.length; i++) {
                    val += this.getObjectCodeString(obj[i], tabs + 1);
                    if (i < obj.length - 1) {
                        val += ',\n' + this._tabStr(tabs + 1);
                    } else {
                        val += '\n';
                    }
                }
                val += this._tabStr(tabs) + ']';
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('getArrayCodeString', __ms);
                }
                return val;
            },
            _setupConfirmDialog: function () {
                var __start = new Date().getTime();
                var that = this;
                $(window).bind('beforeunload', function () {
                    var __start = new Date().getTime();
                    if (that._initialCode !== that.editor.getValue()) {
                        {
                            var __ms = new Date().getTime() - __start;
                            _putstat('anonymous', __ms);
                        }
                        return 'If you leave this page now, you will lose any changes you\u2019ve made in the designer.';
                    }
                    {
                        var __ms = new Date().getTime() - __start;
                        _putstat('anonymous', __ms);
                    }
                });
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('_setupConfirmDialog', __ms);
                }
            },
            componentById: function (id) {
                var __start = new Date().getTime();
                var comp = null;
                for (var i = 0; i < this.componentIds.length; i++) {
                    if (this.componentIds[i].id === id) {
                        comp = this.componentIds[i];
                        break;
                    }
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('componentById', __ms);
                }
                return comp;
            },
            undef: function (val) {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('undef', __ms);
                }
                return val === null || typeof val === 'undefined';
            },
            destroy: function () {
                var __start = new Date().getTime();
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('destroy', __ms);
                }
                return this;
            }
        });
        $.extend($.ui.igStudio, { version: '<build_number>' });
        {
            var __ms = new Date().getTime() - __start;
            _putstat('anonymous', __ms);
        }
    }(jQuery));
    {
        var __ms = new Date().getTime() - __start;
        _putstat('anonymous', __ms);
    }
});