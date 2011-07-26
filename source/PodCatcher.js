// Main podcatcher kind
// Establishes components and manages some control flow
enyo.kind({
	name: "Net.Alliknow.PodCatcher",
	kind: "VFlexBox",
	components: [
		{kind: "SlidingPane", name: "feedSlidingPane", flex: 1, multiViewMinWidth: 480, components: [
			{kind: "Net.Alliknow.PodCatcher.FeedList", name: "feedListPane", width: "230px", onSelectFeed: "feedSelected"},
			{kind: "Net.Alliknow.PodCatcher.FeedItemList", name: "feedItemListPane", width: "350px", peekWidth: 100, onSelectItem: "itemSelected"},
			{kind: "Net.Alliknow.PodCatcher.ItemView", name: "feedItemViewPane", flex: 1, peekWidth: 250}
		]}
	],
	
	feedSelected: function(inSender, feed) {
		this.$.feedItemListPane.setFeed(feed);
	},
	
	itemSelected: function(inSender, feedItem) {
		this.$.feedItemViewPane.setItem(feedItem);
	}
});