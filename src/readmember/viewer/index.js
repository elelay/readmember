import {getCredentials} from '../settings';

import { EventEmitter } from "events";
import React from "react";
import { render } from "react-dom";

import App from "./components/App";
import Controller from "./controller";
import KintoStore from "./kintoStore";
import ConfigStore from "./configStore";
import GRStore from "./grStore";


const events = new EventEmitter();
const store = new KintoStore("reviews", events);
const configStore = new ConfigStore(events);
const grStore = new GRStore(events);
const controller = new Controller({store, configStore, grStore}, events);

render(<App controller={controller}/>, document.getElementById("app"));

//getCredentials().then(function(creds){
//			document.getElementById("alert-no-goodreads").classList.remove("hide");
//		if(!creds.token || !creds.token.secret){
//			document.getElementById("alert-no-goodreads").classList.remove("hide");
//		} else {
//			/*console.log("Got access token", creds.token);
//			boauth = new BOAuth(creds.credentials.key, creds.credentials.secret);
//			boauth.setToken(creds.token);
//			bgreads.getUser(boauth).then(function(user){
//					console.log("Got user", user);
//					bgreads.setUserId(user.id);
//					return bgreads.getShelves(boauth);
//			}).then(function(shelves){
//				console.log("Got Shelves:", shelves);
//				return bgreads.getReviews(boauth);
//			}).then(function(reviews){
//				console.log("Got Reviews:", reviews);
//				reviews.values().forEach(function(review){
//				});
//			}).catch(function(error){
//				console.error(error);
//			});*/
//		}
//});

document.getElementById("open-settings").addEventListener("click", function(){
		browser.runtime.openOptionsPage()
});