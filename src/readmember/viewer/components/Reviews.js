import React from "react";


class ReviewItem extends React.Component {
  render() {
    return (
      <li className="review">
      	<a href={this.props.item.book.link}>
      		<img src={this.props.item.book.small_image_url} alt={this.props.item.book.title} />
		</a>
       	{this.props.item.book.title} <em>{this.props.item.book.authors.author.name}</em>
      </li>
    );
  }
}


class ReviewList extends React.Component {
  render() {
  	  if(this.props.reviews.length){
		return (
		  <ul>{
			this.props.reviews.map(item => {
			  return <ReviewItem key={item.id}
						   item={item}
					   />;
			})
		  }</ul>
		);
	  } else {
	  	  return (<em>No Review</em>);
	  }
  }
}


export default class Reviews extends React.Component {

  render() {
    const disabled = (this.props.busy ? "disabled" : "") + " reviews";
    var reviews = Object.values(this.props.reviews);
    return (
      <div className={disabled}>
      	<h2>My Reviews</h2>
        <div className="error">{this.props.error}</div>
        <ReviewList reviews={reviews}/>
      </div>
    );
  }
}
