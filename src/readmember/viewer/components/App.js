import React, { PropTypes } from "react";

import Shelves from './Shelves';
import Reviews from './Reviews';

export class Form extends React.Component {
  static contextTypes = {
    controller: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {record: this.props.record || {}};
  }

  onFormSubmit(event) {
    event.preventDefault();
    const action = this.props.record ? 'update' : 'create';
    this.context.controller.dispatch(`action:${action}`, this.state.record);
  }

  onChange(field, event) {
    const newrecord = Object.assign({}, this.state.record, {[field]: event.target.value});
    this.setState({record: newrecord});
  }

  render() {
    return (
      <form onSubmit={this.onFormSubmit.bind(this)}>
        <input autofocus name="label" type="text"
               placeholder="Label"
               value={this.state.record.label}
               onChange={this.onChange.bind(this, "label")} />
        <button type="submit">{this.props.record ? "Save" : "Add"}</button>
      </form>
    );
  }
}


export class Item extends React.Component {
  static contextTypes = {
    controller: PropTypes.object.isRequired
  };

  onItemClick() {
    this.context.controller.dispatch('action:edit', this.props.index)
  }

  onDeleteClick() {
    this.context.controller.dispatch('action:delete', this.props.item);
  }

  render() {
    if (!this.props.editing) {
      return (
        <li key={this.props.index} className={this.props.item._status}
            onClick={this.onItemClick.bind(this)}>{this.props.item.label}</li>
      );
    }
    return (
      <li key={this.props.index}>
        <Form record={this.props.item}/>
        <button onClick={this.onDeleteClick.bind(this)}>Delete</button>
      </li>
    );
  }
}


export class List extends React.Component {
  static contextTypes = {
    controller: PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this.state = {current: null};
  }

  componentDidMount() {
    this.context.controller.on("action:edit", (index) => {
      this.setState({current: index});
    });
    this.context.controller.on("action:update, action:delete", () => {
      this.setState({current: null});
    });
  }

  render() {
    return (
      <ul>{
        this.props.items.map((item, i) => {
          return <Item key={i}
                       index={i}
                       item={item}
                       editing={i === this.state.current}/>;
        })
      }</ul>
    );
  }
}


export class Preferences extends React.Component {
  static contextTypes = {
    controller: PropTypes.object.isRequired
  };

  onChange(event) {
    const config = {server: event.target.value};
    this.context.controller.dispatch("action:configure", config);
  }

  render() {
    return (
      <div className="preferences">
        <input id="toggle" type="checkbox"></input>
        <label htmlFor="toggle">Preferences</label>
        <form>
          <label>Server
            <input value={this.props.server}
                   onChange={this.onChange.bind(this)}/>
          </label>
        </form>
      </div>
    );
  }
}


export default class App extends React.Component {
  static childContextTypes = {
    controller: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {loaded: false, busy: false, error: "", shelves: {}, reviews: {}, user: {}};
  }

  getChildContext() {
    // Pass the controller to child components.
    return {
      controller: this.props.controller
    };
  }

  componentDidMount() {
    this.props.controller.on("grstore:busy", state => {
      console.log("grstore:busy", state);
      this.setState({busy: state, error: ""});
    });
    this.props.controller.on("grstore:change", state => {
      const {shelves, user} = state;
      console.log("App recv grstore:change", state);
      this.setState({shelves, user});
    });
    this.props.controller.on("grstore:error", error => {
      this.setState({error: error.message});
    });
    this.props.controller.on("config:change", config => {
      this.setState({server: config.server});
    });
    this.props.controller.on("store:change", state => {
      console.log("App recv store:change", state);
      this.setState({loaded: true, reviews: state.items});
    });

    // Start the application!
    this.props.controller.dispatch('action:start');
  }

  onSyncClick() {
    this.props.controller.dispatch('action:sync');
  }
  
  onGRClick() {
    this.props.controller.dispatch('action:gr-fetch');
  }

  onClear() {
    this.props.controller.dispatch('action:clear');
  }

  render() {
  	if(this.state.loaded) {
		const disabled = this.state.busy ? "disabled" : "";
		return (
		  <div className={disabled}>
			<div className="error">{this.state.error}</div>
			<p>Goodreads user: <em>{this.state.user.name}</em></p>
			<Shelves busy={this.state.busy} shelves={this.state.shelves}/>
			<Reviews busy={this.state.busy} reviews={this.state.reviews}/>
			<button onClick={this.onGRClick.bind(this)} disabled={disabled}>Fetch Reviews!</button>
			<button onClick={this.onSyncClick.bind(this)} disabled={disabled}>Sync!</button>
			<button onClick={this.onClear.bind(this)} disabled={disabled} className="danger">Clear</button>
		  </div>
		);
	} else {
		return (<em class="placeholder">Loading...</em>);
	}
  }
}
