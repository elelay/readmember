var Queue = function(){
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


export default class BGReads {
	constructor() {
		this.queue = new Queue();
	}
	
	getXMLText(xml, selector) {
		var elt = xml.querySelector(selector);
		if(elt){
			return elt.textContent;
		}else{
			console.debug("getXMLText", xml, selector, "=", null);
			return null;
		}
	}
	
	getTypedXML(elt) {
		var nil = elt.getAttribute("nil");
		if(nil === "true"){
			return null;
		} else {
			var t = elt.getAttribute("type");
			if(t === "integer"){
				return parseInt(elt.textContent);
			}else if(t === "boolean") {
				return elt.textContent === "true" ? true: false;
			} else if(elt.childElementCount > 0){
				const ret = {};
				for (var i=0; i<elt.children.length; i++) {
					if(elt.children[i] instanceof Element) {
						 ret[elt.children[i].localName] = this.getTypedXML(elt.children[i]);
					}
				}
				return ret;
			} else if(!t){
				return elt.textContent;
			}else{
				console.error("Unexpected type:", t, "in", elt);
			}
		}
	}

	setUserId(userId) {
		this.userId = userId;
	}

	getUser(boauth) {
		var self = this;
		return new Promise(function(resolve, reject){
			self.queue.get(boauth, 'https://www.goodreads.com/api/auth_user')
			     .then(function(oReq){
			     		 //console.log("user_id", oReq.response, oReq.responseXML);
			     		 var userElt = oReq.responseXML.querySelector("user");
			     		 if(userElt) {
			     		 	 var user = {
			     		 	 	 id: userElt.getAttribute("id"),
			     		 	 	 name: self.getXMLText(userElt, "name"),
			     		 	 	 link: self.getXMLText(userElt, "link")
			     		 	 };
			     		 	 console.debug("getUser =>", user);
			     		 	 resolve(user);
			     		 }else{
			     		 	 console.warn("No user in getUser response?", oReq.response);
			     		 	 reject("Can't get user");
			     		 }
			     }).catch(reject);
		});
	}
	
	getShelves(boauth, start) {
		if(!start) {
			start = 1;
		}
		var self = this;
		return new Promise(function(resolve, reject){
			self.queue.get(boauth, 'https://www.goodreads.com/shelf/list.xml?user_id='+self.userId)
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
			     		 	 	 var children = shelfElt.children;
			     		 	 	 for (var j = 0; j < children.length; j++) {
			     		 	 	 	 if(children[j] instanceof Element){
			     		 	 	 	 	 shelf[children[j].localName] = self.getTypedXML(children[j]);
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
	}
	
	getReviews(boauth, start, since){
		if(!start) {
			start = 1;
		}
		var self = this;
		return new Promise(function(resolve, reject){
		    var params = '?v=2&key=' + boauth.key + "&sort=date_updated";
			self.queue.get(boauth, 'https://www.goodreads.com/review/list/' + self.userId + params)
			     .then(function(oReq){
			     		 //console.log("getReviews", oReq.response, oReq.responseXML);

			     		 var reviewsElt = oReq.responseXML.querySelector("reviews");
			     		 if(reviewsElt) {
			     		 	 var reviews = {
			     		 	 	 start: reviewsElt.getAttribute("start"),
			     		 	 	 end: reviewsElt.getAttribute("end"),
			     		 	 	 total: reviewsElt.getAttribute("total"),
			     		 	 	 reviews: []
			     		 	 };
			     		 	 var allReviewElts = reviewsElt.querySelectorAll('review');
			     		 	 console.log("reviews:", allReviewElts);
			     		 	 for(var i=0; i<allReviewElts.length; i++){
			     		 	 	 var reviewElt = allReviewElts[i];
			     		 	 	 var review = {}
			     		 	 	 var children = reviewElt.childNodes;
			     		 	 	 for (var j = 0; j < children.length; j++) {
			     		 	 	 	 if(children[j] instanceof Element){
			     		 	 	 	 	 review[children[j].localName] = self.getTypedXML(children[j]);
			     		 	 	 	 }
			     		 	 	 }
			     		 	 	 reviews.reviews.push(review);
			     		 	 }
			     		 	 console.debug("getReviews(",start,") =>", reviews);
			     		 	 resolve(reviews);
			     		 }else{
			     		 	 console.warn("No review in getReviews response?", oReq.response);
			     		 	 reject("Can't get reviews");
			     		 }
			     		 /*var reviewElts = oReq.responseXML.querySelectorAll("#books tr.review");
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
			     		 resolve(reviews);*/
			     }).catch(reject);
		});
	}
}

