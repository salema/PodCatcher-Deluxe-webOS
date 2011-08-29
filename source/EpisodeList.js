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
 * Shows list of all episodes (podcast feed items) as a sliding pane
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.EpisodeList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	LIMIT: 100,
	events: {
		onSelectEpisode: "",
		onPlaylistChanged: "",
		onSpecialListSelected: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{kind: "Image", name: "showAllButton", src: Episode.UNMARKED_ICON, onclick: "toggleShowAll", style: "margin-right: 10px;"},
			{content: $L("Select"), name: "selectedPodcastName", className: "nowrap", flex: 1},
			{kind: "Spinner", name: "episodeSpinner", align: "right"}
		]},
		{name: "error", style: "display: none", className: "error"},
		{kind: "Scroller", name: "episodeListScroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "episodeListVR", onSetupRow: "getEpisode", onclick: "selectEpisode", components: [
				{kind: "SwipeableItem", layout: "HFlexBox", onConfirm: "togglePlaylist", allowLeft: false, confirmRequired: false, components: [
					{name: "episodeTitle", className: "nowrap"},
					{name: "episodePublished", className: "nowrap", style: "font-size: smaller"}
				]}
			]}
		]},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "showPlaylistButton", caption: $L("Playlist"), onclick: "setShowPlaylist", flex: 1},
			{kind: "ToolButton", name: "showDownloadedButton", caption: $L("Downloads"), onclick: "setShowDownloads", disabled: true, flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.episodeList = [];
		this.podcastList = [];
		this.playlist = [];
		this.markedEpisodes = [];
		this.downloadedEpisodes = [];
		this.selectedIndex = -1;
		this.loadCounter = -1;
		this.showAll = true;
		this.showPodcastTitle = false;
		this.showDownloads = false;
		this.showPlaylist = false;
		
		//this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short", weekday: true});
		
		this.$.preferencesService.call({keys: ["episodePlaylist", "markedEpisodes", "downloadedEpisodes"]},
				{method: "getPreferences", onSuccess: "restore"});
	},
	
	restore: function(sender, response) {
		if (response.episodePlaylist != undefined) {	
			for (var index = 0; index < response.episodePlaylist.length; index++) {
				var episode = new Episode();
				episode.readFromJSON(response.episodePlaylist[index]);
				
				this.playlist.push(episode);
			}
			
			this.doPlaylistChanged(this.playlist.length);
		}
		
		if (response.markedEpisodes != undefined)
			this.markedEpisodes = response.markedEpisodes;
		
		if (response.downloadedEpisodes != undefined) {
			for (var index = 0; index < response.downloadedEpisodes.length; index++) {
				var episode = new Episode();
				episode.readFromJSON(response.downloadedEpisodes[index]);
				
				this.downloadedEpisodes.push(episode);
			}
			
			this.$.showDownloadedButton.setDisabled(this.downloadedEpisodes.length === 0);
		}
	},
	
	store: function() {
		this.$.preferencesService.call({"episodePlaylist": this.playlist, "markedEpisodes": this.markedEpisodes,
			"downloadedEpisodes": this.downloadedEpisodes},	{method: "setPreferences"});
	},
	
	setPodcast: function(podcast) {
		this.prepareLoad($L($L("Select from") + " \"" + podcast.title + "\""), false, false, false);
		this.podcastList.push(podcast);
		
		this.$.grabPodcast.setUrl(encodeURI(podcast.url));
		this.$.grabPodcast.call();
	},
	
	setPodcastList: function(podcastList) {
		this.prepareLoad($L("Select from all"), true, false, false);
		
		for (var index = 0; index < podcastList.length; index++) {
			this.podcastList.push(podcastList[index]);
			this.$.grabPodcast.setUrl(encodeURI(podcastList[index].url));
			this.$.grabPodcast.call();
		}
	},
	
	setShowDownloads: function() {
		this.prepareLoad($L("Select from Downloads"), true, true, false);
		
		for (var index = 0; index < this.downloadedEpisodes.length; index++) 
			this.episodeList.push(this.downloadedEpisodes[index]);
		
		this.afterLoad(true);
		this.doSpecialListSelected();
	},
	
	setShowPlaylist: function() {
		this.prepareLoad($L("Select from Playlist"), true, false, true);
		
		if (this.playlist.length === 0) {
			this.$.error.setContent($L("Your playlist is empty. Swipe any episode to the right in order to add it to the playlist."));
			this.$.error.setStyle("display: block; color: gray;");
			this.$.episodeSpinner.hide();
		} else {
			for (var index = 0; index < this.playlist.length; index++)
				this.episodeList.push(this.playlist[index]);
			
			this.afterLoad(false);
		}
		
		this.doSpecialListSelected();
	},
	
	// Method called for item creation from virtual repeater
	getEpisode: function(sender, index) {
		var episode = this.episodeList[index];
		
		if (episode) {
			var old = this.markedEpisodes.indexOf(episode.url) >= 0;
			var playlist = Utilities.isInList(this.playlist, episode);
			
			if (!this.showAll && old) {
				this.$.episodeTitle.parent.setStyle("display: none;");
			} else {
				// Put title
				this.$.episodeTitle.setContent(episode.title);
				if (this.selectedIndex == index) this.$.episodeTitle.addClass("highlight");
				if (old) this.$.episodeTitle.addClass("marked");
				if (playlist) this.$.episodeTitle.addClass("playlist");
				
				// Put date
				var pubDate = new Date(episode.pubDate);
				if (this.formatter != undefined) this.$.episodePublished.setContent(this.formatter.format(pubDate));
				else this.$.episodePublished.setContent(episode.pubDate);
				
				// Put podcast title if wanted
				if (this.showPodcastTitle) this.$.episodePublished.setContent(episode.podcastTitle + " - " + this.$.episodePublished.getContent());
				
				if (this.selectedIndex == index) this.$.episodePublished.addClass("highlight");
				if (old) this.$.episodePublished.addClass("marked");
				if (playlist) this.$.episodePublished.addClass("playlist");
				if (playlist) {
					this.$.episodePublished.addClass("playlist");
					
					var number = Utilities.getIndexInList(this.playlist, episode) + 1;
					this.$.episodePublished.setContent("#" + number + " - " + this.$.episodePublished.getContent());
				}
			}
		}
		
		return index < this.episodeList.length && index < this.LIMIT;
	},
	
	selectEpisode: function(sender, index) {
		this.selectedIndex = this.$.episodeListVR.fetchRowIndex();
		
		var episode = this.episodeList[this.selectedIndex];
		if (episode) {
			this.updateEpisodeMetadata(episode);
			
			this.doSelectEpisode(episode, false);
			this.$.episodeListVR.render();
		}
	},
	
	markEpisode: function(episode) {
		// Add to list
		if (episode.marked && this.markedEpisodes.indexOf(episode.url) < 0) 
			this.markedEpisodes.push(episode.url);
		// Remove from list 
		else if (!episode.marked) {
			var index = this.markedEpisodes.indexOf(episode.url);
			if (index >= 0) this.markedEpisodes.splice(index, 1);
		}
		
		this.store();
		this.$.episodeListVR.render();
	},
	
	toggleShowAll: function(sender, event) {
		this.showAll = !this.showAll;
		
		if (this.showAll) this.$.showAllButton.setSrc(Episode.UNMARKED_ICON);
		else this.$.showAllButton.setSrc(Episode.MARKED_ICON);
		
		this.$.episodeListVR.render();
	},
	
	grabPodcastSuccess: function(sender, response, request) {
		this.loadCounter++;
		
		var xmlTree = XmlHelper.parse(response);
		var items = XmlHelper.get(xmlTree, XmlHelper.ITEM);
		
		for (var index = 0; index < items.length; index++) {
			var episode = new Episode();
			if (! episode.isValidXML(items[index])) continue;
			
			episode.readFromXML(items[index]);
			episode.podcastTitle = Utilities.getItemAttributeValueInList(this.podcastList, new Podcast(request.url), "title");
			this.episodeList.push(episode);
		}
		
		this.checkLoadFinished();
	},
	
	grabPodcastFailed: function() {
		this.loadCounter++;
		this.checkLoadFinished();
	},
	
	checkLoadFinished: function() {
		if (this.loadCounter == this.podcastList.length) {
			if (this.episodeList.length === 0) this.loadFailed();
			else this.afterLoad(this.podcastList.length > 1);
		}
	},
	
	loadFailed: function() {
		this.warn("Failed to load podcast feed");
		this.$.error.setContent($L("The podcast feed failed to load. Please make sure you are online."));
		this.$.error.setStyle("display: block; color: red;");
		this.$.episodeSpinner.hide();
	},
	
	togglePlaylist: function(sender, index) {
		var episode = this.episodeList[index];
		
		// Add to playlist
		if (! Utilities.isInList(this.playlist, episode)) this.playlist.push(episode);
		// Remove from playlist
		else {
			var remove = -1;
			
			for (var index = 0; index < this.playlist.length; index++)
				if (this.playlist[index].url == episode.url)
					remove = index;
					
			if (remove >= 0) this.playlist.splice(remove, 1);
		}
		
		// Update UI
		this.$.showPlaylistButton.setDisabled(this.showPlaylist);
		if (this.showPlaylist) this.setShowPlaylist();
		
		this.$.episodeListVR.render();
		this.doPlaylistChanged(this.playlist.length);
		this.store();		
	},
	
	nextInPlaylist: function(lastEpisode) {
		// Remove last played episode from the playlist
		if (Utilities.isInList(this.playlist, lastEpisode))
			this.playlist.splice(Utilities.getIndexInList(this.playlist, lastEpisode), 1);
		
		// Play next item
		if (this.playlist.length > 0) {
			var episode = this.playlist[0];
			this.playlist.splice(0, 1);
			
			this.updateEpisodeMetadata(episode);
			
			if (Utilities.isInList(this.episodeList, episode))
				this.selectedIndex = Utilities.getIndexInList(this.episodeList, episode);
			this.doSelectEpisode(episode, true);
		}
		
		this.store();
		
		if (this.showPlaylist) this.setShowPlaylist();
		this.doPlaylistChanged(this.playlist.length);
		this.$.episodeListVR.render();
	},
	
	addToDownloaded: function(episode) {
		this.downloadedEpisodes.push(episode);
		
		this.$.showDownloadedButton.setDisabled(this.showDownloads || this.downloadedEpisodes.length === 0);
		if (this.showDownloads) this.setShowDownloads();
		
		this.store();
	},
	
	removeFromDownloaded: function(episode) {
		if (Utilities.isInList(this.downloadedEpisodes, episode)) {
			var remove = Utilities.getIndexInList(this.downloadedEpisodes, episode);
			this.downloadedEpisodes.splice(remove, 1);
			
			this.$.showDownloadedButton.setDisabled(this.showDownloads || this.downloadedEpisodes.length === 0);
			if (this.showDownloads) this.setShowDownloads();
			
			this.store();
		}
	},
	
	updateEpisodeMetadata: function(episode) {
		if (Utilities.isInList(this.downloadedEpisodes, episode)) episode.setDownloaded(true,
				Utilities.getItemAttributeValueInList(this.downloadedEpisodes, episode, "ticket"),
				Utilities.getItemAttributeValueInList(this.downloadedEpisodes, episode, "file"));
		else episode.setDownloaded(false);
		
		episode.marked = this.markedEpisodes.indexOf(episode.url) >= 0;
	},
	
	prepareLoad: function (paneTitle, showPodcastTitles, showDownloads, showPlaylist) {
		this.$.selectedPodcastName.setContent(paneTitle);
		this.$.showPlaylistButton.setDisabled(showPlaylist);
		this.$.showDownloadedButton.setDisabled(showDownloads || this.downloadedEpisodes.length === 0);
		this.$.episodeSpinner.show();
		this.$.error.setStyle("display: none;");
		
		this.showPodcastTitle = showPodcastTitles;
		this.selectedIndex = -1;
		this.episodeList = [];
		this.loadCounter = 0;
		this.podcastList = [];
		this.showDownloads = showDownloads;
		this.showPlaylist = showPlaylist;
		
		this.$.episodeListVR.render();	
	},
	
	afterLoad: function (sort) {
		if (sort) this.episodeList.sort(new Episode().compare);
		
		this.$.episodeListScroller.scrollTo(0, 0);
		this.$.episodeListVR.render();
		this.$.episodeSpinner.hide();
	}
});
