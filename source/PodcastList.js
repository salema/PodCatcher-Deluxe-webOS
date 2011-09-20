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
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.PodcastList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onPrepareLoad: "",
		onSelectPodcast: "",
		onSelectAll: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "WebService", name: "autoUpdatePodcast", onSuccess: "autoUpdatePodcastSuccess", onFailure: "autoUpdatePodcastFailed"},
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "WebService", name: "grabPodcastImage", onSuccess: "grabPodcastImageSuccess"},
		{kind: "Net.Alliknow.PodCatcher.AddPodcastPopup", name: "addPodcastPopup", onAddPodcast: "addPodcast"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{content: $L("Discover Podcasts"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "podcastSpinner", align: "right"}
		]},
		{kind: "Scroller", name: "podcastListScroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "podcastListVR", onSetupRow: "getPodcast", onclick: "selectPodcastClick", components: [
				{kind: "SwipeableItem", layout: "HFlexBox", onConfirm: "deletePodcast", components: [
					{name: "podcastTitle", className: "nowrap"},
					{name: "podcastEpisodeNumber", className: "nowrap", style: "font-size: smaller;"}
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
		this.loadCounter = 0;
		this.autoUpdateLoadCounter = 0;
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
			
			this.$.selectAllButton.setDisabled(this.selectAll || this.podcastList.length === 0);
			this.$.podcastListVR.render();
			this.autoUpdate();
		}
	},
	
	store: function() {
		this.$.preferencesService.call({"storedPodcastList": this.podcastList},	{method: "setPreferences"});
	},
	
	showAddPodcastPopup: function(inSender, inIndex) {
		this.$.addPodcastPopup.openAtCenter();
	},
	
	addPodcast: function(inSender, podcast) {
		var index = Utilities.getIndexInList(this.podcastList, podcast);
		
		// podcast is already in list
		if (index >= 0) {
			this.selectedIndex = index;
			this.selectPodcast();
		} // podcast is new
		else {
			this.podcastList.push(podcast);
			this.storePodcastList();
			
			this.selectedIndex = this.podcastList.length - 1;
			this.selectPodcast();
			
			this.$.podcastListScroller.scrollToBottom();
		}
	},

	deletePodcast: function(inSender, inIndex) {
		this.podcastList.splice(inIndex, 1);
		
		// Swipe on selected
		if (inIndex == this.selectedIndex) {
			this.selectedIndex = -1;
			this.$.podcastImage.setSrc(Podcast.DEFAULT_IMAGE);
		}
		// Via swipe and above in list
		else if (inIndex < this.selectedIndex) this.selectedIndex--;
		
		this.storePodcastList();
		this.$.podcastListVR.render();	
	},
	
	// Method called for item creation from virtual repeater
	getPodcast: function(sender, index) {
		var podcast = this.podcastList[index];
		
		if (podcast) {
			this.$.podcastTitle.setContent(podcast.title);
			
			if (!podcast.episodeList) this.$.podcastEpisodeNumber.setContent("");
			else if (podcast.episodeList.length === 0)
				this.$.podcastEpisodeNumber.setContent($L("No episodes"));
			else if (podcast.episodeList.length == 1)
				this.$.podcastEpisodeNumber.setContent(podcast.episodeList.length + " " + $L("episode"));
			else this.$.podcastEpisodeNumber.setContent(podcast.episodeList.length + " " + $L("episodes"));
			
			if (this.selectedIndex == inIndex || this.selectAll) {
				this.$.podcastTitle.addClass("highlight");
				this.$.podcastEpisodeNumber.addClass("highlight");
			}
		}
		
		return index < this.podcastList.length;
	},
	
	selectPodcastClick: function(inSender, inEvent) {
		this.selectedIndex = this.$.podcastListVR.fetchRowIndex();
		this.selectPodcast();
	},
	
	selectPodcast: function() {
		this.prepareLoad(false);		
		
		var podcast = this.podcastList[this.selectedIndex];
		
		if (podcast) {
			Utilities.prepareFeedService(this.$.grabPodcast, podcast.url, podcast.user, podcast.pass);
			this.$.grabPodcast.call();
			
			this.$.grabPodcastImage.setUrl(encodeURI(podcast.image));
			this.$.grabPodcastImage.call();
		}
	},
	
	selectAllPodcasts: function(sender, event) {
		this.prepareLoad(true);
		this.loadAll(this.$.grabPodcast);
	},

	autoUpdate: function() {
		this.$.podcastSpinner.show();
		this.autoUpdateLoadCounter = 0;
		
		this.loadAll(this.$.autoUpdatePodcast);
	},
	
	loadAll: function(service) {
		for (var index = 0; index < this.podcastList.length; index++) {
			Utilities.prepareFeedService(service, this.podcastList[index].url,
					this.podcastList[index].user, this.podcastList[index].pass);
			
			service.call();
		}
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

	autoUpdatePodcastSuccess: function(sender, response, request) {
		this.autoUpdateLoadCounter++;
		
		var podcast = Utilities.getItemInList(this.podcastList, new Podcast(request.url));
		podcast.readEpisodes(response);
		
		this.checkAutoUpdateComplete();
	},
	
	autoUpdatePodcastFailed: function(sender, response, request) {
		this.autoUpdateLoadCounter++;
		this.checkAutoUpdateComplete();
	},
	
	checkAutoUpdateComplete: function() {
		// All feeds finished loading?
		if (this.autoUpdateLoadCounter == this.podcastList.length) {
			this.$.podcastSpinner.hide();
			this.$.podcastListVR.render();
		}
	},
	
	grabPodcastSuccess: function(sender, response, request) {
		this.loadCounter++;
		
		var podcast = Utilities.getItemInList(this.podcastList, new Podcast(request.url));
		podcast.readEpisodes(response);
		
		this.checkLoadFinished(podcast);
	},
	
	grabPodcastFailed: function(sender, response, request) {
		this.loadCounter++;
		this.warn("Failed to load podcast feed: " + response);
				
		var podcast = Utilities.getItemInList(this.podcastList, new Podcast(request.url));
		this.checkLoadFinished(podcast);
	},
	
	checkLoadFinished: function(currentPodcast) {
		// All feeds finished loading?
		if (!this.selectAll || this.loadCounter == this.podcastList.length) {
			if (this.selectAll) this.doSelectAll(this.podcastList);
			else this.doSelectPodcast(currentPodcast);
			
			this.$.podcastListVR.render();
		}
	},
	
	prepareLoad: function(selectAll) {
		this.selectAll = selectAll;
		this.loadCounter = 0;
		
		this.$.podcastImage.setSrc(Podcast.DEFAULT_IMAGE);
		this.$.selectAllButton.setDisabled(selectAll || this.podcastList.length === 0);
		
		this.doPrepareLoad();
	},
	
	grabPodcastImageSuccess: function(inSender, inResponse, inRequest) {
		var podcast = this.podcastList[this.selectedIndex];
		
		if (podcast && podcast.image != undefined && podcast.image == request.url &&
				response.length != 0) this.$.podcastImage.setSrc(podcast.image);
	}
}); 
