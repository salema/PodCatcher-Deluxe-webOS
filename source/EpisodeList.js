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
	events: {
		onSelectEpisode: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{content: $L("Select"), name: "selectedPodcastName", className: "nowrap", flex: 1},
			{kind: "Spinner", name: "episodeSpinner", align: "right"}
		]},
		{name: "error", style: "display: none", className: "error"},
		{kind: "Scroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "episodeListVR", onSetupRow: "getEpisode", onclick: "selectEpisode", components: [
				{kind: "Item", layout: "HFlexBox", components: [
					{name: "episodeTitle", className: "nowrap"},
					{name: "episodePublished", className: "nowrap", style: "font-size: smaller"}
				]}
			]}
		]},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "showAllButton", caption: $L("New only"), onclick: "toggleShowAll", flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.helper = new XmlHelper();
		this.episodeList = [];
		this.selectedIndex = -1;
		this.showAll = true;
		this.markedEpisodes = [];
		
		// add weekday makes this crash
		//this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short", weekday: true});
		this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short"});
		
		this.$.preferencesService.call(
		{
			keys: ["markedEpisodes"]
		},
		{
			method: "getPreferences",
			onSuccess: "restoreMarkedEpisodes",
		});
	},
	
	restoreMarkedEpisodes: function(inSender, inResponse) {
		var list = inResponse.markedEpisodes;
		
		for (var index = 0; index < list.length; index++) {
			this.markedEpisodes.push(list[index]);
		}
	},
	
	storeMarkedEpisodes: function() {
		this.$.preferencesService.call(
		{
			"markedEpisodes": this.markedEpisodes
		},
		{
			method: "setPreferences"
		});
	},
	
	setPodcast: function(podcast) {
		this.$.selectedPodcastName.setContent($L("Select from") + " \"" + podcast.title + "\"");
		this.$.episodeSpinner.show();
		this.$.error.setStyle("display: none;");
		
		this.selectedIndex = -1;
		this.episodeList = [];
		this.$.episodeListVR.render();
		
		this.$.grabPodcast.setUrl(encodeURI(podcast.url));
		this.$.grabPodcast.call();
	},
		
	getEpisode: function(inSender, inIndex) {
		var episode = this.episodeList[inIndex];
		
		if (episode) {
			var old = this.markedEpisodes.indexOf(episode.url) >= 0
			
			if (!this.showAll && old) {
				this.$.episodeTitle.parent.setStyle("display: none;");
			} else {
				this.$.episodeTitle.setContent(episode.title);
				if (this.selectedIndex == inIndex) this.$.episodeTitle.addClass("highlight");
				if (old) this.$.episodeTitle.addClass("marked");
				
				var pubDate = new Date(episode.pubDate);
				if (this.formatter != undefined) this.$.episodePublished.setContent(this.formatter.format(pubDate));
				else this.$.episodePublished.setContent(episode.pubDate);
				
				if (old) this.$.episodePublished.addClass("marked");
			}
			
			return true;
		}
	},
	
	selectEpisode: function(inSender, inIndex) {
		if (this.$.episodeListVR.fetchRowIndex() == this.selectedIndex) return; 
		else this.selectedIndex = this.$.episodeListVR.fetchRowIndex();
		
		var episode = this.episodeList[this.selectedIndex];
		if (episode) {
			episode.marked = this.markedEpisodes.indexOf(episode.url) >= 0;
			this.doSelectEpisode(episode);
		}
		
		this.$.episodeListVR.render();
	},
	
	markEpisode: function(episode, marked) {
		if (marked && this.markedEpisodes.indexOf(episode.url) < 0) 
			this.markedEpisodes.push(episode.url);
		else if (!marked) {
			var index = this.markedEpisodes.indexOf(episode.url);
			if (index >= 0) this.markedEpisodes.splice(index, 1);
		}
		
		this.storeMarkedEpisodes();
		this.$.episodeListVR.render();
	},
	
	toggleShowAll: function(inSender, inEvent) {
		this.showAll = !this.showAll;
		
		if (this.showAll) this.$.showAllButton.setCaption($L("New only"))
		else this.$.showAllButton.setCaption($L("Show all"))
		
		this.$.episodeListVR.render();
	},
	
	grabPodcastSuccess: function(inSender, inResponse, inRequest) {
		var xmlTree = this.helper.parse(inResponse);
		var items = this.helper.get(xmlTree, XmlHelper.ITEM);
		
		for (var index = 0; index < items.length; index++) {
			var episode = new Episode();
			if (! episode.isValid(items[index])) continue;
			
			episode.read(items[index]);
			this.episodeList.push(episode);
		}
		
		if (this.episodeList.length == 0) this.grabPodcastFailed();
		
		this.$.episodeListVR.render();
		this.$.episodeSpinner.hide();
	},
	
	grabPodcastFailed: function() {
		this.warn("Failed to load podcast feed");
		this.$.error.setContent($L("The podcast feed failed to load. Please make sure you are online."));
		this.$.error.setStyle("display: block;");
		this.$.episodeSpinner.hide();
	}
}); 