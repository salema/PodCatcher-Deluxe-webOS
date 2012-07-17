/** Copyright 2011, 2012 Kevin Hausmann
 *
 * This file is part of Simple PodCatcher.
 *
 * Simple PodCatcher is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * Simple PodCatcher is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Simple PodCatcher. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Main podcatcher kind
 * Establishes components and manages some control flow
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher",
	kind: "VFlexBox",
	VIDEOCATCHER: "http://developer.palm.com/appredirect/?packageid=net.alliknow.videocatcher",
	PODCATCHER: "http://developer.palm.com/appredirect/?packageid=net.alliknow.podcatcher",
	HOME_PAGE: "http://www.podcatcher-deluxe.com",
	HELP_PAGE: "http://www.podcatcher-deluxe.com/manual",
	AUTO_UPDATE_INTERVAL: 30 * 60 * 1000,
	components: [
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "ApplicationEvents", onWindowActivated: "windowActivated"},
		{kind: "ApplicationEvents", onWindowDeactivated: "windowDeactivated"},
		{kind: "AppMenu", components: [
			{kind: "AppMenuItem", caption: "PodCatcher Deluxe", components: [
				{kind: "AppMenuItem", caption: $L("Video"), onclick: "openVideoDeluxe"},
				{kind: "AppMenuItem", caption: $L("Audio"), onclick: "openDeluxe"}
			]},
			{kind: "AppMenuItem", caption: $L("Help"), onclick: "openHelp"},
			{kind: "AppMenuItem", caption: $L("About"), onclick: "openAbout"}
		]},
		{kind: "Dashboard", name: "dashboard", smallIcon: "icons/icon48.png", onTap: "togglePlay"},
		{kind: "SlidingPane", flex: 1, components: [
			{kind: "Net.Alliknow.PodCatcher.PodcastList", name: "podcastListPane", width: "230px", onPrepareLoad: "prepareLoad",
					onSelectPodcast: "podcastSelected", onSelectAll: "allPodcastsSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeList", name: "episodeListPane", width: "360px", onSelectEpisode: "episodeSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeView", name: "episodeViewPane", flex: 1, 
					onPlaybackEnded: "updateDashboard", onOpenInBrowser: "openInBrowser"}
		]}
	],
	
	create: function() {
		this.inherited(arguments);
		this.showDashboard = false;
	},
	
	ready: function() {
		this.autoUpdateInterval = setInterval(enyo.bind(this, this.autoUpdate), this.AUTO_UPDATE_INTERVAL);
	},
	
	destroy: function() {
		clearInterval(this.autoUpdateInterval);
		
		this.inherited(arguments);
	},
	
	autoUpdate: function() {
		this.$.podcastListPane.autoUpdate();
	},
	
	openVideoDeluxe: function(inSender) {
		this.openInBrowser(this, this.VIDEOCATCHER);
	},
	
	openDeluxe: function(inSender) {
		this.openInBrowser(this, this.PODCATCHER);
	},
	
	openAbout: function() {
		this.openInBrowser(this, this.HOME_PAGE);
	},
	
	openHelp: function() {
		this.openInBrowser(this, this.HELP_PAGE);
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
	
	episodeSelected: function(inSender, episode) {
		this.$.episodeViewPane.setEpisode(episode);
		this.updateDashboard();
	},
	
	togglePlay: function() {
		if (! this.$.episodeViewPane.isAtEndOfPlayback())
			this.$.episodeViewPane.togglePlay();
		
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
});
