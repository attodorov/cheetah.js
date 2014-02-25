/* CheetahJS - JavaScript performance analysis framework
 * Copyright Angel Todorov (attodorov@gmail.com)
 * Licensed under BSD 
 */
var fs = require("fs");
var esprima = require("esprima");
var acorn = require("acorn");
var estraverse = require("estraverse");
var escodegen = require("escodegen");
var start = process.hrtime();
var elapsed_time = function (log) {
	var precision = 3; // 3 decimal places
	var elapsed = process.hrtime(start)[1] / 1000000; 
	console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + log);
	start = process.hrtime();
}
//console.log(JSON.stringify(esprima.parse("var answer = 42;"), null, 4));
var fname = process.argv.slice(2)[0];
console.log("Opening " + fname);
var _types = [];
fs.readFile(fname, function (err, data) {
	if (err) throw err;
	//var parsed = JSON.stringify(esprima.parse(data), null, 4);
	var ast = esprima.parse(data);
	// time for some metadata
	//var startExpr = esprima.parse("var start = new Date().getTime();").body[0];

	//TODO: code template; make sure to handle SCOPE... different functions with the same name
	var endExprStr = "{ var end = new Date().getTime() - start; if (!window._p['{f}']) {window._p['{f}'] = {count: 0, avg: 0}; } window._p['{f}'].count++; window._p['{f}'].avg = (window._p['{f}'].avg + end) / 2; }";

	//var _compilestart = function (id) {
	var startExpr = esprima.parse("var start = new Date().getTime();").body[0];
	//	return startExpr;
	//};
	//var _compileend = function (id) {
	//	var endExpr = esprima.parse("console.log(new Date().getTime() - start);").body[0];
	//	return endExpr;
	//}

	//modify AST as we traverse it
	//TODO: this is just a POC for now.
	estraverse.traverse(ast, {
		enter: function (node, parent) {
			//dump different node types
			/*
			if (!_types[node.type]) {
				_types[node.type] = true;
				console.log(node.type);
			}
			*/
			if (node.type === "Program") {
				// initialize
				node.body.unshift(esprima.parse("window._p = [];").body[0]);
			}
		},
		leave: function (node, parent) {
			var currEndExpr;
			if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") { // want to measure execution of functions
				var exprs = node.body.body;
				currEndExpr = esprima.parse(endExprStr.replace(/{f}/g, node.id ? node.id.name : "anonymous")).body[0];
				var recorded = false;
				/*
				var startExpr = null;
				if (node.id) {
					// we are dealing with a named function (as opposed to anonymous)
					startExpr = _compilestart(node.id);
				} else {
					// check if we aren't dealing with a func. assignment
					startExpr = _compilestart(null);
				}
				*/
				exprs.unshift(startExpr);
				// need to find all Return statements and process them recursively, cannot rely on the last expression
				for (var i = 0; exprs[i] && i < exprs.length; i++) {
					if (exprs[i].type === "ReturnStatement") {
						//exprs.splice(i, 0, endExpr);
						//i++;
						recorded = true;
						break;
					}
				}
				if (!recorded) {
					exprs.push(currEndExpr);
				}
			} else {
				// make sure we cover all return stmts
				if (node.body) {
					for (var i = 0; i < node.body.length; i++) {
						if (node.body[i].type === "ReturnStatement") {
							currEndExpr = esprima.parse(endExprStr.replace(/{f}/g, node.id ? node.id.name : "anonymous")).body[0];
							node.body.splice(i, 0, currEndExpr);
							i++;
							break;
						}
					}
				}
			}
		}
	});
	var result = escodegen.generate(ast);
	var stream = fs.createWriteStream(fname + ".gen.js");
		stream.once("open", function (fd) {
		stream.write(result);
		stream.end();
	});
	elapsed_time("parsing " + fname);
});
