{
    if (!window._p) {
        window._p = {};
        window._p.__callstack = {};
    }
}
'use strict';
(function (window, document) {
    var __start = new Date().getTime();
    {
        _pushstack('anonymous');
    }
    var blast = window.blast = window.blast || {}, doc = document;
    var _arrextend = [
            'pop',
            'push',
            'reverse',
            'shift',
            'sort',
            'splice',
            'unshift'
        ];
    blast.observable = function (val) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.observable');
        }
        var current = val;
        var ret = function (retVal) {
            var __start = new Date().getTime();
            {
                _pushstack('ret');
            }
            if (!undef(retVal) && retVal !== ret._val) {
                ret.notify(false);
                current = retVal;
                ret.notify(true);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('ret', __ms);
                }
                return ret;
            }
            {
                var __ms = new Date().getTime() - __start;
                _putstat('ret', __ms);
            }
            return current;
            {
                _popstack('ret');
            }
        };
        ret.notify = function (end, action) {
            var __start = new Date().getTime();
            {
                _pushstack('ret.notify');
            }
            for (var i = 0; i < ret.subs.length; i++) {
                ret.subs[i](current, !end ? true : false, action);
            }
            {
                var __ms = new Date().getTime() - __start;
                _putstat('ret.notify', __ms);
            }
            {
                _popstack('ret.notify');
            }
        };
        ret.subs = [];
        ret._val = val;
        ret.__bo = true;
        ret(val);
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.observable', __ms);
        }
        return ret;
        {
            _popstack('blast.observable');
        }
    };
    blast.observableArray = function (arr) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.observableArray');
        }
        arr = arr || [];
        var i;
        var observableArr = blast.observable(arr);
        var _compilefn = function (fn) {
            var __start = new Date().getTime();
            {
                _pushstack('_compilefn');
            }
            {
                var __ms = new Date().getTime() - __start;
                _putstat('_compilefn', __ms);
            }
            return function () {
                var __start = new Date().getTime();
                {
                    _pushstack('anonymous');
                }
                observableArr.notify(false, fn);
                var ret = observableArr._val[fn].apply(observableArr._val, arguments);
                observableArr.notify(true, fn);
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('anonymous', __ms);
                }
                return ret;
                {
                    _popstack('anonymous');
                }
            };
            {
                _popstack('_compilefn');
            }
        };
        for (i = 0; i < _arrextend.length; i++) {
            observableArr[_arrextend[i]] = _compilefn(_arrextend[i]);
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.observableArray', __ms);
        }
        return observableArr;
        {
            _popstack('blast.observableArray');
        }
    };
    blast.link = function (elem, meta, data) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.link');
        }
        var key = meta.key;
        if (data[key].__bo) {
            data[key].subs.push(function (val, beforeEvent) {
                var __start = new Date().getTime();
                {
                    _pushstack('anonymous');
                }
                if (!beforeEvent) {
                    setval(elem, val);
                }
                {
                    var __ms = new Date().getTime() - __start;
                    _putstat('anonymous', __ms);
                }
                {
                    _popstack('anonymous');
                }
            });
        }
        elem.addEventListener(meta.event ? meta.event : 'change', function () {
            var __start = new Date().getTime();
            {
                _pushstack('anonymous');
            }
            var newVal = getval(elem);
            if (data[key].__bo) {
                data[key](newVal);
            } else {
                data[key] = newVal;
            }
            {
                var __ms = new Date().getTime() - __start;
                _putstat('anonymous', __ms);
            }
            {
                _popstack('anonymous');
            }
        }, false);
        if (undef(meta) || meta && meta.init !== false) {
            setval(elem, data[key].__bo ? data[key]() : data[key]);
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.link', __ms);
        }
        {
            _popstack('blast.link');
        }
    };
    blast.linkAll = function (prop, meta, model) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.linkAll');
        }
        var elems = elem(prop, meta.parent);
        for (var i = 0; i < elems.length; i++) {
            meta.key = prop;
            blast.link(elems[i], meta, model);
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.linkAll', __ms);
        }
        {
            _popstack('blast.linkAll');
        }
    };
    blast.observe = function (data) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.observe');
        }
        if (undef(data)) {
            {
                var __ms = new Date().getTime() - __start;
                _putstat('blast.observe', __ms);
            }
            return null;
        }
        if (Array.isArray(data)) {
            var observed = [];
            for (var i = 0; i < data.length; i++) {
                observed.push(observeObj(data[i]));
            }
            {
                var __ms = new Date().getTime() - __start;
                _putstat('blast.observe', __ms);
            }
            return observed;
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.observe', __ms);
        }
        return observeObj(data);
        {
            _popstack('blast.observe');
        }
    };
    blast.bind = function (model, meta) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.bind');
        }
        var m = undef(meta) ? {} : meta;
        var addItem = function (parent, tmpl, meta, prepend) {
            var __start = new Date().getTime();
            {
                _pushstack('addItem');
            }
            var item = tmpl.cloneNode(true);
            if (prepend) {
                parent.insertBefore(item, parent.firstChild);
            } else {
                parent.appendChild(item);
            }
            meta.parent = item;
            {
                var __ms = new Date().getTime() - __start;
                _putstat('addItem', __ms);
            }
            {
                _popstack('addItem');
            }
        };
        for (var p in model) {
            if (model.hasOwnProperty(p)) {
                var prop = model[p];
                if (Array.isArray(prop) || prop.__bo && Array.isArray(prop())) {
                    var dom = elem(p)[0];
                    var tmpl = (dom.firstElementChild || dom.children[0]).cloneNode(true);
                    clear(dom);
                    if (prop.__bo) {
                        prop.subs.push(function (arr, before, action) {
                            var __start = new Date().getTime();
                            {
                                _pushstack('anonymous');
                            }
                            if (!before) {
                                switch (action) {
                                case 'push':
                                    addItem(dom, tmpl, m);
                                    blast.bind(arr[arr.length - 1], m);
                                    break;
                                case 'pop':
                                    dom.removeChild(dom.lastChild);
                                    break;
                                case 'shift':
                                    dom.removeChild(dom.firstChild);
                                    break;
                                case 'unshift':
                                    addItem(dom, tmpl, m, true);
                                    blast.bind(arr[0], m);
                                    break;
                                case 'splice':
                                    break;
                                case 'sort':
                                    break;
                                default:
                                    break;
                                }
                            }
                            {
                                var __ms = new Date().getTime() - __start;
                                _putstat('anonymous', __ms);
                            }
                            {
                                _popstack('anonymous');
                            }
                        });
                        prop = prop();
                    }
                    for (var i = 0; i < prop.length; i++) {
                        addItem(dom, tmpl, m);
                        blast.bind(prop[i], m);
                    }
                } else {
                    blast.linkAll(p, m, model);
                }
            }
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.bind', __ms);
        }
        {
            _popstack('blast.bind');
        }
    };
    blast.json = function (model) {
        var __start = new Date().getTime();
        {
            _pushstack('blast.json');
        }
        if (undef(model)) {
            {
                var __ms = new Date().getTime() - __start;
                _putstat('blast.json', __ms);
            }
            return null;
        }
        if (Array.isArray(model)) {
            var d = [];
            for (var i = 0; i < model.length; i++) {
                d.push(toObj(model[i]));
            }
            {
                var __ms = new Date().getTime() - __start;
                _putstat('blast.json', __ms);
            }
            return d;
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('blast.json', __ms);
        }
        return toObj(model);
        {
            _popstack('blast.json');
        }
    };
    function observeObj(o) {
        var __start = new Date().getTime();
        {
            _pushstack('observeObj');
        }
        var observed = {}, prop = null;
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                observed[prop] = blast.observable(o[prop]);
            }
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('observeObj', __ms);
        }
        return observed;
        {
            _popstack('observeObj');
        }
    }
    function toObj(observable) {
        var __start = new Date().getTime();
        {
            _pushstack('toObj');
        }
        var obj = {};
        for (var p in observable) {
            if (observable.hasOwnProperty(p)) {
                obj[p] = observable[p]();
            }
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('toObj', __ms);
        }
        return obj;
        {
            _popstack('toObj');
        }
    }
    function setval(elem, val) {
        var __start = new Date().getTime();
        {
            _pushstack('setval');
        }
        if (elem instanceof window.HTMLInputElement) {
            elem.value = val;
        } else {
            elem.innerHTML = val;
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('setval', __ms);
        }
        {
            _popstack('setval');
        }
    }
    function getval(elem) {
        var __start = new Date().getTime();
        {
            _pushstack('getval');
        }
        if (elem instanceof window.HTMLInputElement) {
            {
                var __ms = new Date().getTime() - __start;
                _putstat('getval', __ms);
            }
            return elem.value;
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('getval', __ms);
        }
        return elem.innerHTML;
        {
            _popstack('getval');
        }
    }
    function elem(prop, parent) {
        var __start = new Date().getTime();
        {
            _pushstack('elem');
        }
        var root = parent ? parent : doc;
        {
            var __ms = new Date().getTime() - __start;
            _putstat('elem', __ms);
        }
        return root.querySelectorAll('[data-bind=' + prop + ']');
        {
            _popstack('elem');
        }
    }
    function clear(elem) {
        var __start = new Date().getTime();
        {
            _pushstack('clear');
        }
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('clear', __ms);
        }
        {
            _popstack('clear');
        }
    }
    function undef(val) {
        var __start = new Date().getTime();
        {
            _pushstack('undef');
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('undef', __ms);
        }
        return val === null || typeof val === 'undefined';
        {
            _popstack('undef');
        }
    }
    {
        var __ms = new Date().getTime() - __start;
        _putstat('anonymous', __ms);
    }
    {
        _popstack('anonymous');
    }
}(window, document));
if (typeof define === 'function' && define.amd) {
    define('blast', [], function () {
        var __start = new Date().getTime();
        {
            _pushstack('anonymous');
        }
        {
            var __ms = new Date().getTime() - __start;
            _putstat('anonymous', __ms);
        }
        return window.blast;
        {
            _popstack('anonymous');
        }
    });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.blast;
}