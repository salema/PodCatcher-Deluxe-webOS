enyo.kind({
	name: "Net.Alliknow.PodCatcher.FeedItemList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectItem: ""
	},
	components: [
		{kind: "WebService", name: "grabFeed", onSuccess: "grabFeedSuccess", onFailure: "grabFeedFailed"},
		{kind: "Header", layoutKind: "HFlexLayout", style: "min-height: 60px;", components: [
			{content: "Select", name: "selectedFeedName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1},
			{kind: "Spinner", name: "feedItemsSpinner", align: "right"}
		]},
		{kind: "Scroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "feedListItemsVR", onSetupRow: "getFeedItems", onclick: "selectFeedItem", components: [
				{kind: "Item", layout: "HFlexBox", tapHighlight: true, components: [
					{name: "feedItemTitle", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", content: ""},
					{name: "feedItemPublished", style: "font-size: 0.75em", content: ""}
				]}
			]}
		]},
		{kind: "Toolbar", components: [
			{kind: "GrabButton"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.feedItemList = [];
	},
	
	getFeedItems: function(inSender, inIndex) {
		var feedItem = this.feedItemList[inIndex];

		if (feedItem) {
			this.$.feedItemTitle.setContent(feedItem.title);
			//var pubDate = new Date(feedItem.pubDate);
			//var formatter = new enyo.g11n.DateFmt();
			//var string = formatter.prototype.format(pubDate);
			this.$.feedItemPublished.setContent(feedItem.pubDate);
			return true;
		}
	},
	
	selectFeedItem: function(inSender, inIndex) {
		var index = this.$.feedListItemsVR.fetchRowIndex();
		var feedItem = this.feedItemList[index];
		
		if (feedItem) this.doSelectItem(feedItem);
	},
	
	setFeed: function(feed) {
		this.$.selectedFeedName.setContent("Select from \"" + feed.title + "\"");
		this.$.feedItemsSpinner.show();
		
		this.feedItemList = [];
		this.$.feedListItemsVR.render();
		
		this.$.grabFeed.setUrl(encodeURI(feed.url));
		this.$.grabFeed.call();
	},
	
	grabFeedSuccess: function(inSender, inResponse, inRequest) {
		var parser = new DOMParser;
		var source = parser.parseFromString(inResponse, "text/xml");
		var items = source.getElementsByTagName("item");
		
		for (var index = 0; index < items.length; index++) {
			var title = items[index].getElementsByTagName("title")[0].firstChild.data;
			var link = items[index].getElementsByTagName("enclosure")[0].getAttribute("url");
			var pubDate = items[index].getElementsByTagName("pubDate")[0].firstChild.data;
			var description = items[index].getElementsByTagName("description")[0].firstChild.data;
			
			this.feedItemList.push({
				title: title,
				url: link,
				pubDate: pubDate,
				description: description
			});
		}
		
		this.$.feedListItemsVR.render();
		this.$.feedItemsSpinner.hide();
	},
	
	grabFeedFailed: function() {
		enyo.log("Failed to load feed");
	}
}); 