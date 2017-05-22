import btoa from "btoa";

import Kinto from "kinto";


export default class KintoStore {
	
	constructor(dataset, events) {
		this.state = {items: []};
		this.dataset = dataset;
		this.events = events;
		this.collection = null;
		this.pending = null;
	}
	
	configure(config) {
		try {
			var kinto;
			if(config.kinto && config.kinto.enable){
				
				const userpass64 = btoa(config.auth);
				const headers = {Authorization: "Basic " + userpass64};

				kinto = new Kinto({
						remote: config.server,
						dbPrefix: config.user,
						headers: headers
				});
			} else {
				kinto = new Kinto({
						//remote: connection.server,
						dbPrefix: config.user,
						//headers: connection.headers
				});
			}
			this.collection = kinto.collection(this.dataset);
			//this.collection.events.on("change", this.load.bind(this));
		}
		catch (e) {
			this.onError(e);
		}
		this.load().then(() => { this.events.emit('store:loaded', this.state); });
	}
	
	onError(error) {
		this.events.emit('store:busy', false);
		this.events.emit("store:error", error);
	}
	
	onReady() {
		this.events.emit("store:change", this.state);
		this.events.emit('store:busy', false);
	}
	
	_execute(promise) {
		this.events.emit('store:busy', true);
		return promise
		.then(this.onReady.bind(this))
		.catch(this.onError.bind(this));
	}
	
	load() {
		return this._execute(
			this.collection.list()
			.then(res => {
					this.state.items = res.data;
					console.log("Kinto loaded");
			}));
	}
	
	clear() {
		return this._execute(
			this.collection.clear()
			.then(res => {
					this.state.items = [];
					console.log("Kinto cleared");
			}));
	}
	
	create(record) {
		return this._execute(
			this.collection.create(record)
			.then(res => {
					this.state.items.push(res.data);
					console.log("created", res.data.gr_id);
			}));
	}
	
	update(record) {
		return this._execute(
			this.collection.update(record)
			.then(res => {
					console.log("updated", res.data.gr_id);
					this.state.items = this.state.items.map(item => {
							return item.id === record.id ? res.data : item;
					});
			}));
	}
	
	delete(record) {
		return this._execute(
			this.collection.delete(record.id)
			.then(res => {
					this.state.items = this.state.items.filter(item => {
							return item.id !== record.id;
					});
			}));
	}
	
	sync() {
		this.events.emit('store:busy', true);
		this.collection.sync({strategy: Kinto.syncStrategy.SERVER_WINS})
		.then(this.load.bind(this))
		.catch(this.onError.bind(this));
	}
	
	_grToK(r) {
		var cpy = {};
		for(var p in r) {
			cpy[p] = r[p];
		}
		cpy.gr_id = cpy.id;
		delete cpy.id;
		return cpy;
	}
	
	_mergeFields(mine, r) {
		var changed = false;
		for(var k in r){
			if(mine.hasOwnProperty(k)){
				if(mine[k] !== r[k]) {
					mine[k] = r[k];
					changed = true;
				}
			} else {
				mine[k] = r[k];
				changed = true;
			}
		}
		return changed;
	}
	
	grMerge(changes) {
		console.log("grMerge", changes.reviews); //, changes.reviews.reviews.map(r => { return r.id; }), this.state.items.map(r => { return r.gr_id; }));
		if(changes.reviews.reviews){
			
			var delayed = () => {
				const todo = [];
				changes.reviews.reviews.forEach(r => {
						r = this._grToK(r);
						var mine = this.state.items.find(x => {return x.gr_id == r.gr_id;});
						if (mine) {
							var changed = this._mergeFields(mine, r);
							if(changed){
								console.log("changed GR item:", r);
								todo.push(this.update(mine));
							}
						} else {
							console.log("new GR item:", r.gr_id);
							todo.push(this.create(r));
						}
				});
				var m = Promise.all(todo).then(() => {
						if (this.pending === m) {
							this.pending = null;
						}
				}).catch((error) => {
					if (this.pending === m) {
						this.pending = null;
					}
					console.error(error);
				});
				return m;
			};
			
			if (this.pending === null) {
				this.pending = delayed();
			} else {
				this.pending = this.pending.then(() =>{
						this.pending = delayed();
				});
			}
		}
	}
}
