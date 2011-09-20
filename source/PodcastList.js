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
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "WebService", name: "grabPodcastImage", onSuccess: "grabPodcastImageSuccess"},
		{kind: "Net.Alliknow.PodCatcher.AddPodcastPopup", name: "addPodcastPopup", onAddPodcast: "addPodcast"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{content: $L("Discover Podcasts"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "podcastSpinner", align: "right"}
		]},
		{kind: "Scroller", name: "podcastListScroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "podcastListVR", onSetupRow: "getPodcast", onclick: "selectPodcastClick", components: [
				{kind: "SwipeableItem", layout: "HFlexBox", onConfirm: "deletePodcast", style: "padding: 5px 0px 2px 10px;", components: [
					{name: "podcastTitle", className: "nowrap"},
					{name: "podcastEpisodeNumber", className: "nowrap", style: "font-size: smaller"}
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
		this.podcastList = [];
		this.selectAll = false;
		this.autoUpdateInProgress = false;
		
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
			this.autoUpdate();
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
			
			if (!podcast.episodeList || podcast.episodeList.length === 0)
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
		if (this.autoUpdateInProgress) return;
		
		this.selectedIndex = this.$.podcastListVR.fetchRowIndex();
		this.selectPodcast();
	},
	
	selectPodcast: function() {
		this.prepareLoad(false);		
		
		var podcast = this.podcastList[this.selectedIndex];
		
		if (podcast) {
			this.$.grabPodcastImage.setUrl(encodeURI(podcast.image));
			this.$.grabPodcastImage.call();
			
			Utilities.prepareFeedService(this.$.grabPodcast, podcast.url, podcast.user, podcast.pass);
			this.$.grabPodcast.call();
		}
	},
	
	selectAllPodcasts: function(sender, event) {
		if (this.autoUpdateInProgress) return;
		
		this.prepareLoad(true);
		this.loadAllPodcasts();
	},
	
	autoUpdate: function() {
		this.autoUpdateInProgress = true;
		this.$.podcastSpinner.show();
		
		this.loadAllPodcasts();
	},
	
	loadAllPodcasts: function() {
		for (var index = 0; index < this.podcastList.length; index++) {
			Utilities.prepareFeedService(this.$.grabPodcast, this.podcastList[index].url,
					this.podcastList[index].user, this.podcastList[index].pass);
			this.$.grabPodcast.call();
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
	
	getPodcastIndexInList: function(podcast) {
		for (var index = 0; index < this.podcastList.length; index++)
			if (this.podcastList[index].url == podcast.url) return index;	
	},
	
	grabPodcastSuccess: function(sender, response, request) {
		this.loadCounter++;
		
		var podcast = Utilities.getItemInList(this.podcastList, new Podcast(request.url));
		var xmlTree = XmlHelper.parse(response);
		var items = XmlHelper.get(xmlTree, XmlHelper.ITEM);
		
		podcast.episodeList = [];
		
		for (var index = 0; index < items.length; index++) {
			var episode = new Episode();
			if (! episode.isValid(items[index])) continue;
			
			episode.read(items[index]);
			episode.podcastTitle = podcast.title;
			podcast.episodeList.push(episode);
		}
		
		this.checkLoadFinished(podcast);
	},
	
	grabPodcastFailed: function(sender, response, request) {
		this.loadCounter++;
		this.warn("Failed to load podcast feed: " + response);
				
		var podcast = Utilities.getItemInList(this.podcastList, new Podcast(request.url));
		this.checkLoadFinished(podcast);
	},
	
	checkLoadFinished: function(currentPodcast) {
		// All feed finished loading?
		if (!(this.selectAll || this.autoUpdateInProgress) || this.loadCounter == this.podcastList.length) {
			if (this.selectAll && !this.autoUpdateInProgress) this.doSelectAll(this.podcastList);
			else if (!this.autoUpdateInProgress) this.doSelectPodcast(currentPodcast);
			else {
				this.$.podcastSpinner.hide();
				this.autoUpdateInProgress = false;
			}
			
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
