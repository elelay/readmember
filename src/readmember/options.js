import {getConfig, setKinto} from './settings';

const DEFAULT_KINTO = "https://readmember.elelay.fr";

browser.storage.onChanged.addListener(function(changes, areaName){
		if(changes.credentials || changes.token){
			updateOptions();
		}
});

function onRegisterClicked(e){
	const server = document.getElementById("kinto_url").value;
	const u = document.getElementById("kinto_user").value;
	const p = document.getElementById("kinto_password").value;
	// FIXME: user with non ascii characters
	const s = server + "/v1/accounts/" + u;
	console.log("registering", s, p);
	
	
	new Promise(function(resolve, reject) {
		function onSuccess() {
			if (this.status === 401){
				reject("User " + u + "already exists");
			} else if(this.status !== 201){
				console.warn("error registering", u+"@"+s, p, ":", this.status);
				reject("Invalid response code: "+ this.status);
			} else {
				try {
					var response = JSON.parse(this.responseText);
					console.log(response, (response instanceof Object), response.data, response.data.id);
					if((response instanceof Object) && response.data && response.data.id && response.data.id === u) {
						resolve();
					} else {
						console.warn("invalid server response", response);
						reject("invalid server response");
					}
				} catch(e) {
					console.warn("invalid server response", oReq.responseType, oReq.responseText);
					reject("invalid server response");
				}
			}
		}
		
		function onError() {
			console.warn("couldn't connect to", s);
			reject("couldn't connect to "+ s);
		}
		
		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", onSuccess);
		oReq.addEventListener("error", onError);
		oReq.open("PUT", s);
		oReq.setRequestHeader("Content-type", "application/json");
		oReq.send(JSON.stringify({data: {password: p}}));
	}).then(function(){
		document.getElementById("kinto_user").value = "";
		document.getElementById("kinto_password").value = "";
		document.getElementById("kinto_register_feedback").textContent = "Account created!";
		document.getElementById("register_existing").checked = "checked";
		document.getElementById("kinto_auth").value = u + ":" + p;
		const enable = Boolean(document.getElementById("kinto_enable").checked);
		setKinto(server, u + ":" + p, enable).then(function(){
				alert("saved");
		});
	}).catch(function(error){
		document.getElementById("kinto_register_feedback").textContent = error;
	});
}

function onServerChange(e){
	var s = e.target.value + "/v1";
	console.log("server:", s);
	
	new Promise(function(resolve, reject) {
		function onSuccess() {
			if (this.status != 200){
				console.warn("couldn't join", s);
				reject("Invalid response code: "+ this.status);
			} else {
				try {
					var response = JSON.parse(this.responseText);
					if(response instanceof Object && response.capabilities) {
						if(response.capabilities.accounts){
							resolve(true);
						} else {
							resolve(false);
						}
					} else {
						console.warn("invalid server response", response);
						reject("invalid server response");
					}
				} catch(e) {
					console.warn("invalid server response", oReq.responseType, oReq.responseText);
					reject("invalid server response");
				}
			}
		}
		
		function onError() {
			console.warn("couldn't connect to", s);
			reject("couldn't connect to "+ s);
		}
		
		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", onSuccess);
		oReq.addEventListener("error", onError);
		oReq.open("GET", s);
		oReq.send();
	}).then(function(hasAccounts){
		document.getElementById("register_register").disabled = hasAccounts ? null : "disabled";
		document.getElementById("register_existing").disabled = hasAccounts ? null : "disabled";
		document.getElementById("kinto_register_feedback").textContent = "server has account management";
	}).catch(function(error){
		document.getElementById("kinto_register_feedback").textContent = error;
		document.getElementById("register_register").disabled = "disabled";
		document.getElementById("register_existing").disabled = "disabled";
	});
}

function updateOptions(){
	getConfig().then(function(creds){
			console.log("config:", creds);
			document.getElementById("app_key").value = creds.credentials && creds.credentials.key;
			document.getElementById("app_secret").value = creds.credentials && creds.credentials.secret;
			document.getElementById("token").value = creds.token && creds.token.token;
			document.getElementById("token_secret").value = creds.token && creds.token.secret;
			if(!creds.credentials.key){
				document.getElementById("goodreads_enable_link").classList.remove("hide");
				document.getElementById("goodreads_params").classList.add("hide");
			}
			if(creds.kinto) {
				document.getElementById("kinto_enable").checked = creds.kinto.enable;
				document.getElementById("kinto_url").value = creds.kinto.server;
				document.getElementById("kinto_auth").value = creds.kinto.auth;
			} else {
				// TODO: Host in Kinto checkbox should enable/disable block
				document.getElementById("kinto_url").value = DEFAULT_KINTO;
				document.getElementById("register_register").checked = "checked";
				document.getElementById("register_register").disabled = false;
				document.getElementById("register_existing").disabled = false;
				document.getElementById("kinto_register").disabled = false;
			}
	});
	document.getElementById("kinto_url").addEventListener("input", onServerChange);
	document.getElementById("kinto_register").addEventListener("click", onRegisterClicked);
	
	document.getElementById("kinto_save").addEventListener("click", function(e){
			const url = document.getElementById("kinto_url").value;
			const auth = document.getElementById("kinto_auth").value;
			const enable = Boolean(document.getElementById("kinto_enable").checked);
			setKinto(url, auth, enable).then(function(){
					alert("saved");
			});
	});
}
document.addEventListener('DOMContentLoaded', updateOptions);