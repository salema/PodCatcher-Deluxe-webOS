// Show all feeds
enyo.kind({
	name: "Net.Alliknow.PodCatcher.FeedList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectFeed: ""
	},
	components: [
		{kind: "Header", content: "Discover Podcasts"},
		{kind: "Net.Alliknow.PodCatcher.AddFeedPopup", name: "addFeedPopup", onAddFeed: "addFeed"},
		{kind: "Scroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "feedListVR", onSetupRow: "getFeed", onclick: "selectFeed", components: [
				{kind: "SwipeableItem", layoutKind: "HFlexLayout", tapHighlight: true, onConfirm: "deleteFeed", components: [
					{name: "listItemTitle", content: ""}
				]}
			]}
		]},
		{kind: "Toolbar", pack: "justify", components: [
			{kind: "ToolButton", content: "Add", onclick: "showAddFeedPopup"},
			{kind: "ToolButton", content: "Delete", onclick: "deleteFeed"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.feedList = [];
		this.feedList.push({
			title: "Linux Outlaws",
			url: "http://feeds.feedburner.com/linuxoutlaws"
		});
		this.feedList.push({
			title: "TLTS",
			url: "???"
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
		
		this.doSelectFeed(feed);
	},

	showAddFeedPopup: function(inSender, inIndex) {
		this.$.addFeedPopup.openAtCenter();
	},
	
	addFeed: function(inSender, feed) {
		this.feedList.push(feed);
		this.$.feedListVR.render();
	},

	deleteFeed: function(inSender, inIndex) {
		this.feedList.splice(inIndex, 1);
		this.$.feedListVR.render();
	}
}); 