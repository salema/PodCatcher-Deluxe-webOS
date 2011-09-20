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
 * Main podcatcher kind
 * Establishes components and manages some control flow
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher",
	kind: "VFlexBox",
	HOME_PAGE: "http://salema.github.com/Yet-Another-Simple-Pod-Catcher",
	HELP_PAGE: "http://salema.github.com/Yet-Another-Simple-Pod-Catcher/help.html",
	AUTO_UPDATE_INTERVAL: 30 * 60 * 1000,
	components: [
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "AppMenu", components: [
			{kind: "AppMenuItem", caption: $L("Episodes"), components: [
				{kind: "AppMenuItem", caption: $L("Mark all"), icon: "icons/star-off.png", onclick: "markAll"},
				{kind: "AppMenuItem", caption: $L("Unmark all"), icon: "icons/star-on.png", onclick: "unmarkAll"}
       		]},
		    {kind: "AppMenuItem", caption: $L("Help"), onclick: "openHelp"},
			{kind: "AppMenuItem", caption: $L("About"), onclick: "openAbout"}
		]},
		{kind: "Dashboard", name: "dashboard", smallIcon: "icons/icon48.png", onTap: "togglePlay"},
		{kind: "SlidingPane", flex: 1, components: [
			{kind: "Net.Alliknow.PodCatcher.PodcastList", name: "podcastListPane", width: "230px", onPrepareLoad: "prepareLoad",
					onSelectPodcast: "podcastSelected", onSelectAll: "allPodcastsSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeList", name: "episodeListPane", width: "360px", peekWidth: 0,
					onSelectEpisode: "episodeSelected", onPlaylistChanged: "playlistChanged", onSpecialListSelected: "specialListSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeView", name: "episodeViewPane", flex: 1, peekWidth: 0, onTogglePlay: "updateDashboard", onNext: "playNext",
					onPlaybackEnded: "playNext", onResume: "updateDashboard", onMarkEpisode: "episodeMarked", onOpenInBrowser: "openInBrowser",
					onDownloaded: "episodeDownloaded", onDelete: "deleteDownloadedEpisode", onResize: "videoResize"}
		]}
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.autoUpdateInterval = setInterval(enyo.bind(this, this.autoUpdate), this.AUTO_UPDATE_INTERVAL);
	},
	
	destroy: function() {
		clearInterval(this.autoUpdateInterval);
		
		this.inherited(arguments);
	},
	
	autoUpdate: function() {
		this.$.podcastListPane.autoUpdate();
	},
	
	openAbout: function() {
		this.openInBrowser(this, this.HOME_PAGE);
	},
	
	openHelp: function() {
		this.openInBrowser(this, this.HELP_PAGE);
	},
	
	markAll: function() {
		this.$.episodeListPane.markAll(true);
		this.$.episodeViewPane.reloadMarkedStatus();
	},
	
	unmarkAll: function() {
		this.$.episodeListPane.markAll(false);
		this.$.episodeViewPane.reloadMarkedStatus();
	},
	
	markAll: function() {
		this.$.episodeListPane.markAll(true);
		this.$.episodeViewPane.reloadMarkedStatus();
	},
	
	unmarkAll: function() {
		this.$.episodeListPane.markAll(false);
		this.$.episodeViewPane.reloadMarkedStatus();
	},
	
	prepareLoad: function(sender) {
		this.$.episodeListPane.prepareLoad();
	},
	
	podcastSelected: function(sender, podcast) {
		this.$.episodeListPane.setPodcast(podcast);
	},
	
	allPodcastsSelected: function(sender, podcastList) {
		this.$.episodeListPane.setPodcastList(podcastList);
	},
	
	specialListSelected: function(sender) {
		this.$.podcastListPane.specialListSelected();
	},
	
	episodeSelected: function(sender, episode, autoplay) {
		this.$.episodeViewPane.setEpisode(episode, autoplay);
		
		if (!this.$.episodeViewPane.downloads && !this.$.episodeViewPane.plays)
			this.updateDashboard(this, episode);
	},
	
	videoResize: function(sender, width) {
		this.$.episodeViewPane.videoResize(width.substring(0, width.length - 2));
	},
	
	playlistChanged: function(sender, newLength) {
		this.$.episodeViewPane.playlistChanged(newLength);
	},
	
	episodeDownloaded: function(sender, episode) {
		this.$.episodeListPane.addToDownloaded(episode);
	},
	
	deleteDownloadedEpisode: function(sender, episode) {
		this.$.episodeListPane.removeFromDownloaded(episode);
	},
	
	episodeMarked: function(sender, episode) {
		this.$.episodeListPane.markEpisode(episode);
	},
	
	togglePlay: function() {
		if (! this.$.episodeViewPane.isAtEndOfPlayback())
			this.$.episodeViewPane.togglePlay();
		
		this.updateDashboard();
	},
	
	playNext: function() {
		if (this.$.episodeViewPane.plays) this.$.episodeViewPane.togglePlay();
		
		this.$.episodeListPane.nextInPlaylist(this.$.episodeViewPane.episode);
		this.updateDashboard();
	},
	
	openAppMenuHandler: function() {
		this.$.appMenu.open();
	},
	
	closeAppMenuHandler: function() {
		this.$.appMenu.close();
	},
	
	openInBrowser: function(sender, url) {
		this.$.launchBrowserCall.call({"id": "com.palm.app.browser", "params": {"target": url}});
	},
	
	updateDashboard: function() {
		// Default: we are playing
		var playText = $L("Pause");
		
		// If not, figure out what else is the status
		if (!this.$.episodeViewPane.plays)
			if (this.$.episodeViewPane.isAtStartOfPlayback()) playText = $L("Play");
			else if (this.$.episodeViewPane.isAtEndOfPlayback()) playText = $L("Playback complete");
			else if (this.$.episodeViewPane.isInMiddleOfPlayback()) playText = $L("Resume");
		
		var episode = this.$.episodeViewPane.episode;
		this.$.dashboard.setLayers([{icon: "icons/icon48.png", title: episode.title, text: episode.podcastTitle + " - " + playText}]);
	}
});
