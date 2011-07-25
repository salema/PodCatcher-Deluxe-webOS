// Main podcatcher kind
// Establishes components and manages some control flow
enyo.kind({
	name: "Net.Alliknow.PodCatcher",
	kind: "VFlexBox",
	components: [
		{kind: "SlidingPane", name: "feedSlidingPane", flex: 1, multiViewMinWidth: 480, components: [
			{kind: "Net.Alliknow.PodCatcher.FeedList", name: "feedListPane", width: "300px", onSelectFeed: "feedSelected"},
			{kind: "Net.Alliknow.PodCatcher.FeedItemList", name: "feedItemListPane", width: "300px", peekWidth: 100},
			{kind: "Net.Alliknow.PodCatcher.ItemView", name: "feedItemViewPane", flex: 1, peekWidth: 250}
		]}
	],
	
	feedSelected: function(inSender, feed) {
		enyo.log(feed);
		this.$.feedItemListPane.setHeaderTitle("Select from \"" + feed.title + "\"");
	}
});