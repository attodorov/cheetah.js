window._p = [];
'use strict';
(function (window, document) {
    var start = new Date().getTime();
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
        var start = new Date().getTime();
        var current = val;
        var ret = function (retVal) {
            var start = new Date().getTime();
            if (!undef(retVal) && retVal !== ret._val) {
                ret.notify(false);
                current = retVal;
                ret.notify(true);
                {
                    var end = new Date().getTime() - start;
                    if (!window._p['anonymous']) {
                        window._p['anonymous'] = {
                            count: 0,
                            avg: 0
                        };
                    }
                    window._p['anonymous'].count++;
                    window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
                }
                return ret;
            }
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return current;
        };
        ret.notify = function (end, action) {
            var start = new Date().getTime();
            for (var i = 0; i < ret.subs.length; i++) {
                ret.subs[i](current, !end ? true : false, action);
            }
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
        };
        ret.subs = [];
        ret._val = val;
        ret.__bo = true;
        ret(val);
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return ret;
    };
    blast.observableArray = function (arr) {
        var start = new Date().getTime();
        arr = arr || [];
        var i;
        var observableArr = blast.observable(arr);
        var _compilefn = function (fn) {
            var start = new Date().getTime();
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return function () {
                var start = new Date().getTime();
                observableArr.notify(false, fn);
                var ret = observableArr._val[fn].apply(observableArr._val, arguments);
                observableArr.notify(true, fn);
                {
                    var end = new Date().getTime() - start;
                    if (!window._p['anonymous']) {
                        window._p['anonymous'] = {
                            count: 0,
                            avg: 0
                        };
                    }
                    window._p['anonymous'].count++;
                    window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
                }
                return ret;
            };
        };
        for (i = 0; i < _arrextend.length; i++) {
            observableArr[_arrextend[i]] = _compilefn(_arrextend[i]);
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return observableArr;
    };
    blast.link = function (elem, meta, data) {
        var start = new Date().getTime();
        var key = meta.key;
        if (data[key].__bo) {
            data[key].subs.push(function (val, beforeEvent) {
                var start = new Date().getTime();
                if (!beforeEvent) {
                    setval(elem, val);
                }
                {
                    var end = new Date().getTime() - start;
                    if (!window._p['anonymous']) {
                        window._p['anonymous'] = {
                            count: 0,
                            avg: 0
                        };
                    }
                    window._p['anonymous'].count++;
                    window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
                }
            });
        }
        elem.addEventListener(meta.event ? meta.event : 'change', function () {
            var start = new Date().getTime();
            var newVal = getval(elem);
            if (data[key].__bo) {
                data[key](newVal);
            } else {
                data[key] = newVal;
            }
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
        }, false);
        if (undef(meta) || meta && meta.init !== false) {
            setval(elem, data[key].__bo ? data[key]() : data[key]);
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
    };
    blast.linkAll = function (prop, meta, model) {
        var start = new Date().getTime();
        var elems = elem(prop, meta.parent);
        for (var i = 0; i < elems.length; i++) {
            meta.key = prop;
            blast.link(elems[i], meta, model);
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
    };
    blast.observe = function (data) {
        var start = new Date().getTime();
        if (undef(data)) {
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return null;
        }
        if (Array.isArray(data)) {
            var observed = [];
            for (var i = 0; i < data.length; i++) {
                observed.push(observeObj(data[i]));
            }
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return observed;
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return observeObj(data);
    };
    blast.bind = function (model, meta) {
        var start = new Date().getTime();
        var m = undef(meta) ? {} : meta;
        var addItem = function (parent, tmpl, meta, prepend) {
            var start = new Date().getTime();
            var item = tmpl.cloneNode(true);
            if (prepend) {
                parent.insertBefore(item, parent.firstChild);
            } else {
                parent.appendChild(item);
            }
            meta.parent = item;
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
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
                            var start = new Date().getTime();
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
                                var end = new Date().getTime() - start;
                                if (!window._p['anonymous']) {
                                    window._p['anonymous'] = {
                                        count: 0,
                                        avg: 0
                                    };
                                }
                                window._p['anonymous'].count++;
                                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
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
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
    };
    blast.json = function (model) {
        var start = new Date().getTime();
        if (undef(model)) {
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return null;
        }
        if (Array.isArray(model)) {
            var d = [];
            for (var i = 0; i < model.length; i++) {
                d.push(toObj(model[i]));
            }
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return d;
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return toObj(model);
    };
    function observeObj(o) {
        var start = new Date().getTime();
        var observed = {}, prop = null;
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                observed[prop] = blast.observable(o[prop]);
            }
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return observed;
    }
    function toObj(observable) {
        var start = new Date().getTime();
        var obj = {};
        for (var p in observable) {
            if (observable.hasOwnProperty(p)) {
                obj[p] = observable[p]();
            }
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return obj;
    }
    function setval(elem, val) {
        var start = new Date().getTime();
        if (elem instanceof window.HTMLInputElement) {
            elem.value = val;
        } else {
            elem.innerHTML = val;
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['setval']) {
                window._p['setval'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['setval'].count++;
            window._p['setval'].avg = (window._p['setval'].avg + end) / 2;
        }
    }
    function getval(elem) {
        var start = new Date().getTime();
        if (elem instanceof window.HTMLInputElement) {
            {
                var end = new Date().getTime() - start;
                if (!window._p['anonymous']) {
                    window._p['anonymous'] = {
                        count: 0,
                        avg: 0
                    };
                }
                window._p['anonymous'].count++;
                window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
            }
            return elem.value;
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return elem.innerHTML;
    }
    function elem(prop, parent) {
        var start = new Date().getTime();
        var root = parent ? parent : doc;
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return root.querySelectorAll('[data-bind=' + prop + ']');
    }
    function clear(elem) {
        var start = new Date().getTime();
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
        {
            var end = new Date().getTime() - start;
            if (!window._p['clear']) {
                window._p['clear'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['clear'].count++;
            window._p['clear'].avg = (window._p['clear'].avg + end) / 2;
        }
    }
    function undef(val) {
        var start = new Date().getTime();
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return val === null || typeof val === 'undefined';
    }
    {
        var end = new Date().getTime() - start;
        if (!window._p['anonymous']) {
            window._p['anonymous'] = {
                count: 0,
                avg: 0
            };
        }
        window._p['anonymous'].count++;
        window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
    }
}(window, document));
if (typeof define === 'function' && define.amd) {
    define('blast', [], function () {
        var start = new Date().getTime();
        {
            var end = new Date().getTime() - start;
            if (!window._p['anonymous']) {
                window._p['anonymous'] = {
                    count: 0,
                    avg: 0
                };
            }
            window._p['anonymous'].count++;
            window._p['anonymous'].avg = (window._p['anonymous'].avg + end) / 2;
        }
        return window.blast;
    });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.blast;
}