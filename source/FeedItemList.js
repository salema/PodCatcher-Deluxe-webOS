enyo.kind({
	name: "Net.Alliknow.PodCatcher.FeedItemList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectItem: ""
	},
	components: [
		{kind: "WebService", name: "grabFeed", onSuccess: "grabFeedSuccess", onFailure: "grabFeedFailed"},
		{kind: "Header", layoutKind: "HFlexLayout", components: [
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
			this.$.feedItemPublished.setContent(feedItem.pubDate);
			return true;
		}
	},
	
	selectFeedItem: function(inSender, inIndex) {
		var index = this.$.feedListItemsVR.fetchRowIndex();
		var feedItem = this.feedItemList[index];
		
		this.doSelectItem(feedItem);
	},
	
	setFeed: function(feed) {
		this.$.selectedFeedName.setContent("Select \"" + feed.title + "\"");
		this.$.feedItemsSpinner.show();
		
		this.$.grabFeed.setUrl(encodeURI(feed.url));
		this.$.grabFeed.call();
	},
	
	grabFeedSuccess: function(inSender, inResponse, inRequest) {
		var parser = new DOMParser;
		var source = parser.parseFromString(inResponse, "text/xml");
		var items = source.getElementsByTagName("item");
		
		for (var index = 0; index < items.length; index++) {
			var title = items[index].getElementsByTagName("title")[0].firstChild.data;
			var link = items[index].getElementsByTagName("link")[0].firstChild.data;
			var pubDate = items[index].getElementsByTagName("pubDate")[0].firstChild.data;
			
			this.feedItemList.push({
				title: title,
				url: link,
				pubDate: pubDate
			});
		}
		
		this.$.feedListItemsVR.render();
		this.$.feedItemsSpinner.hide();
	}
}); 