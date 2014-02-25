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
	// inject our script which sends data
	//TODO: code template; make sure to handle SCOPE... different functions with the same name
	var endExprStr = "{ var ms = new Date().getTime() - start; _putstat('{f}', ms);}";
	var startExpr = esprima.parse("var start = new Date().getTime();").body[0];
	var _compileEndExpr = function (node, parent) {
		var currEndExpr;
		var funcname = node.id ? (node.id.name ? node.id.name : "anonymous") : "anonymous";
		if (funcname === "anonymous" && parent) {
			if (parent.type === "AssignmentExpression") {
				funcname = "";
				if (parent.left.object && parent.left.object.type === "Identifier") {
					funcname += parent.left.object.name + "." + parent.left.property.name;
				}
			} else if (parent.type === "VariableDeclarator") {
				funcname = parent.id.name;
			}
		}
		return esprima.parse(endExprStr.replace(/{f}/g, funcname)).body[0];
	};
	//modify AST as we traverse it
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
				//var headScript = "{ var head = document.getElementsByTagName('head')[0], script = document.createElement('script'); script.src = 'cheetah-collect.js'; head.insertBefore(script, head.firstChild); }";
				var jqueryScript = "{ var head = document.getElementsByTagName('head')[0], script = document.createElement('script'); script.src = 'http://code.jquery.com/jquery-1.11.0.min.js'; head.insertBefore(script, head.firstChild); }";
				node.body.unshift(esprima.parse("window._p = {};").body[0]);
				//node.body.unshift(esprima.parse(headScript).body[0]);
				node.body.unshift(esprima.parse(jqueryScript).body[0]);
				// now add a statement that will push the results to our server
				//node.body.push(esprima.parse("_sendPerfData();").body[0]);
			}
		},
		leave: function (node, parent) {
			if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") { // want to measure execution of functions
				var exprs = node.body.body;
				var recorded = false;
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
					//exprs.push(currEndExpr);
					exprs.push(_compileEndExpr(node, parent));
				}
			} else {
				// make sure we cover all return stmts
				if (node.body) {
					for (var i = 0; i < node.body.length; i++) {
						if (node.body[i].type === "ReturnStatement") {
							//node.body.splice(i, 0, currEndExpr);
							node.body.splice(i, 0, _compileEndExpr(node, parent));
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
