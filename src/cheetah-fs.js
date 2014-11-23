/* CheetahJS - JavaScript performance analysis framework
 * Copyright Angel Todorov (attodorov@gmail.com)
 * Licensed under BSD 
 */
var fs = require("fs");
var cheetah = require("./cheetah-module");
var fname = process.argv.slice(2)[0];

fs.readFile(fname, function (err, data) {
	var result = cheetah.instrument(data);
	var stream = fs.createWriteStream(fname.replace(".js", "") + ".gen.js");
		stream.once("open", function (fd) {
		stream.write(result);
		stream.end();
	});
});
