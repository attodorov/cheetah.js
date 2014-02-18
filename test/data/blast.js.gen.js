'use strict';
(function (window, document) {
    var start = new Date().getTime();
    console.log(new Date().getTime() - start);
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
        var current = val;
        var ret = function (retVal) {
            if (!undef(retVal) && retVal !== ret._val) {
                ret.notify(false);
                current = retVal;
                ret.notify(true);
                return ret;
            }
            return current;
        };
        ret.notify = function (end, action) {
            for (var i = 0; i < ret.subs.length; i++) {
                ret.subs[i](current, !end ? true : false, action);
            }
        };
        ret.subs = [];
        ret._val = val;
        ret.__bo = true;
        ret(val);
        return ret;
    };
    blast.observableArray = function (arr) {
        arr = arr || [];
        var i;
        var observableArr = blast.observable(arr);
        var _compilefn = function (fn) {
            return function () {
                observableArr.notify(false, fn);
                var ret = observableArr._val[fn].apply(observableArr._val, arguments);
                observableArr.notify(true, fn);
                return ret;
            };
        };
        for (i = 0; i < _arrextend.length; i++) {
            observableArr[_arrextend[i]] = _compilefn(_arrextend[i]);
        }
        return observableArr;
    };
    blast.link = function (elem, meta, data) {
        var key = meta.key;
        if (data[key].__bo) {
            data[key].subs.push(function (val, beforeEvent) {
                if (!beforeEvent) {
                    setval(elem, val);
                }
            });
        }
        elem.addEventListener(meta.event ? meta.event : 'change', function () {
            var newVal = getval(elem);
            if (data[key].__bo) {
                data[key](newVal);
            } else {
                data[key] = newVal;
            }
        }, false);
        if (undef(meta) || meta && meta.init !== false) {
            setval(elem, data[key].__bo ? data[key]() : data[key]);
        }
    };
    blast.linkAll = function (prop, meta, model) {
        var elems = elem(prop, meta.parent);
        for (var i = 0; i < elems.length; i++) {
            meta.key = prop;
            blast.link(elems[i], meta, model);
        }
    };
    blast.observe = function (data) {
        if (undef(data)) {
            return null;
        }
        if (Array.isArray(data)) {
            var observed = [];
            for (var i = 0; i < data.length; i++) {
                observed.push(observeObj(data[i]));
            }
            return observed;
        }
        return observeObj(data);
    };
    blast.bind = function (model, meta) {
        var m = undef(meta) ? {} : meta;
        var addItem = function (parent, tmpl, meta, prepend) {
            var item = tmpl.cloneNode(true);
            if (prepend) {
                parent.insertBefore(item, parent.firstChild);
            } else {
                parent.appendChild(item);
            }
            meta.parent = item;
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
    };
    blast.json = function (model) {
        if (undef(model)) {
            return null;
        }
        if (Array.isArray(model)) {
            var d = [];
            for (var i = 0; i < model.length; i++) {
                d.push(toObj(model[i]));
            }
            return d;
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
        console.log(new Date().getTime() - start);
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
        console.log(new Date().getTime() - start);
        return obj;
    }
    function setval(elem, val) {
        var start = new Date().getTime();
        if (elem instanceof window.HTMLInputElement) {
            elem.value = val;
        } else {
            elem.innerHTML = val;
        }
        console.log(new Date().getTime() - start);
    }
    function getval(elem) {
        var start = new Date().getTime();
        if (elem instanceof window.HTMLInputElement) {
            return elem.value;
        }
        console.log(new Date().getTime() - start);
        return elem.innerHTML;
    }
    function elem(prop, parent) {
        var start = new Date().getTime();
        var root = parent ? parent : doc;
        console.log(new Date().getTime() - start);
        return root.querySelectorAll('[data-bind=' + prop + ']');
    }
    function clear(elem) {
        var start = new Date().getTime();
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
        console.log(new Date().getTime() - start);
    }
    function undef(val) {
        var start = new Date().getTime();
        console.log(new Date().getTime() - start);
        return val === null || typeof val === 'undefined';
    }
}(window, document));
if (typeof define === 'function' && define.amd) {
    define('blast', [], function () {
        return window.blast;
    });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.blast;
}