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

function getKinto() {
	return browser.storage.sync.get(["kinto"]);
}

function setKinto(server, auth, enable) {
	return browser.storage.sync.set({"kinto": {
			server: server,
			auth: auth,
			enable: enable,
			date: new Date()
		}
	});
}

function getConfig() {
	return browser.storage.sync.get();
}
export { getCredentials, setCredentials, setAccessToken };
export { getKinto, setKinto };
export { getConfig };