// Display a nice simple popup for the user to add a feed URL
enyo.kind({
	name: "Net.Alliknow.PodCatcher.AddFeedPopup",
	kind: "Popup",
	events: {
		onAddFeed: ""
	},
	components: [
		{kind: "HFlexBox", components: [
			{kind: "Input", name: "newFeed", hint: "New Feed URL", flex: 1},
			{kind: "Button", content: "Add Feed", onclick: "addFeed"}
		]},
	],

	addFeed: function() {
		this.doAddFeed({
			title: this.$.newFeed.getValue(),
			url: "???"
		});
		
		this.close();
	}
});