enyo.kind({
	name: "Net.Alliknow.PodCatcher.FeedItemList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	components: [
		{kind: "Header", layoutKind: "HFlexLayout", components: [
			{content: "Select", name: "selectedFeedName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1},
			{kind: "Spinner", name: "feedItemsSpinner", align: "right"}
		]},
		{kind: "Scroller", flex: 1, components: []},
		{kind: "Toolbar", components: [
			{kind: enyo.GrabButton}
		]}
	],
	
	setHeaderTitle: function(text) {
		this.$.selectedFeedName.setContent(text);
	}
}); 