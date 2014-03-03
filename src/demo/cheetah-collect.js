function _sendPerfData () {
	//serialize and send contents of window._p to the server which listens for data
	// a bit of preprocessing
	// remove the "parent" prop from the call stack because it will result in a circular reference error when serializing
	var stack = window._p.__callstack;
	delete stack.parent;
	function __processParents(calls) {
		for (var i = 0; i < calls.length; i++) {
			delete calls[i].parent;
			if (calls[i].calls && calls[i].calls.length > 0) {
				__processParents(calls[i].calls);
			}
		}
	}
	__processParents(stack.calls);
	$.post("http://localhost:12346/api/collect", {
		contentType : 'application/json',
		dataType: "json",
		data: JSON.pruned(window._p)
	});
}
function _startPerf() {
	window._p = null;
	__init__();
}
function __init__() {
	if (!window._p) {
		window._p = {};
		window.__current = {
			fn: "Program",
			calls: [], 
			parent: null
		};
		window._p.__callstack = window.__current;
	}
}
function _getstart() {
	return new Date().getTime();
}
function _putstat(name, start) {
	var duration = new Date().getTime() - start; 
	if (!window._p[name]) {
		window._p[name] = {
			count: 0,
			avg: 0,
			sum: 0
		}; 
	}
	window._p[name].count++;
	window._p[name].sum += duration;
	if (window._p[name].count === 0) {
		window._p[avg] = duration;
	} else {
		window._p[name].avg = window._p[name].avg + ((duration - window._p[name].avg) / window._p[name].count);
	}
}
// record call stack
function __pushstack(name) {
	//var stack = window._p.__callstack;
	var c = window.__current;
	c.calls.push({
		fn: name,
		parent: c,
		calls: []
	});
	window.__current = c.calls[c.calls.length - 1];
}
function __popstack() {
	if (window.__current.parent) {
		window.__current = window.__current.parent;
	}
}
// JSON.pruned : a function to stringify any object without overflow
// example : var json = JSON.pruned({a:'e', c:[1,2,{d:{e:42, f:'deep'}}]})
// two additional optional parameters :
//   - the maximal depth (default : 6)
//   - the maximal length of arrays (default : 50)
// GitHub : https://github.com/Canop/JSON.prune
// This is based on Douglas Crockford's code ( https://github.com/douglascrockford/JSON-js/blob/master/json2.js )
(function () {
    'use strict';

    var DEFAULT_MAX_DEPTH = 100;
    var DEFAULT_ARRAY_MAX_LENGTH = 100;
    var seen; // Same variable used for all stringifications

    Date.prototype.toPrunedJSON = Date.prototype.toJSON;
    String.prototype.toPrunedJSON = String.prototype.toJSON;

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    function str(key, holder, depthDecr, arrayMaxLength) {
        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            partial,
            value = holder[key];
        if (value && typeof value === 'object' && typeof value.toPrunedJSON === 'function') {
            value = value.toPrunedJSON(key);
        }

        switch (typeof value) {
        case 'string':
            return quote(value);
        case 'number':
            return isFinite(value) ? String(value) : 'null';
        case 'boolean':
        case 'null':
            return String(value);
        case 'object':
            if (!value) {
                return 'null';
            }
            if (depthDecr<=0 || seen.indexOf(value)!==-1) {
                return '"-pruned-"';
            }
            seen.push(value);
            partial = [];
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = Math.min(value.length, arrayMaxLength);
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value, depthDecr-1, arrayMaxLength) || 'null';
                }
                v = partial.length === 0
                    ? '[]'
                    : '[' + partial.join(',') + ']';
                return v;
            }
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    try {
                        v = str(k, value, depthDecr-1, arrayMaxLength);
                        if (v) partial.push(quote(k) + ':' + v);
                    } catch (e) { 
                        // this try/catch due to some "Accessing selectionEnd on an input element that cannot have a selection." on Chrome
                    }
                }
            }
            v = partial.length === 0
                ? '{}'
                : '{' + partial.join(',') + '}';
            return v;
        }
    }

    JSON.pruned = function (value, depthDecr, arrayMaxLength) {
        seen = [];
        depthDecr = depthDecr || DEFAULT_MAX_DEPTH;
        arrayMaxLength = arrayMaxLength || DEFAULT_ARRAY_MAX_LENGTH;
        return str('', {'': value}, depthDecr, arrayMaxLength);
    };

}());