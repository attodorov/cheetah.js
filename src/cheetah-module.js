/* CheetahJS - JavaScript performance analysis framework
 * Copyright Angel Todorov (attodorov@gmail.com)
 * Licensed under BSD 
 */
var esprima = require("esprima");
var estraverse = require("estraverse");
var escodegen = require("escodegen");

module.exports = {
	instrument: function (src) {
		var fnstack = [];
		var _types = [];
		var ast = esprima.parse(src);
		var endExprStr = "_putstat('{f}', __start);";
		var startExpr = esprima.parse("var __start = _getstart();").body[0];
		var _compileEndExpr = function (node, parent) {
			return esprima.parse(endExprStr.replace(/{f}/g, fnstack[fnstack.length - 1])).body[0];
		};
		var stackAddExpr = "__pushstack('{f}');";
		estraverse.traverse(ast, {
				enter: function (node, parent) {
					if (node.type === "Program") {
						node.body.unshift(esprima.parse("__init__();").body[0]);
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
						exprs.unshift(esprima.parse(stackAddExpr.replace(/{f}/g, fnstack[fnstack.length - 1])).body[0]);
						for (var i = 0; exprs[i] && i < exprs.length; i++) {
							if (exprs[i].type === "ReturnStatement") {
								recorded = true;
								break;
							}
						}
						if (!recorded) {
							exprs.push(_compileEndExpr(node, parent));
							exprs.push(esprima.parse("__popstack();").body[0]);
						}
						fnstack.pop();
					} else {
						// make sure we cover all return stmts
						if (node.body) {
							for (var i = 0; i < node.body.length; i++) {
								if (node.body[i].type === "ReturnStatement") {
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
			return result;
	}
}