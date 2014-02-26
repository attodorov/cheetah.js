var express = require("express");
var app = express();
app.use(express.bodyParser());

var data;

app.all("*", function (req, res, next) {
	if (!req.get("Origin")) {
		return next();
	}
	//res.set("Access-Control-Allow-Origin", "*");
	//res.set("Access-Control-Allow-Methods", "GET, POST");
	//res.set("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
	if ("OPTIONS" === req.method) {
		return res.send(200);
	}
	next();
});
app.use("/", express.static(__dirname));

app.post("/api/collect", function (req, res) {
	data = JSON.parse(req.body.data);
});

app.get("/api/stats", function (req, res) {
	res.json(data);
});

app.listen(12346);