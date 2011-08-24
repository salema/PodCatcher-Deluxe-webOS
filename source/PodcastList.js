/** Copyright 2011 Kevin Hausmann
 *
 * This file is part of Yet Another Simple Pod Catcher.
 *
 * Yet Another Simple Pod Catcher is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * Yet Another Simple Pod Catcher is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Yet Another Simple Pod Catcher. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Shows list of all podcasts as a sliding pane
 * Throws event on podcast selection to be handled by owner
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.PodcastList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectPodcast: "",
		onSelectAll: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "WebService", name: "grabPodcastImage", onSuccess: "grabPodcastImageSuccess"},
		{kind: "Net.Alliknow.PodCatcher.AddPodcastPopup", name: "addPodcastPopup", onAddPodcast: "addPodcast"},
		{kind: "Header", content: $L("Discover Podcasts"), className: "header"},
		{kind: "Scroller", name: "podcastListScroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "podcastListVR", onSetupRow: "getPodcast", onclick: "selectPodcastClick", components: [
				{kind: "SwipeableItem", layoutKind: "HFlexLayout", onConfirm: "deletePodcast", components: [
					{name: "podcastTitle", className: "nowrap"}
				]}
			]}
		]},
		{kind: "Image", name: "podcastImage", className: "podcastImage", src: Podcast.DEFAULT_IMAGE},
		{kind: "Toolbar", pack: "justify", className: "toolbar", components: [
			{kind: "ToolButton", caption: $L("Add"), onclick: "showAddPodcastPopup", flex: 1},
			{kind: "ToolButton", name: "selectAllButton", caption: $L("All"), onclick: "selectAllPodcasts", flex: 1, disabled: true}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.selectedIndex = -1;
		this.podcastList = [];
		this.selectAll = false;
		
		this.$.preferencesService.call({keys: ["storedPodcastList"]}, {method: "getPreferences", onSuccess: "restore"});
	},
	
	restore: function(sender, response) {
		var list = response.storedPodcastList;
		
		// first start of app (or empty podcast list)
		if (list == undefined || list.length === 0) this.showAddPodcastPopup();
		// podcast list restored
		else {
			for (var index = 0; index < list.length; index++) {
				var podcast = new Podcast(list[index].url);
				podcast.readFromJSON(list[index]);
				
				this.podcastList.push(podcast);
			}
			
			this.$.selectAllButton.setDisabled(! (this.podcastList.length > 1));
			this.$.podcastListVR.render();
		}
	},
	
	store: function() {
		this.$.preferencesService.call({"storedPodcastList": this.podcastList},	{method: "setPreferences"});
	},
	
	// Method called for item creation from virtual repeater
	getPodcast: function(sender, index) {
		var podcast = this.podcastList[index];
		
		if (podcast) {
			this.$.podcastTitle.setContent(podcast.title);
			if (this.selectedIndex == index || this.selectAll) this.$.podcastTitle.addClass("highlight");
		}
		
		return index < this.podcastList.length;
	},
	
	selectPodcastClick: function(sender, event) {
		this.selectedIndex = this.$.podcastListVR.fetchRowIndex();
		this.selectPodcast();
	},
	
	selectPodcast: function() {
		this.selectAll = false;
		var podcast = this.podcastList[this.selectedIndex];
		
		if (podcast) {
			this.$.podcastImage.setSrc(Podcast.DEFAULT_IMAGE);
			this.$.grabPodcastImage.setUrl(encodeURI(podcast.image));
			this.$.grabPodcastImage.call();
			
			this.doSelectPodcast(podcast);
		}
		
		this.$.selectAllButton.setDisabled(this.podcastList.length === 0);
		this.$.podcastListVR.render();
	},
	
	selectAllPodcasts: function(sender, event) {
		this.selectAll = true;
		this.doSelectAll(this.podcastList);
		
		this.$.podcastImage.setSrc(Podcast.DEFAULT_IMAGE);
		this.$.selectAllButton.setDisabled(true);
		this.$.podcastListVR.render();
	},

	showAddPodcastPopup: function(sender, event) {
		this.$.addPodcastPopup.openAtCenter();
	},
	
	addPodcast: function(sender, podcast) {
		// podcast is already in list
		if (Utilities.isInList(this.podcastList, podcast)) {
			this.selectedIndex = Utilities.getIndexInList(this.podcastList, podcast);
			this.selectPodcast();
		} // podcast is new
		else {
			this.podcastList.push(podcast);
			this.store();
			
			this.selectedIndex = this.podcastList.length - 1;
			this.selectPodcast();
			
			this.$.podcastListScroller.scrollToBottom();
		}
	},

	deletePodcast: function(sender, index) {
		this.podcastList.splice(index, 1);
		
		// if select all is active
		if (this.selectAll) {
			this.selectAll = false;
			this.selectedIndex = -1;
		} // Swipe on selected
		else if (index == this.selectedIndex) {
			this.selectedIndex = -1;
			this.$.podcastImage.setSrc(Podcast.DEFAULT_IMAGE);
		} // Via swipe and above in list
		else if (index < this.selectedIndex) this.selectedIndex--;
		
		this.store();
		this.$.selectAllButton.setDisabled(this.podcastList.length === 0);
		this.$.podcastListVR.render();	
	},
	
	specialListSelected: function() {
		this.selectAll = false;
		this.selectedIndex = -1;
		
		this.$.selectAllButton.setDisabled(this.podcastList.length === 0);
		this.$.podcastImage.setSrc(Podcast.DEFAULT_IMAGE);
		this.$.podcastListVR.render();
	},
	
	grabPodcastImageSuccess: function(sender, response, request) {
		var podcast = this.podcastList[this.selectedIndex];
		
		if (podcast.image != undefined && podcast.image == request.url &&
				response.length != 0) this.$.podcastImage.setSrc(podcast.image);
	}
}); 