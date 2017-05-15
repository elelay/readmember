var key, secret;
function getKey() {
	var cnt = document.querySelector('.bigBox');
	if(cnt) {
		var re = /key:\s*([^\s]+)/;
		var m = re.exec(cnt.innerText);
		if(m) {
			key = m[1];
		}
		re = /secret:\s*([^\s]+)/;
		m = re.exec(cnt.innerText);
		if(m) {
			secret = m[1];
		}
	}
	console.log("Key: " + key + ", Secret: " + secret);
	browser.runtime.sendMessage({
		event: "getkey",
		key: key,
		secret: secret
	});
}
getKey();