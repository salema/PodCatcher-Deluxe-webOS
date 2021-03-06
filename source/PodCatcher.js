/** Copyright 2011, 2012 Kevin Hausmann
 *
 * This file is part of PodCatcher Deluxe.
 *
 * PodCatcher Deluxe is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * PodCatcher Deluxe is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PodCatcher Deluxe. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Main podcatcher kind
 * Establishes components and manages some control flow
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher",
	kind: "VFlexBox",
	APP: "http://developer.palm.com/appredirect/?packageid=net.alliknow.podcatcher",
	HOME_PAGE: "http://www.podcatcher-deluxe.com",
	HELP_PAGE: "http://www.podcatcher-deluxe.com/manual",
	AUTO_UPDATE_INTERVAL: 30 * 60 * 1000,
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "ApplicationEvents", onWindowRotated: "showNextButton"},
		{kind: "ApplicationEvents", onWindowActivated: "windowActivated"},
		{kind: "ApplicationEvents", onWindowDeactivated: "windowDeactivated"},
		{kind: "AppMenu", onBeforeOpen: "updateMenu", components: [
			{kind: "MenuCheckItem", caption: $L("Autodownload"), name: "autoDownloadCheck", onclick: "toggleAutoDownload", checked: false},
			{kind: "AppMenuItem", caption: $L("Episodes"), components: [
				{kind: "AppMenuItem", caption: $L("All old"), icon: "icons/star-off.png", onclick: "markAll"},
				{kind: "AppMenuItem", caption: $L("All new"), icon: "icons/star-on.png", onclick: "unmarkAll"}
       		]},
		    {kind: "AppMenuItem", caption: $L("Help"), onclick: "openHelp"},
			{kind: "AppMenuItem", caption: $L("About"), onclick: "openAbout"},
		    {kind: "AppMenuItem", caption: $L("Review"), onclick: "openReview"}
		]},
		{kind: "Dashboard", name: "dashboard", smallIcon: "icons/icon48.png", onTap: "togglePlay"},
		{kind: "SlidingPane", flex: 1, components: [
			{kind: "Net.Alliknow.PodCatcher.PodcastList", name: "podcastListPane", width: "230px", onPrepareLoad: "prepareLoad",
					onSelectPodcast: "podcastSelected", onSelectAll: "allPodcastsSelected", onAutoUpdateComplete: "autoDownload"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeList", name: "episodeListPane", width: "380px",
					onSelectEpisode: "episodeSelected", onPlaylistChanged: "showNextButton", onSpecialListSelected: "specialListSelected",
					onResumeComplete: "episodeViewResumeComplete"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeView", name: "episodeViewPane", flex: 1, onNext: "playNext",
					onPlaybackEnded: "playNext", onResume: "updateDashboard", onMarkEpisode: "episodeMarked", onOpenInBrowser: "openInBrowser",
					onDownloaded: "episodeDownloaded", onDeleteDownload: "deleteDownloadedEpisode"}
		]}
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.enableAutoDownload = false;
		this.showDashboard = false;
		
		this.$.preferencesService.call({keys: ["enableAutoDownload"]}, {method: "getPreferences", onSuccess: "restore"});
	},
	
	ready: function() {
		this.autoUpdateInterval = setInterval(enyo.bind(this, this.autoUpdate), this.AUTO_UPDATE_INTERVAL);
	},
	
	destroy: function() {
		clearInterval(this.autoUpdateInterval);
				
		this.inherited(arguments);
	},
	
	restore: function(sender, response) {
		if (response.enableAutoDownload != undefined)
			this.enableAutoDownload = response.enableAutoDownload;
	},
	
	store: function() {
		this.$.preferencesService.call({"enableAutoDownload": this.enableAutoDownload}, {method: "setPreferences"});
	},
	
	updateMenu: function() {
		this.$.autoDownloadCheck.setChecked(this.enableAutoDownload);
	},
	
	autoUpdate: function() {
		this.$.podcastListPane.autoUpdate();
	},
	
	toggleAutoDownload: function() {
		this.enableAutoDownload = !this.enableAutoDownload;
		// If auto-download was enabled, start it right away
		if (this.enableAutoDownload) this.autoUpdate();
		
		this.store();
	},
	
	autoDownload: function(sender, podcastList) {
		if (this.enableAutoDownload) {
			for (var index = 0; index < podcastList.length; index++) {
				// Get latest episode for each podcast
				var episodeList = podcastList[index].episodeList;
				if (!episodeList || episodeList.length === 0) continue;
				else episodeList.sort(new Episode().compare);
				
				var candidate = episodeList[0];
				
				// Filter for marked and downloaded
				if (this.$.episodeListPane.markedEpisodes.indexOf(candidate.url) >= 0 ||
					Utilities.isInList(this.$.episodeListPane.downloadedEpisodes, candidate)) continue;
				
				// Enqueue remaining for download
				this.$.episodeViewPane.downloadEpisode(candidate);
				this.log("Queued episode for download: \"" + candidate.title + "\" at " + candidate.url);
			}		
		}
	},
	
	openAbout: function() {
		this.openInBrowser(this, this.HOME_PAGE);
	},
	
	openHelp: function() {
		this.openInBrowser(this, this.HELP_PAGE);
	},
	
	openReview: function() {
		this.openInBrowser(this, this.APP);
	},
	
	markAll: function() {
		this.$.episodeListPane.markAll(true);
		this.$.episodeViewPane.reloadMarkedStatus();
		
		this.$.podcastListPane.repaint();
	},
	
	unmarkAll: function() {
		this.$.episodeListPane.markAll(false);
		this.$.episodeViewPane.reloadMarkedStatus();
		
		this.$.podcastListPane.repaint();
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
		
		if (! this.$.episodeViewPane.plays)	this.updateDashboard();
	},
	
	showNextButton: function() {
		var playlistEmpty = this.$.episodeListPane.playlist.length === 0;
		var portrait = enyo.getWindowOrientation() == "right" || enyo.getWindowOrientation() == "left";
		
		this.$.episodeViewPane.showNextButton(!playlistEmpty && !portrait);
	},
	
	episodeDownloaded: function(sender, episode) {
		this.$.episodeListPane.addToDownloaded(episode);
		
		if (window.PalmSystem)
			enyo.windows.addBannerMessage($L("Downloaded") + " \"" + episode.title + "\"", "{}", "icons/icon48.png");
	},
	
	deleteDownloadedEpisode: function(sender, episode) {
		this.$.episodeListPane.removeFromDownloaded(episode);
	},
	
	episodeMarked: function(sender, episode) {
		this.$.episodeListPane.markEpisode(episode);
		
		this.$.podcastListPane.repaint();
	},
	
	togglePlay: function() {
		if (! this.$.episodeViewPane.isAtEndOfPlayback())
			this.$.episodeViewPane.togglePlay();
		
		this.updateDashboard();
	},
	
	playNext: function() {
		if (this.$.episodeListPane.playlist.length > 0) {
			if (this.$.episodeViewPane.plays) this.$.episodeViewPane.togglePlay();
			
			this.$.episodeListPane.nextInPlaylist(this.$.episodeViewPane.episode);
			this.updateDashboard();
		}
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
	
	windowActivated: function() {
		this.showDashboard = false;
		this.updateDashboard();
	},
	
	windowDeactivated: function() {		
		this.showDashboard = true;
		this.updateDashboard();
	},
	
	updateDashboard: function() {
		// Only use dashboard where it actually exists and we are not focused and there is no video
		if (window.PalmSystem && this.showDashboard) {
			// Default: we are playing
			var playText = $L("Pause");
			
			// If not, figure out what else is the status
			if (! this.$.episodeViewPane.plays) {
				if (this.$.episodeViewPane.isAtStartOfPlayback()) playText = $L("Play");
				else if (this.$.episodeViewPane.isAtEndOfPlayback()) playText = $L("Playback complete");
				else playText = $L("Resume");
			}
			
			var episode = this.$.episodeViewPane.episode;
			if (episode)
				this.$.dashboard.setLayers([{icon: "icons/icon48.png", title: episode.title, text: episode.podcastTitle + " - " + playText}]);
		} else this.$.dashboard.setLayers([]);
	},
	
	episodeViewResumeComplete: function() {
		// propagate marked episodes to podcast list
		this.$.podcastListPane.markedEpisodes = this.$.episodeListPane.markedEpisodes;
		// alert episode view about playlist length 
		this.showNextButton();
	}
});
