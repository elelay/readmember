Queue = function(){
	var self = this;

	var requestQueue = [];
	
	function poll(){
		var req = requestQueue.shift();
		console.debug("polling got", req);
		if(req) {
			req();
		} else {
			console.debug("stop polling", req);
			clearInterval(self.pollId);
			delete self.pollId;
		}
	};
	
	function enqueue(req) {
		requestQueue.push(req);
		if (!self.pollId){
			self.pollId = setInterval(poll, 1000);
			poll();
		}
	}
	
	self.get = function(boauth, url, responseType) {
		return new Promise(function(resolve, reject) {
				enqueue(function(){
					boauth.get(url, responseType)
					      .then(resolve)
					      .catch(reject);
				});
		});
	};
	
}


BGReads = function() {
	var self = this;
	self.queue = new Queue();
	
	function getXMLText(xml, selector) {
		var elt = xml.querySelector(selector);
		if(elt){
			return elt.textContent;
		}else{
			console.debug("getXMLText", xml, selector, "=", null);
			return null;
		}
	}
	
	function getTypedXML(elt) {
		var nil = elt.getAttribute("nil");
		if(nil === "true"){
			return null;
		} else {
			var t = elt.getAttribute("type");
			if(t === "integer"){
				return parseInt(elt.textContent);
			}else if(t === "boolean") {
				return elt.textContent === "true" ? true: false;
			} else if(!t){
				return elt.textContent;
			}else{
				console.error("Unexpected type:", t, "in", elt);
			}
		}
	}

	self.setUserId = function(userId) {
		self.userId = userId;
	};

	self.getUser = function(boauth) {
		return new Promise(function(resolve, reject){
			self.queue.get(boauth, 'https://www.goodreads.com/api/auth_user')
			     .then(function(oReq){
			     		 //console.log("user_id", oReq.response, oReq.responseXML);
			     		 var userElt = oReq.responseXML.querySelector("user");
			     		 if(userElt) {
			     		 	 var user = {
			     		 	 	 id: userElt.getAttribute("id"),
			     		 	 	 name: getXMLText(userElt, "name"),
			     		 	 	 link: getXMLText(userElt, "link")
			     		 	 };
			     		 	 console.debug("getUser =>", user);
			     		 	 resolve(user);
			     		 }else{
			     		 	 console.warn("No user in getUser response?", oReq.response);
			     		 	 reject("Can't get user");
			     		 }
			     }).catch(reject);
		});
	};
	
	self.getShelves = function(boauth, start) {
		if(!start) {
			start = 1;
		}
		return new Promise(function(resolve, reject){
			self.queue.get(boauth, 'https://www.goodreads.com/shelf/list.xml')
			     .then(function(oReq){
			     		 //console.log("user_id", oReq.response, oReq.responseXML);
			     		 var shelvesElt = oReq.responseXML.querySelector("shelves");
			     		 if(shelvesElt) {
			     		 	 var shelves = {
			     		 	 	 start: shelvesElt.getAttribute("start"),
			     		 	 	 end: shelvesElt.getAttribute("end"),
			     		 	 	 total: shelvesElt.getAttribute("total"),
			     		 	 	 shelves: []
			     		 	 };
			     		 	 var allShelvesElt = shelvesElt.querySelectorAll('user_shelf');
			     		 	 console.log("shelves:", allShelvesElt);
			     		 	 for(var i=0; i<allShelvesElt.length; i++){
			     		 	 	 var shelfElt = allShelvesElt[i];
			     		 	 	 var shelf = {}
			     		 	 	 var children = shelfElt.childNodes;
			     		 	 	 for (var j = 0; j < children.length; j++) {
			     		 	 	 	 if(children[j] instanceof Element){
			     		 	 	 	 	 shelf[children[j].localName] = getTypedXML(children[j]);
			     		 	 	 	 }
			     		 	 	 }
			     		 	 	 shelves.shelves.push(shelf);
			     		 	 }
			     		 	 console.debug("getShelves(",start,") =>", shelves);
			     		 	 resolve(shelves);
			     		 }else{
			     		 	 console.warn("No shelves in getShelves response?", oReq.response);
			     		 	 reject("Can't get shelves");
			     		 }
			     }).catch(reject);
		});
	};
	
	self.getReviews = function(boauth, start){
		if(!start) {
			start = 1;
		}
		return new Promise(function(resolve, reject){
			self.queue.get(boauth, 'https://www.goodreads.com/review/list/' + self.userId + '?v=2', "document")
			     .then(function(oReq){
			     		 console.log("getReviews", oReq.response, oReq.responseXML);
			     		 var reviewElts = oReq.responseXML.querySelectorAll("#books tr.review");
			     		 console.log("getReviews found", reviewElts.length, "reviews");
			     		 var reviews = {};
			     		 for(var i=0; i<reviewElts.length; i++) {
			     		 	 var elt = reviewElts[i];
			     		 	 var revid = elt.getAttribute("id");
			     		 	 if(revid.startsWith('review_')){
			     		 	 	 revid = revid.substring('review_'.length);
			     		 	 }
			     		 	 if(!revid){
			     		 	 	 console.warn("Unable to find review id in", elt);
			     		 	 	 continue;
			     		 	 }
			     		 	 var review = {
			     		 	 	 id: revid
			     		 	 };
			     		 	 var coverElt = elt.querySelector('img#cover_review' + revid);
			     		 	 if(coverElt){
			     		 	 	 review.cover = coverElt.getAttribute("src");
			     		 	 }
			     		 	 var titleElt = elt.querySelector('.field.title a');
			     		 	 if(titleElt){
			     		 	 	 review.title = titleElt.getAttribute("title");
			     		 	 	 review.book_link = titleElt.getAttribute("href");
			     		 	 }
			     		 	 ['isbn', 'isbn13', 'asin', 'num_pages', 'avg_rating', 'num_ratings', 'date_pub', 'date_pub_edition', 'read_count', 'date_started', 'date_read', 'date_added', 'owned', 'format'].forEach(function(f){
			     		 	 	 var field = elt.querySelector('.field.' + f);
			     		 	 	 if (field) {
			     		 	 	 	 var value = field.querySelector('.value').textContent.trim();
			     		 	 	 	 review[f] = value;
			     		 	 	 }
			     		 	 });
			     		 	 reviews[revid] = review;
			     		 }
			     		 console.debug("getReviews =>", reviews);
			     		 resolve(reviews);
			     }).catch(reject);
		});
	};
};