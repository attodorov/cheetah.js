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
fs.readFile(fname, function (err, data) {
	if (err) throw err;
	//var parsed = JSON.stringify(esprima.parse(data), null, 4);
	var ast = esprima.parse(data);
	//modify AST as we traverse it
	//TODO: this is just a POC for now.
	estraverse.traverse(ast, {
		enter: function (node, parent) {

		},
		leave: function (node, parent) {
			if (node.type === "FunctionDeclaration") {
				var exprs = node.body.body;
				exprs.unshift(esprima.parse("var start = new Date().getTime();").body[0]);
				var expr = esprima.parse("console.log(new Date().getTime() - start);").body[0];
				if (exprs[exprs.length - 1].type === "ReturnStatement") {
					exprs.splice(exprs.length - 1, 0, expr);
				} else {
					exprs.push(expr);
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
