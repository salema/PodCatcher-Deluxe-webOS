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
// or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Yet Another Simple Pod Catcher. If not, see <http://www.gnu.org/licenses/>.

// Show list of all feed items (podcasts) as a sliding pane
enyo.kind({
	name: "Net.Alliknow.PodCatcher.FeedItemList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectItem: ""
	},
	components: [
		{kind: "WebService", name: "grabFeed", onSuccess: "grabFeedSuccess", onFailure: "grabFeedFailed"},
		{kind: "Header", layoutKind: "HFlexLayout", style: "min-height: 60px", components: [
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
		this.selectedIndex = -1;
	},
	
	getFeedItems: function(inSender, inIndex) {
		var feedItem = this.feedItemList[inIndex];

		if (feedItem) {
			this.$.feedItemTitle.setContent(feedItem.title);
			if (this.selectedIndex == inIndex) this.$.feedItemTitle.addClass("highlight");
			//var pubDate = new Date(feedItem.pubDate);
			//var formatter = new enyo.g11n.DateFmt();
			//var string = formatter.format(pubDate);
			this.$.feedItemPublished.setContent(feedItem.pubDate);
			return true;
		}
	},
	
	selectFeedItem: function(inSender, inIndex) {
		this.selectedIndex = this.$.feedListItemsVR.fetchRowIndex();
		var feedItem = this.feedItemList[this.selectedIndex];
		
		if (feedItem) this.doSelectItem(feedItem);
		
		this.$.feedListItemsVR.render();
	},
	
	setFeed: function(feed) {
		this.$.selectedFeedName.setContent("Select from \"" + feed.title + "\"");
		this.$.feedItemsSpinner.show();
		
		this.selectedIndex = -1;
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
			if (! this.isValidFeedItem(items[index])) continue;
			
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
		this.$.feedItemsSpinner.hide();
	},
	
	isValidFeedItem: function(item) {
		return item.getElementsByTagName("title").length == 1 &&
			item.getElementsByTagName("enclosure").length == 1 &&
			item.getElementsByTagName("pubDate").length == 1 &&
			item.getElementsByTagName("description").length == 1;
	}
}); 