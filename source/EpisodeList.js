/** Copyright 2011, 2012 Kevin Hausmann
 *
 * This file is part of Video PodCatcher Deluxe.
 *
 * Video PodCatcher Deluxe is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * Video PodCatcher Deluxe is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Video PodCatcher Deluxe. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Shows list of all episodes (podcast feed items) as a sliding pane
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.EpisodeList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	LIMIT: 250,
	events: {
		onResumeComplete: "",
		onSelectEpisode: "",
		onPlaylistChanged: "",
		onSpecialListSelected: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{kind: "Image", name: "showAllButton", src: Episode.UNMARKED_ICON, onclick: "toggleShowAll", style: "margin-right: 10px;"},
			{content: $L("Select"), name: "selectedPodcastName", className: "nowrap", flex: 1},
			{kind: "Spinner", name: "episodeSpinner", align: "right"}
		]},
		{name: "error", showing: false, className: "error"},
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
		this.playlist = [];
		this.markedEpisodes = [];
		this.downloadedEpisodes = [];
		this.selectedIndex = -1;
		this.loadCounter = -1;
		this.showAll = true;
		this.showPodcastTitle = false;
		this.showDownloads = false;
		this.showPlaylist = false;
		
		if (window.PalmSystem)
			this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short", weekday: true});
		
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
		
		this.doResumeComplete();
	},
	
	store: function() {
		this.$.preferencesService.call({"episodePlaylist": this.playlist, "markedEpisodes": this.markedEpisodes,
			"downloadedEpisodes": this.downloadedEpisodes},	{method: "setPreferences"});
	},
	
	setPodcast: function(podcast) {
		this.$.selectedPodcastName.setContent($L("Select from") + " \"" + podcast.title + "\"");
		
		this.episodeList = podcast.episodeList;
		
		this.afterLoad(true, false, false, false);
	},
	
	setPodcastList: function(podcastList) {
		this.$.selectedPodcastName.setContent($L("Select from all"));
		
		for (var index = 0; index < podcastList.length; index++) {
			var list = podcastList[index].episodeList;
			
			if (list)
				for (var item = 0; item < list.length; item++)
					this.episodeList.push(list[item]);
		}
		
		this.afterLoad(true, true, false, false);
	},
	
	setShowDownloads: function() {
		this.prepareLoad();
		this.$.selectedPodcastName.setContent($L("Select from Downloads"));
		
		for (var index = 0; index < this.downloadedEpisodes.length; index++) 
			this.episodeList.push(this.downloadedEpisodes[index]);
		
		this.afterLoad(true, true, true, false);
		this.doSpecialListSelected();
	},
	
	setShowPlaylist: function() {
		this.prepareLoad();
		this.$.selectedPodcastName.setContent($L("Select from Playlist"));
		
		if (this.playlist.length === 0) {
			this.$.error.setContent($L("Your playlist is empty. Swipe any episode to the right in order to add it to the playlist."));
			this.$.error.setStyle("color: gray;");
			this.$.error.show();
		} else {
			for (var index = 0; index < this.playlist.length; index++)
				this.episodeList.push(this.playlist[index]);
		}
		
		this.afterLoad(false, true, false, true);
		this.doSpecialListSelected();
	},
	
	// Method called for item creation from virtual repeater
	getEpisode: function(sender, index) {
		var episode = this.episodeList[index];
		
		if (episode) {
			var old = this.markedEpisodes.indexOf(episode.url) >= 0;
						
			if (!this.showAll && old) {
				this.$.episodeTitle.parent.hide();
			} else {
				var playlist = Utilities.isInList(this.playlist, episode);
				var downloaded = Utilities.isInList(this.downloadedEpisodes, episode);
				
				// Put title
				this.$.episodeTitle.setContent(episode.title);
				if (this.selectedIndex == index) this.$.episodeTitle.addClass("highlight");
				if (old) this.$.episodeTitle.addClass("marked");
				if (playlist) this.$.episodeTitle.addClass("playlist");
				if (downloaded) this.$.episodeTitle.parent.addClass("downloaded");
				
				// Put date
				if (this.formatter) this.$.episodePublished.setContent(this.formatter.format(new Date(episode.pubDate)));
				else this.$.episodePublished.setContent(episode.pubDate);
				
				// Put podcast title if wanted
				if (this.showPodcastTitle) this.$.episodePublished.setContent(episode.podcastTitle + " - " + this.$.episodePublished.getContent());
				
				if (this.selectedIndex == index) this.$.episodePublished.addClass("highlight");
				if (old) this.$.episodePublished.addClass("marked");
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
		this.updateListOfMarkedEpisodes(episode);
		
		this.store();
		this.$.episodeListVR.render();
	},
	
	markAll: function(mark) {
		for (var index = 0; index < this.episodeList.length; index++) {
			var episode = this.episodeList[index];
			
			episode.marked = mark;
			this.updateListOfMarkedEpisodes(episode);
		}
		
		this.store();
		this.$.episodeListVR.render();
	},
	
	updateListOfMarkedEpisodes: function(episode) {
		// Add to list
		if (episode.marked && this.markedEpisodes.indexOf(episode.url) < 0) 
			this.markedEpisodes.push(episode.url);
		// Remove from list 
		else if (!episode.marked) {
			var index = this.markedEpisodes.indexOf(episode.url);
			if (index >= 0) this.markedEpisodes.splice(index, 1);
		}
	},
	
	toggleShowAll: function(sender, event) {
		this.showAll = !this.showAll;
		
		if (this.showAll) this.$.showAllButton.setSrc(Episode.UNMARKED_ICON);
		else this.$.showAllButton.setSrc(Episode.MARKED_ICON);
		
		this.$.episodeListVR.render();
	},
		
	togglePlaylist: function(sender, index) {
		var episode = this.episodeList[index];
		
		// Playlist is showing
		if (this.showPlaylist) {
			var isLastInPlaylist = index === this.playlist.length - 1;
			// Remove episode and only put it back if it was not the last one
			Utilities.removeItemFromList(this.playlist, episode);
			if (!isLastInPlaylist) this.playlist.splice(index + 1, 0, episode);
			
			this.setShowPlaylist();
		} 
		// Any other episode list is showing
		else {
			// Add to playlist
			if (! Utilities.isInList(this.playlist, episode)) this.playlist.push(episode);
			// Remove from playlist
			else Utilities.removeItemFromList(this.playlist, episode);
			
			this.$.episodeListVR.render();
		}
		
		this.doPlaylistChanged(this.playlist.length);
		this.store();		
	},
	
	nextInPlaylist: function(lastEpisode) {
		// Remove last played episode from the playlist
		Utilities.removeItemFromList(this.playlist, lastEpisode);
		
		// Play next item
		if (this.playlist.length > 0) {
			var episode = this.playlist[0];
			Utilities.removeItemFromList(this.playlist, episode);
			
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
		
		this.$.episodeListVR.render();
		this.store();
	},
	
	removeFromDownloaded: function(episode) {
		if (Utilities.isInList(this.downloadedEpisodes, episode)) {
			Utilities.removeItemFromList(this.downloadedEpisodes, episode);
			
			this.$.showDownloadedButton.setDisabled(this.showDownloads || this.downloadedEpisodes.length === 0);
			if (this.showDownloads) this.setShowDownloads();
			
			this.$.episodeListVR.render();
			this.store();
		}
	},
	
	updateEpisodeMetadata: function(episode) {
		if (Utilities.isInList(this.downloadedEpisodes, episode)) {
			episode.setDownloaded(true, Utilities.getItemAttributeValueInList(this.downloadedEpisodes, episode, "file"));
			episode.ticket = Utilities.getItemAttributeValueInList(this.downloadedEpisodes, episode, "ticket");
		} else episode.setDownloaded(false);
		
		episode.marked = this.markedEpisodes.indexOf(episode.url) >= 0;
	},
	
	prepareLoad: function() {
		this.$.selectedPodcastName.setContent($L("Select"));
		this.$.episodeSpinner.show();
		this.$.error.hide();
		
		this.selectedIndex = -1;
		this.episodeList = [];
		
		this.$.episodeListVR.render();	
	},
	
	afterLoad: function(sort, showPodcastTitles, showDownloads, showPlaylist) {
		this.showPodcastTitle = showPodcastTitles;
		this.showDownloads = showDownloads;
		this.showPlaylist = showPlaylist;
		
		if (sort) this.episodeList.sort(new Episode().compare);
		
		this.$.showDownloadedButton.setDisabled(showDownloads || this.downloadedEpisodes.length === 0);
		this.$.showPlaylistButton.setDisabled(showPlaylist);
		this.$.episodeListScroller.scrollTo(0, 0);
		this.$.episodeListVR.render();
		this.$.episodeSpinner.hide();
		
		if (this.episodeList.length === 0 && !(showDownloads || showPlaylist)) this.loadFailed();
	},
	
	loadFailed: function() {
		this.$.error.setContent($L("The podcast feed failed to load. Please make sure that you are online."));
		this.$.error.setStyle("color: red;");
		this.$.error.show();
	}
});
