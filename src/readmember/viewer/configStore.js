import {getCredentials, getConfig} from '../settings';

export default class ConfigStore {

  constructor(events) {
    this.events = events;
    this.state = { creds: {} }
  }

  configure() {
  	  console.log("ConfigStore.configure()");
  	  browser.storage.onChanged.addListener((changes, areaName) => {
		if (changes.credentials || changes.token) {
			this.load();
		}
	  });
	  this.load();
  }

  onError(error) {
    this.events.emit('configstore:busy', false);
    this.events.emit("configstore:error", error);
  }

  onReady() {
    this.events.emit("configstore:change", this.state);
    this.events.emit('configstore:busy', false);
  }

  _execute(promise) {
    this.events.emit('configstore:busy', true);
    return promise
      .then(this.onReady.bind(this))
      .catch(this.onError.bind(this));
  }

  load() {
    return this._execute(
      getConfig()
        .then(creds => {
          console.log("ConfigStore got creds:", creds);
          this.state.creds = creds;
        }));
  }

}
