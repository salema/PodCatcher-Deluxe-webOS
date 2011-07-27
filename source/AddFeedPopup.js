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
// or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Yet Another Simple Pod Catcher. If not, see <http://www.gnu.org/licenses/>.

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
			{kind: "Input", name: "newFeedURL", hint: "Insert Podcast URL here", flex: 1, alwaysLooksFocused: true, autoCapitalize: "lowercase"},
			{kind: "Button", content: "Add Feed", onclick: "addFeed"}
		]},
	],
	
	reset: function() {
		this.$.newFeedURL.setValue("");
	},

	addFeed: function() {
		// Check for protocol
		if (!(this.$.newFeedURL.getValue().substring(0, 7) === "http://")) {
			this.$.newFeedURL.setValue("http://" + this.$.newFeedURL.getValue());
		}
		
		// Try to grab feed
		this.$.grabFeed.setUrl(encodeURI(this.$.newFeedURL.getValue()));
		this.$.grabFeed.call();
	},
	
	grabFeedSuccess: function(inSender, inResponse, inRequest) {
		var parser = new DOMParser;
		var source = parser.parseFromString(inResponse, "text/xml");
		
		// Get title from feed
		var title = source.getElementsByTagName("title");
		
		// Only add feed if title is present (and feed is valid)
		if (title.length > 0) {
			this.doAddFeed({
				title: title[0].firstChild.data,
				url: this.$.newFeedURL.getValue()
			})
			this.close();
		// Grab feed failed	
		} else this.grabFeedFailed();		
	},
	
	grabFeedFailed: function() {
		this.$.newFeedURL.setValue("Failed to load feed");
	}
});