// Show all feeds
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
		{kind: "Header", content: "Discover Podcasts",  style: "min-height: 60px;"},
		{kind: "Net.Alliknow.PodCatcher.AddFeedPopup", name: "addFeedPopup", onAddFeed: "addFeed"},
		{kind: "Scroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "feedListVR", onSetupRow: "getFeed", onclick: "selectFeed", components: [
				{kind: "SwipeableItem", layoutKind: "HFlexLayout", tapHighlight: true, onConfirm: "deleteFeed", components: [
					{name: "listItemTitle", content: ""}
				]}
			]}
		]},
		{kind: "Toolbar", pack: "justify", components: [
			{kind: "ToolButton", caption: "Add", onclick: "showAddFeedPopup"},
			{kind: "ToolButton", caption: "Delete", onclick: "deleteFeed"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.feedList = [];
		this.addTestFeeds();
		
		var storedFeedList = localStorage.getItem("storedFeedList");
		enyo.log(storedFeedList);
		if (storedFeedList != undefined && storedFeedList.length != 0) {
			this.feedList = JSON.parse(storedFeedList);
		}
	},
	
	startup: function() {
		if (this.feedList.length == 0)
			this.showAddFeedPopup();
	},
	
	shutdown: function() {
		localStorage.setItem("feedList", JSON.stringify(this.feedList));
		enyo.log("shutdown called");
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
		
		if (feed) this.doSelectFeed(feed);
	},

	showAddFeedPopup: function(inSender, inIndex) {
		this.$.addFeedPopup.openAtCenter();
		this.$.addFeedPopup.reset();
	},
	
	addFeed: function(inSender, feed) {
		this.feedList.push(feed);
		this.$.feedListVR.render();
	},

	deleteFeed: function(inSender, inIndex) {
		this.feedList.splice(inIndex, 1);
		this.$.feedListVR.render();
	},
	
	addTestFeeds: function() {
		this.feedList.push({
			title: "Linux Outlaws",
			url: "http://feeds.feedburner.com/linuxoutlaws"
		});
		this.feedList.push({
			title: "Eine Stunde Zeit",
			url: "http://www.radioeins.de/archiv/podcast/eine_stunde_zeit.feed.podcast.xml"
		});
		this.feedList.push({
			title: "Greenpeace Podcast",
			url: "http://www.greenpeace-berlin.de/fileadmin/podcast/greencast.xml"
		});
	}
}); 