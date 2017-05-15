var boauth;
var bgreads = new BGReads();
browser.runtime.onMessage.addListener(notify);

function notify(message) {
	console.log("background.js got message", message);
	if(message.event === "getkey"){
		browser.notifications.create({
				"type": "basic",
				"title": "Got Key!",
				"message": "Key:" + message.key + "\n" + message.secret
		});
		setCredentials(message.key, message.secret).then(auth);
	}
}


function auth() {
	return getCredentials().then(function(creds){
			console.log("Working with creds", creds);
			boauth = new BOAuth(creds.credentials.key, creds.credentials.secret);
			return boauth.getToken();
	}).then(function(token){
		console.log("Request token:", token);
		return boauth.authorize(token);
	}).then(function(token) {
		console.log("Authorized context:", token);
		if(token.authorize === "1"){
			return boauth.getAccessToken(token);
		} else {
			console.log("User refused access");
		}
	}).then(function(token) {
		console.log("Access context:", token);
		setAccessToken(token.oauth_token, token.oauth_token_secret);
	}).catch(function(error){
		console.error("Error retrieving token: ", error);
		browser.notifications.create({
				"type": "basic",
				"title": "Error accessing to GoodReads API",
				"message": error
		});
	});
}
/*
getCredentials().then(function(creds){
		if(!creds.token || !creds.token.secret){
			auth();
		} else {
			console.log("Got access token", creds.token);
			boauth = new BOAuth(creds.credentials.key, creds.credentials.secret);
			boauth.setToken(creds.token);
			bgreads.getUser(boauth).then(function(user){
					console.log("Got user", user);
					bgreads.setUserId(user.id);
					return bgreads.getShelves(boauth);
			}).then(function(shelves){
				console.log("Got Shelves:", shelves);
				return bgreads.getReviews(boauth);
			}).then(function(reviews){
				console.log("Got Reviews:", reviews);
			}).catch(function(error){
				console.error(error);
			});
		}
});
*/

function openBookshelves(){
   browser.tabs.create({
     "url": "/pages/index.html"
   });
}

browser.browserAction.onClicked.addListener(openBookshelves);