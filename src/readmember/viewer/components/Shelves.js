import React from "react";


class ShelfItem extends React.Component {
  render() {
    return (
      <li>
       	{this.props.item.name} <em>({this.props.item.book_count} books)</em>
      </li>
    );
  }
}


class ShelfList extends React.Component {
  render() {
  	  if(this.props.shelves.shelves){
		return (
		  <ul>{
			this.props.shelves.shelves.map(item => {
			  return <ShelfItem key={item.id}
						   item={item}
					   />;
			})
		  }</ul>
		);
	  } else {
	  	  return (<em>Shelves are empty</em>);
	  }
  }
}


export default class Shelves extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const disabled = (this.props.busy ? "disabled" : "") + " shelves";
    return (
      <div className={disabled}>
      	<h2>My Shelves</h2>
        <div className="error">{this.props.error}</div>
        <ShelfList shelves={this.props.shelves}/>
      </div>
    );
  }
}
