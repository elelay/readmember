function getCredentials() {
	return browser.storage.sync.get(["credentials", "token"]);
}

function setCredentials(key, secret) {
	return browser.storage.sync.set({"credentials": {
			key: key,
			secret: secret,
			date: new Date()
		}
	});
}

function setAccessToken(token, secret) {
	return browser.storage.sync.set({"token": {
			token: token,
			secret: secret,
			date: new Date()
		}
	});
}