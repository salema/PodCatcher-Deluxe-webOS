// Copyright 2011 Kevin Hausmann
//
// This file is part of Yet Another Simple Pod Catcher.
//
// Yet Another Simple Pod Catcher is free software: you can redistribute it 
// and/or modify it under the terms of the GNU General Public License as 
// published by the Free Software Foundation, either version 3 of the License,
// or (at your option) any later version.
//
// Yet Another Simple Pod Catcher is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Yet Another Simple Pod Catcher. If not, see <http://www.gnu.org/licenses/>.

// Show list all feeds as a sliding pane
// Throws event on feed selection to be handled by owner
enyo.kind({
	name: "Net.Alliknow.PodCatcher.FeedList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectFeed: ""
	},
	components: [
		{kind: "ApplicationEvents", onLoad: "startup"},
		{kind: "ApplicationEvents", onUnload: "shutdown"},
		{kind: "SystemService", name: "preferencesService"},
		{kind: "Net.Alliknow.PodCatcher.AddFeedPopup", name: "addFeedPopup", onAddFeed: "addFeed"},
		{kind: "Header", content: "Discover Podcasts",  style: "min-height: 60px;"},
		{kind: "Scroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "feedListVR", onSetupRow: "getFeed", onclick: "selectFeed", components: [
				{kind: "SwipeableItem", layoutKind: "HFlexLayout", tapHighlight: true, onConfirm: "deleteFeed", components: [
					{name: "listItemTitle", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", content: ""}
				]}
			]}
		]},
		{kind: "Image", name: "feedImage", style: "width: 80%; margin: 10px;", src: "icons/icon128.png"},
		{kind: "Toolbar", pack: "justify", components: [
			{kind: "ToolButton", caption: "Add", onclick: "showAddFeedPopup", flex: 1},
			{kind: "ToolButton", name: "deleteButton", caption: "Delete", onclick: "deleteFeed"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.$.preferencesService.call(
		{
			keys: ["storedFeedList"]
		},
		{
			method: "getPreferences",
			onSuccess: "gotPreferences",
			onFailure: "gotPreferencesFailure"
		});
		
		this.feedList = [];
	},
	
	gotPreferences: function(inSender, inResponse) {
		if (inResponse.storedFeedList == undefined) return;
		
		for (var index = 0; index < inResponse.storedFeedList.length; index++) {
			this.feedList.push(inResponse.storedFeedList[index]);
		}
				
		this.$.feedListVR.render();
	},
	
	gotPreferencesFailure: function(inSender, inResponse) {
		enyo.log("got failure from preferencesService");
	},
	
	startup: function() {
		if (this.feedList.length == 0) {
			this.$.deleteButton.setDisabled(true);
			this.showAddFeedPopup();
		}
	},
	
	shutdown: function() {
		enyo.log("shutdown called");
		this.$.preferencesService.call(
		{
			keys: {
				"storedFeedList": this.feedList
			}
		},
		{
			method: "setPreferences"
		});
	},
	
	getFeed: function(inSender, inIndex) {
		var feed = this.feedList[inIndex];
		
		if (feed) {
			this.$.listItemTitle.setContent(feed.title);
			return true;
		}
	},
	
	selectFeed: function(inSender, inIndex) {
		var index = this.$.feedListVR.fetchRowIndex();
		var feed = this.feedList[index];
		
		if (feed) {
			this.$.deleteButton.setDisabled(false);
			this.doSelectFeed(feed);
		}
	},

	showAddFeedPopup: function(inSender, inIndex) {
		this.$.addFeedPopup.openAtCenter();
		this.$.addFeedPopup.reset();
	},
	
	addFeed: function(inSender, feed) {
		this.feedList.push(feed);
		this.$.feedListVR.render();
		
		this.$.deleteButton.setDisabled(false);
	},

	deleteFeed: function(inSender, inIndex) {
		// Make this work for the button as well
		if (inIndex instanceof MouseEvent) inIndex = this.$.feedListVR.fetchRowIndex();
		
		this.feedList.splice(inIndex, 1);
		this.$.feedListVR.render();
		
		if (this.feedList.length == 0 ||
				this.$.feedListVR.fetchRowIndex() >= this.feedList.length) this.$.deleteButton.setDisabled(true);
	},
	
	addTestFeeds: function() {
		this.feedList.push({
			title: "Letter for Gaelic Learners",
			url: "http://downloads.bbc.co.uk/podcasts/scotland/litirbheag/rss.xml"
		});
		this.feedList.push({
			title: "BBC World Update: Daily Commute",
			url: "http://downloads.bbc.co.uk/podcasts/worldservice/worldupmc/rss.xml"
		});
		this.feedList.push({
			title: "Burmese Morning Broadcast",
			url: "http://downloads.bbc.co.uk/podcasts/worldservice/burmorning/rss.xml"
		});
		this.feedList.push({
			title: "Newshour",
			url: "http://downloads.bbc.co.uk/podcasts/worldservice/newshour/rss.xml"
		});
		this.feedList.push({
			title: "Anderson Cooper 360°",
			url: "http://rss.cnn.com/services/podcasting/ac360/rss"
		});
	}
}); 