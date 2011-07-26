// Display a nice simple popup for the user to add a feed URL
enyo.kind({
	name: "Net.Alliknow.PodCatcher.AddFeedPopup",
	kind: "Popup",
	events: {
		onAddFeed: ""
	},
	components: [
		{kind: "WebService", name: "grabFeed", onSuccess: "grabFeedSuccess", onFailure: "grabFeedFailed"},
		{kind: "HFlexBox", components: [
			{kind: "Input", name: "newFeedURL", hint: "New Feed URL", flex: 1, alwaysLooksFocused: true, autoCapitalize: "lowercase"},
			{kind: "Button", content: "Add Feed", onclick: "addFeed"}
		]},
	],
	
	reset: function() {
		this.$.newFeedURL.setValue("");
	},

	addFeed: function() {
		if (!(this.$.newFeedURL.getValue().substring(0, 7) === "http://")) {
			this.$.newFeedURL.setValue("http://" + this.$.newFeedURL.getValue());
		}
		
		this.$.grabFeed.setUrl(encodeURI(this.$.newFeedURL.getValue()));
		this.$.grabFeed.call();
	},
	
	grabFeedSuccess: function(inSender, inResponse, inRequest) {
		var parser = new DOMParser;
		var source = parser.parseFromString(inResponse, "text/xml");
		
		var title = source.getElementsByTagName("title");
		
		if (title.length > 0) {
			this.doAddFeed({
				title: title[0].firstChild.data,
				url: this.$.newFeedURL.getValue()
			})
			this.close();
		} else this.grabFeedFailed();		
	},
	
	grabFeedFailed: function() {
		this.$.newFeedURL.setValue("Failed to load feed");
	}
});