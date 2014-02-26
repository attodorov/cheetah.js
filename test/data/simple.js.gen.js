window._p = {};
var x = Class.extend({
        prop1: function () {
            var start = new Date().getTime();
            {
                var ms = new Date().getTime() - start;
                _putstat('prop1', ms);
            }
        },
        prop2: function () {
            var start = new Date().getTime();
            {
                var ms = new Date().getTime() - start;
                _putstat('prop2', ms);
            }
        }
    });