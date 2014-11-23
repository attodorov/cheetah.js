/* CheetahJS - JavaScript performance analysis framework
 * Copyright Angel Todorov (attodorov@gmail.com)
 * Licensed under BSD 
 */
var fs = require("fs");
var esprima = require("esprima");
//var acorn = require("acorn");
var estraverse = require("estraverse");
var escodegen = require("escodegen");
var start = process.hrtime();
var elapsed_time = function (log) {
	var precision = 3; // 3 decimal places
	var elapsed = process.hrtime(start)[1] / 1000000; 
	console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + log);
	start = process.hrtime();
}
var fname = process.argv.slice(2)[0];
var fnstack = [];
console.log("Opening " + fname);
var _types = [];
fs.readFile(fname, function (err, data) {
	if (err) throw err;
	//var parsed = JSON.stringify(esprima.parse(data), null, 4);
	var ast = esprima.parse(data);
	// inject our script which sends data
	//TODO: code template; make sure to handle SCOPE... different functions with the same name
	var endExprStr = "_putstat('{f}', __start);";
	//var stackExprPush = "{ _pushstack('{f}');}";
	//var stackExprPop = "{ _popstack('{f}');}";
	var startExpr = esprima.parse("var __start = _getstart();").body[0];
	var _compileEndExpr = function (node, parent) {
		// let's say we've got a Return statement which is nested down other statements. for instance an IfStatement
		// we still need to look for variable declarations in order to infer the function name
		// find the closest FunctionExpression which has an AssignmentExpression as a parent
		return esprima.parse(endExprStr.replace(/{f}/g, fnstack[fnstack.length - 1])).body[0];
	};
	/*
	var _compileStackPushExpr = function (node, parent) {
		return esprima.parse(stackExprPush.replace(/{f}/g, fnstack[fnstack.length - 1])).body[0];
	}
	var _compileStackPopExpr = function (node, parent) {
		return esprima.parse(stackExprPop.replace(/{f}/g, fnstack[fnstack.length - 1])).body[0];
	}
	*/
	var stackAddExpr = "__pushstack('{f}');";
	//modify AST as we traverse it
	estraverse.traverse(ast, {
		enter: function (node, parent) {
			//dump different node types
			/*
			if (!_types[node.type]) {
				_types[node.type] = true;
				console.log(node.type); // escodegen.generate(node);
			}
			*/
			if (node.type === "Program") {
				// initialize
				//var headScript = "{ var head = document.getElementsByTagName('head')[0], script = document.createElement('script'); script.src = 'cheetah-collect.js'; head.insertBefore(script, head.firstChild); }";
				//var jqueryScript = "{ var head = document.getElementsByTagName('head')[0], script = document.createElement('script'); script.src = 'http://code.jquery.com/jquery-1.11.0.min.js'; head.insertBefore(script, head.firstChild); }";
				node.body.unshift(esprima.parse("__init__();").body[0]);
				//node.body.unshift(esprima.parse(headScript).body[0]);
				//node.body.unshift(esprima.parse(jqueryScript).body[0]);
				// now add a statement that will push the results to our server
				//node.body.push(esprima.parse("_sendPerfData();").body[0]);
			} else if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
				var funcname = node.id ? (node.id.name ? node.id.name : "anonymous") : "anonymous";
				if (funcname === "anonymous" && parent) {
					if (parent.type === "AssignmentExpression") {
						funcname = "NULL";
						if (parent.left.object && parent.left.object.type === "Identifier") {
							funcname = parent.left.object.name + "." + parent.left.property.name;
						} else if (parent.left.type === "Identifier") {
							funcname = parent.left.name;
						} else if (parent.left.type === "MemberExpression") {
							funcname = parent.left.property.name;
						} else if (parent.left.type === "ThisExpression") {
							funcname = "this." + parent.left.property.name;
						}
					} else if (parent.type === "VariableDeclarator") {
						funcname = parent.id.name;
					} else if (parent.type === "Property") {
						funcname = parent.key.name;
					}
				}
				fnstack.push(funcname);
			}
		},
		leave: function (node, parent) {
			if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") { // want to measure execution of functions
				var exprs = node.body.body;
				var recorded = false;
				exprs.unshift(startExpr);
				// add to stack and set new parent
				exprs.unshift(esprima.parse(stackAddExpr.replace(/{f}/g, fnstack[fnstack.length - 1])).body[0]);
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
					exprs.push(esprima.parse("__popstack();").body[0]);
				}
				//record in callstack (TBD)
				//exprs.push(_compileStackPopExpr(node, parent));
				fnstack.pop();
			} else {
				// make sure we cover all return stmts
				if (node.body) {
					for (var i = 0; i < node.body.length; i++) {
						if (node.body[i].type === "ReturnStatement") {
							//node.body.splice(i, 0, currEndExpr);
							node.body.splice(i, 0, _compileEndExpr(node, parent));
							node.body.splice(i + 1, 0, esprima.parse("__popstack();").body[0]);
							i++;
							break;
						}
					}
				}
			}
		}
	});
	var result = escodegen.generate(ast);
	var stream = fs.createWriteStream(fname.replace(".js", "") + ".gen.js");
		stream.once("open", function (fd) {
		stream.write(result);
		stream.end();
	});
	elapsed_time("parsing " + fname);
});
