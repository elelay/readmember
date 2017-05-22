const DEFAULT_SERVER = "https://kinto.dev.mozaws.net/v1";


export default class Controller {

  constructor(components, events) {
    this.store = components.store;
    this.configStore = components.configStore;
    this.grStore = components.grStore;
    this.events = events;

    this.events.on('configstore:change', this.onConfigChange.bind(this));
    this.events.on('grstore:change', this.onGRChange.bind(this));
    this.events.on('store:loaded', this.onStoreLoaded.bind(this));

    this.events.on('action:start', this.onStart.bind(this));
    this.events.on('action:configure', this.onConfigure.bind(this));
    this.events.on('action:create', this.onCreate.bind(this));
    this.events.on('action:update', this.onUpdate.bind(this));
    this.events.on('action:delete', this.onDelete.bind(this));
    this.events.on('action:sync', this.onSync.bind(this));
    this.events.on('action:clear', this.onClear.bind(this));
    //this.events.on('action:gr-fetch', this.onGRFetch.bind(this));
  }

  on(events, callback) {
    const names = events.split(/\s*,\s*/);
    names.forEach(event => this.events.on(event, callback));
  }

  dispatch(name, data) {
    this.events.emit(name, data);
  }

  onStart() {
    this.dispatch('action:configure', {});
  }

  onConfigure() {
    this.configStore.configure();
  }

  onCreate(record) {
    this.store.create(record);
  }

  onUpdate(record) {
    this.store.update(record);
  }

  onDelete(record) {
    this.store.delete(record);
  }

  onSync() {
    this.store.sync();
  }
  
  onClear() {
    this.store.clear();
  }

  onConfigChange(config) {
  	  console.log("onConfigChange");
  	  this.grStore.configure(config);
  	  this.store.configure(config);
  }
  
  onGRChange(changes) {
  	  console.log("onGRChange");
  	  this.store.grMerge(changes);
  }
  
  onStoreLoaded(state) {
  	  console.log("onStoreLoaded");
  	  this.grStore.sync(state);
  }
}
