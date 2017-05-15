BOAuth2 = 1;

BOAuth = function(key, secret) {
	var self = this;
	self.key = key;
	self.secret = secret;
	self.oauth = OAuth({
			consumer: {
				key: key,
				secret: secret
			},
			signature_method: 'HMAC-SHA1',
			hash_function: function(base_string, key) {
				return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
			}
	});
	self.getToken = function() {
		return new Promise(function(resolve, reject) {
				console.log("getToken(", creds, ")");
				var authData = self.oauth.authorize({
						url: "https://www.goodreads.com/oauth/request_token",
						method: "POST",
						callback: "https://readmember.elelay.fr/m"
				});
				var authHeader = self.oauth.toHeader(authData);
				console.log("getToken", authData, authHeader['Authorization']);
				function onSuccess () {
					if(this.status != 200) {
						console.error("Token request rejected", this.status, this.statusText);
						reject("Token request rejected");
					} else {
						var resp = self.oauth.deParam(this.responseText);
						console.log("Got token", resp);
						if(resp.oauth_token && resp.oauth_token_secret) {
							resolve(resp);
						} else {
							reject("Invalid getToken response: " + this.responseText);
						}
					}
				}
				function onError() {
					console.error("Error getting token");
					reject("Error getting token");
				}
				
				var oReq = new XMLHttpRequest();
				oReq.addEventListener("load", onSuccess);
				oReq.addEventListener("error", onError);
				oReq.open("POST", "https://www.goodreads.com/oauth/request_token");
				oReq.setRequestHeader("Authorization",authHeader['Authorization']);
				oReq.send();
		});
	};
	
	self.authorize = function(token) {
		// https://readmember.elelay.fr/m/?oauth_token=Ij7GDUUSryN54dQUVzN20g&authorize=0
		return new Promise(function(resolve, reject) {
				
				var pattern = "https://readmember.elelay.fr/m/*";
				function interceptToken(requestDetails) {
					var url = new URL(requestDetails.url);
					console.log("Intercept: ", requestDetails);
					var res = self.oauth.deParamUrl(url.search);
					if(res.oauth_token == token.oauth_token){
						res.oauth_token_secret = token.oauth_token_secret; // forward the token secret for getAccessToken
						resolve(res);
					}else{
						console.log("Invalid redirect from authorize:", url.search, "expecting", token.oauth_token);
						reject("Invalid redirect from authorize");
					}
					return {
						cancel: true
					};
				}
				
				browser.webRequest.onBeforeRequest.addListener(
					interceptToken,
					{urls:[pattern]},
					["blocking"]);
				url = "https://www.goodreads.com/oauth/authorize?oauth_token=" + encodeURIComponent(token.oauth_token);
				console.log("opening tab to", url);
				browser.tabs.create({
						url: url
				});
		});
	};
	
	self.getAccessToken = function(token) {
		return new Promise(function(resolve, reject) {
				if(token.authorize === "1"){
					
					var authData = self.oauth.authorize({
							url: "https://www.goodreads.com/oauth/access_token",
							method: "POST"
					}, {
						key: token.oauth_token,
						secret: token.oauth_token_secret
					});
					var authHeader = self.oauth.toHeader(authData);
					console.log("getAccessToken", authData, authHeader['Authorization']);
					function onSuccess () {
						if(this.status != 200) {
							console.error("Access Token request rejected", this.status, this.statusText);
							reject("Access Token request rejected");
						} else {
							var resp = self.oauth.deParam(this.responseText);
							console.log("Got access token", resp);
							if(resp.oauth_token && resp.oauth_token_secret) {
								resolve(resp);
							} else {
								reject("Invalid getAccessToken response: " + this.responseText);
							}
						}
					}
					function onError() {
						console.error("Error getting access token");
						reject("Error getting access token");
					}
					
					var oReq = new XMLHttpRequest();
					oReq.addEventListener("load", onSuccess);
					oReq.addEventListener("error", onError);
					oReq.open("POST", "https://www.goodreads.com/oauth/access_token");
					oReq.setRequestHeader("Authorization",authHeader['Authorization']);
					oReq.send();
					
				} else {
					console.log("User refused access");
					reject("User refused access to goodreads to the application");
				}
		});
	};
	
	self.setToken = function(token) {
		self.token = token;
	}
	
	self.call = function(method, url, token, responseType) {
		return new Promise(function(resolve, reject) {
				
				var authData = self.oauth.authorize({
						url: url.split('?')[0],
						method: method
				}, {
					key: token.token,
					secret: token.secret
				});
				var authHeader = self.oauth.toHeader(authData);
				console.log("call", url, authData, authHeader['Authorization']);
				function onSuccess () {
					resolve(this);
				}
				function onError() {
					console.error("Error calling", method, url);
					reject("Error calling" + url);
				}
				
				var oReq = new XMLHttpRequest();
				oReq.addEventListener("load", onSuccess);
				oReq.addEventListener("error", onError);
				oReq.open(method, url);
				oReq.responseType = responseType || "";
				oReq.setRequestHeader("Authorization",authHeader['Authorization']);
				oReq.send();
		});
	};
	
	self.get = function(url, responseType) {
		return this.call('GET', url, self.token, responseType
			).then(function(oReq){
				if(oReq.status == 200) {
					return Promise.resolve(oReq);
				} else {
					console.error("get", url, token, "non 200 status:", oReq.status, oReq.statusText);
					return Promise.reject("Non 200 status code for get");
				}
			});
	};
};