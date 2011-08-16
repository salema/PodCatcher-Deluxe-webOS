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
	components: [
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "AppMenu", components: [
			{kind: "AppMenuItem", caption: $L("About"), onclick: "openAbout"},
			{kind: "AppMenuItem", caption: $L("Help"), onclick: "openHelp"}
		]},
		{kind: "Dashboard", name: "dashboard", smallIcon: "icons/icon48.png", onTap: "togglePlay"},
		{kind: "SlidingPane", flex: 1, components: [
			{kind: "Net.Alliknow.PodCatcher.PodcastList", name: "podcastListPane", width: "230px", 
					onSelectPodcast: "podcastSelected", onSelectAll: "allPodcastsSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeList", name: "episodeListPane", width: "350px", peekWidth: 100, 
					onSelectEpisode: "episodeSelected", onDownloadsSelected: "downloadsSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeView", name: "episodeViewPane", flex: 1, peekWidth: 250, onResume: "updateDashboard",
					onMarkEpisode: "episodeMarked", onOpenInBrowser: "openInBrowser", onDownloaded: "episodeDownloaded", onDelete: "deleteDownloadedEpisode"}
		]}
	],
	
	openAbout: function() {
		this.openInBrowser(PodCatcher.HOME_PAGE);
	},
	
	openHelp: function() {
		this.openInBrowser(PodCatcher.HELP_PAGE);
	},
	
	podcastSelected: function(inSender, podcast) {
		this.$.episodeListPane.setPodcast(podcast);
	},
	
	allPodcastsSelected: function(inSender, podcastList) {
		this.$.episodeListPane.setPodcastList(podcastList);
	},
	
	downloadsSelected: function(inSender) {
		this.$.podcastListPane.downloadsSelected();
	},
	
	episodeSelected: function(inSender, episode, marked) {
		this.updateDashboard(this, episode);
		this.$.episodeViewPane.setEpisode(episode, marked);
	},
	
	episodeDownloaded: function(inSender, episode, inResponse) {
		this.$.episodeListPane.addToDownloaded(episode, inResponse);
	},
	
	deleteDownloadedEpisode: function(inSender, episode) {
		this.$.episodeListPane.removeFromDownloaded(episode);
	},
	
	episodeMarked: function(inSender, episode, marked) {
		this.$.episodeListPane.markEpisode(episode, marked);
	},
	
	togglePlay: function() {
		this.$.episodeViewPane.togglePlay();
		
		var text = this.$.episodeViewPane.plays ? $L("Tap to pause") : $L("Tap to resume");
		this.updateDashboard(this, this.$.episodeViewPane.episode, text);
	},
	
	openAppMenuHandler: function() {
		this.$.appMenu.open();
	},
	
	closeAppMenuHandler: function() {
		this.$.appMenu.close();
	},
	
	openInBrowser: function(inUrl) {
		this.$.launchBrowserCall.call({"id": "com.palm.app.browser", "params": {"target": inUrl}});
	},
	
	updateDashboard: function(inSender, episode, text) {
		if (text == undefined) text = $L("Tap to play");
		
		//this.$.dashboard.setLayers([{icon: "icons/icon48.png", title: episode.title, text: episode.podcastTitle + " - " + text}]);
	}
});

function PodCatcher() {}

PodCatcher.HOME_PAGE = "http://salema.github.com/Yet-Another-Simple-Pod-Catcher";
PodCatcher.HELP_PAGE = "http://salema.github.com/Yet-Another-Simple-Pod-Catcher/help.html";