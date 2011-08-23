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
			{kind: "ToolButton", name: "showPlaylistButton", caption: $L("Playlist"), onclick: "setShowPlaylist", disabled: true, flex: 1},
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
		this.podcastList = [];
		this.showAll = true;
		this.showPodcastTitle = false;
		this.showDownloads = false;
		this.showPlaylist = false;
		
		//this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short", weekday: true});
		
		this.$.preferencesService.call({keys: ["episodePlaylist", "markedEpisodes", "downloadedEpisodes"]},
				{method: "getPreferences", onSuccess: "restore"});
	},
	
	restore: function(inSender, inResponse) {
		if (inResponse.episodePlaylist != undefined) {	
			this.playlist = inResponse.episodePlaylist;
			if (this.playlist.length > 0) this.$.showPlaylistButton.setDisabled(false);
		}
		
		if (inResponse.markedEpisodes != undefined) 		
			this.markedEpisodes = inResponse.markedEpisodes;
				
		if (inResponse.downloadedEpisodes != undefined) {
			this.downloadedEpisodes = inResponse.downloadedEpisodes;
			if (this.downloadedEpisodes.length > 0) this.$.showDownloadedButton.setDisabled(false);
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
		
		for (var index = 0; index < this.downloadedEpisodes.length; index++) {
			var episode = new Episode();
			episode.readFromJSON(this.downloadedEpisodes[index]);
			
			this.episodeList.push(episode);
		}
		
		this.afterLoad(true);
		this.doSpecialListSelected();
	},
	
	setShowPlaylist: function() {
		this.prepareLoad($L("Select from Playlist"), true, false, true);
		
		for (var index = 0; index < this.playlist.length; index++) {
			var episode = new Episode();
			episode.readFromJSON(this.playlist[index]);
			
			this.episodeList.push(episode);
		}
		
		this.afterLoad(false);
		this.doSpecialListSelected();
	},
	
	// Method called for item creation from virtual repeater
	getEpisode: function(inSender, inIndex) {
		var episode = this.episodeList[inIndex];
		
		if (episode) {
			var old = this.markedEpisodes.indexOf(episode.url) >= 0;
			var playlist = this.isInPlaylist(episode);
			
			if (!this.showAll && old) {
				this.$.episodeTitle.parent.setStyle("display: none;");
			} else {
				// Put title
				this.$.episodeTitle.setContent(episode.title);
				if (this.selectedIndex == inIndex) this.$.episodeTitle.addClass("highlight");
				if (old) this.$.episodeTitle.addClass("marked");
				if (playlist) this.$.episodeTitle.addClass("playlist");
				
				// Put date
				var pubDate = new Date(episode.pubDate);
				if (this.formatter != undefined) this.$.episodePublished.setContent(this.formatter.format(pubDate));
				else this.$.episodePublished.setContent(episode.pubDate);
				
				// Put podcast title if wanted
				if (this.showPodcastTitle) this.$.episodePublished.setContent(episode.podcastTitle + " - " + this.$.episodePublished.getContent());
				
				if (this.selectedIndex == inIndex) this.$.episodePublished.addClass("highlight");
				if (old) this.$.episodePublished.addClass("marked");
				if (playlist) this.$.episodePublished.addClass("playlist");
			}
		}
		
		return inIndex < this.episodeList.length && inIndex < this.LIMIT;
	},
	
	selectEpisode: function(inSender, inIndex) {
		this.selectedIndex = this.$.episodeListVR.fetchRowIndex();
		
		var episode = this.episodeList[this.selectedIndex];
		if (episode) {
			episode.setDownloaded(this.isDownloaded(episode), this.getDownloadTicket(episode), this.getPathToDownload(episode));
			episode.marked = this.markedEpisodes.indexOf(episode.url) >= 0;
			
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
	
	toggleShowAll: function(inSender, inEvent) {
		this.showAll = !this.showAll;
		
		if (this.showAll) this.$.showAllButton.setSrc(Episode.UNMARKED_ICON);
		else this.$.showAllButton.setSrc(Episode.MARKED_ICON);
		
		this.$.episodeListVR.render();
	},
	
	grabPodcastSuccess: function(inSender, inResponse, inRequest) {
		this.loadCounter++;
		
		var xmlTree = XmlHelper.parse(inResponse);
		var items = XmlHelper.get(xmlTree, XmlHelper.ITEM);
		
		for (var index = 0; index < items.length; index++) {
			var episode = new Episode();
			if (! episode.isValidXML(items[index])) continue;
			
			episode.readFromXML(items[index]);
			episode.podcastTitle = this.getPodcastTitle(inRequest.url);
			this.episodeList.push(episode);
		}
		
		if (this.loadCounter == this.podcastList.length) {
			if (this.episodeList.length === 0) this.grabPodcastFailed();
			else this.afterLoad(this.showAll || this.showDownloads);
		}
	},
	
	grabPodcastFailed: function() {
		this.warn("Failed to load podcast feed");
		this.$.error.setContent($L("The podcast feed failed to load. Please make sure you are online."));
		this.$.error.setStyle("display: block;");
		this.$.episodeSpinner.hide();
	},
	
	togglePlaylist: function(inSender, inIndex) {
		var episode = this.episodeList[inIndex];
		
		if (! this.isInPlaylist(episode)) this.playlist.push(episode);
		else {
			var remove = -1;
			
			for (var index = 0; index < this.playlist.length; index++)
				if (this.playlist[index].url == episode.url)
					remove = index;
					
			if (remove >= 0) this.playlist.splice(remove, 1);
		}
		
		this.$.showPlaylistButton.setDisabled(this.showPlaylist || this.playlist.length === 0);
		if (this.showPlaylist) this.setShowPlaylist();
		
		this.$.episodeListVR.render();
		this.store();		
	},
	
	nextInPlaylist: function(lastEpisode) {
		while (this.playlist.length > 0 && lastEpisode.url == this.playlist[0].url)
			this.playlist.splice(0, 1);
		
		if (this.playlist.length > 0) {
			var episode = new Episode();
			episode.readFromJSON(this.playlist[0]);
			episode.setDownloaded(this.isDownloaded(episode), this.getDownloadTicket(episode), this.getPathToDownload(episode));
			episode.marked = this.markedEpisodes.indexOf(episode.url) >= 0;
			
			this.playlist.splice(0, 1);
			this.doSelectEpisode(episode, true);
		}
		
		if (this.showPlaylist) this.setShowPlaylist();
	},
	
	addToDownloaded: function(episode, inResponse) {
		this.downloadedEpisodes.push({ticket: inResponse.ticket, url: inResponse.url, file: inResponse.target,
			title: episode.title, description: episode.description, pubDate: episode.pubDate, 
			podcastTitle: episode.podcastTitle, isDownloaded: true, marked: episode.marked});
		
		this.$.showDownloadedButton.setDisabled(this.showDownloads || this.downloadedEpisodes.length === 0);
		if (this.showDownloads) this.setShowDownloads();
		
		this.store();
	},
	
	removeFromDownloaded: function(episode) {
		var remove = -1;
		
		for (var index = 0; index < this.downloadedEpisodes.length; index++)
			if (this.downloadedEpisodes[index].url == episode.url)
				remove = index;
				
		if (remove >= 0) {
			this.downloadedEpisodes.splice(remove, 1);
			
			this.$.showDownloadedButton.setDisabled(this.showDownloads || this.downloadedEpisodes.length === 0);
			if (this.showDownloads) this.setShowDownloads();
			
			this.store();
		}
	},
	
	isInPlaylist: function(episode) {
		for (var index = 0; index < this.playlist.length; index++)
			if (this.playlist[index].url == episode.url)
				return true;
				
		return false;
	},
	
	isDownloaded: function(episode) {
		for (var index = 0; index < this.downloadedEpisodes.length; index++)
			if (this.downloadedEpisodes[index].url == episode.url)
				return true;
				
		return false;
	},
	
	getPodcastTitle: function(podcastUrl) {
		for (var index = 0; index < this.podcastList.length; index++)
			if (this.podcastList[index].url == podcastUrl)
				return this.podcastList[index].title;
	},
	
	getPathToDownload: function(episode) {
		for (var index = 0; index < this.downloadedEpisodes.length; index++)
			if (this.downloadedEpisodes[index].url == episode.url)
				return this.downloadedEpisodes[index].file;
	},
	
	getDownloadTicket: function(episode) {
		for (var index = 0; index < this.downloadedEpisodes.length; index++)
			if (this.downloadedEpisodes[index].url == episode.url)
				return this.downloadedEpisodes[index].ticket;
	},
	
	prepareLoad: function (paneTitle, showPodcastTitles, showDownloads, showPlaylist) {
		this.$.selectedPodcastName.setContent(paneTitle);
		this.$.showPlaylistButton.setDisabled(showPlaylist || this.playlist.length === 0);
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