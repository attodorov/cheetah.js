function _sendPerfData () {
	//serialize and send contents of window._p to the server which listens for data
	$.post("http://localhost:12346/api/collect", {
		contentType : 'application/json',
		dataType: "json",
		data: JSON.stringify(window._p)
	});
}
function _putstat(name, duration) {
	if (!window._p[name]) {
		window._p[name] = {
			count: 0,
			avg: 0,
			sum: 0
		}; 
	}
	window._p[name].count++;
	window._p[name].sum += duration;
	window._p[name].avg = (window._p[name].avg + duration) / 2; 
}