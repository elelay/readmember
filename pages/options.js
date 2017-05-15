browser.storage.onChanged.addListener(function(changes, areaName){
		if(changes.credentials || changes.token){
			updateOptions();
		}
});

function updateOptions(){
	getCredentials().then(function(creds){
			document.getElementById("app_key").value = creds.credentials && creds.credentials.key;
			document.getElementById("app_secret").value = creds.credentials && creds.credentials.secret;
			document.getElementById("token").value = creds.token && creds.token.token;
			document.getElementById("token_secret").value = creds.token && creds.token.secret;
			if(!creds.credentials.key){
				document.getElementById("goodreads_enable_link").classList.remove("hide");
				document.getElementById("goodreads_params").classList.add("hide");
			}
	});
}
updateOptions();