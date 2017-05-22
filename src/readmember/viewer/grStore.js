import BOAuth from '../boauth';
import BGReads from '../bgreads';

export default class GRStore {

  constructor(events) {
    this.events = events;
    this.creds = {};
    this._resetGR();
  	this.bgreads = new BGReads();
  }

  configure(config) {
    console.log("GRStore.configure(", config,")");
	this.creds = config.creds;
  }
  
  sync(state) {
  	  this.load();
  }

  onError(error) {
  	console.error(error);
    this.events.emit('grstore:busy', false);
    this.events.emit("grstore:error", error);
  }

  onReady() {
    this.events.emit("grstore:change", this.state);
    this.events.emit('grstore:busy', false);
  }

  _execute(promise) {
  	  console.log("_execute");
    this.events.emit('grstore:busy', true);
    return promise
      .then(this.onReady.bind(this))
      .catch(this.onError.bind(this));
  }

  load() {
  	console.log("GRStore.load()");
    return this._execute(
      this._fetchGR()
    );
  }
  
  _resetGR() {
  	  this.state = {
  	  	  shelves: {},
  	  	  reviews: {},
  	  	  status: "",
  	  	  user: {}
  	  };
  }
  
  fetchShelves() {
	  return this.bgreads.getShelves(this.boauth)
	  .then((shelves) => {
	  		  console.log("Got Shelves:", shelves);
	  		  this.state.shelves = shelves;
	  		  this.events.emit("grstore:change", this.state);
	  		  if(shelves.end < shelves.total) {
	  		  	  const batch = shelves.end - shelves.start;
	  		  	  var remainingShelves = [];
	  		  	  for (var i=shelves.end + 1; i <= shelves.total; i+= batch) {
	  		  	  	  remainingShelves.push(
	  		  	  	  	  this.bgreads.getShelves(this.boauth, i)
	  		  	  	  	  .then((more) => {
	  		  	  	  	  		  console.log("More Shelves:", more);
  	  		  	  	  	  		  Array.prototype.push.apply(this.state.shelves.shelves, more.shelves);
  	  		  	  	  	  		  this.state.shelves.end = more.end;
  	  		  	  	  	  		  this.events.emit("grstore:change", this.state);
	  		  	  	  	  }));
	  		  	  }
	  		  	  return Promise.all(remainingShelves);
	  		  }
	  });
  }
  
  fetchReviews(since) {
  	  return this.bgreads.getReviews(this.boauth, 1, since).then(
  	  	  (reviews) => {
  	  		  console.log("Got Reviews:", reviews);
  	  		  this.state.reviews = reviews;
  	  		  this.events.emit("grstore:change", this.state);
  	  		  if(reviews.end < reviews.total) {
  	  		  	  const batch = reviews.end - reviews.start;
  	  		  	  var remaining = [];
  	  		  	  for (var i=reviews.end + 1; i <= reviews.total; i+= batch) {
  	  		  	  	  remaining.push(
  	  		  	  	  	  this.bgreads.getReviews(this.boauth, i, since)
  	  		  	  	  	  .then((more) => {
  	  		  	  	  	  		  console.log("More Reviews:", more);
  	  		  	  	  	  		  Array.prototype.push.apply(this.state.reviews.reviews, more.reviews);
  	  		  	  	  	  		  this.state.reviews.end = more.end;
  	  		  	  	  	  		  this.events.emit("grstore:change", this.state);
  	  		  	  	  	  }));
  	  		  	  }
  	  		  	  return Promise.all(remainingShelves);
  	  		  }
  	  	  }
	  );
  }
  
  _fetchGR() {
  	  var self = this;
  	  return new Promise((resolve, reject) => {
  	  		  console.log("_fetchGR");
  	  		  if(!self.creds.token || !self.creds.token.secret){
  	  		  	  console.log("NO GOODREADS CONFIG", self.creds);
  	  		  	  self._resetGR();
  	  		  	  resolve();
  	  		  } else {
  	  		  	  console.log("Got access token", self.creds.token);
  	  		  	  self.boauth = new BOAuth(self.creds.credentials.key, self.creds.credentials.secret);
  	  		  	  self.boauth.setToken(self.creds.token);
  	  		  	  self.bgreads.getUser(self.boauth).then(function(user){
  	  		  	  		  console.log("Got user", user);
  	  		  	  		  self.state.user = user;
  	  		  	  		  self.events.emit("grstore:change", self.state);
  	  		  	  		  self.bgreads.setUserId(user.id);
  	  		  	  		  
  	  		  	  		  return Promise.all([
  	  		  	  		  		  self.fetchShelves(),
  	  		  	  		  		  self.fetchReviews()
  	  		  	  		  ]).then(resolve).catch(reject);
  	  		  	  }).catch(function(error){
  	  		  	  	  console.error(error);
  	  		  	  	  reject(error);
  	  		  	  });
  	  		  }
	  });
  }

}
