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
 * Shows list of all episodes (podcast feed items) as a sliding pane
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.EpisodeList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	LIMIT: 100,
	events: {
		onSelectEpisode: ""
	},
	components: [
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{content: $L("Select"), name: "selectedPodcastName", className: "nowrap", flex: 1},
			{kind: "Spinner", name: "episodeSpinner", align: "right"}
		]},
		{name: "error", showing: false, className: "error"},
		{kind: "Scroller", name: "episodeListScroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "episodeListVR", onSetupRow: "getEpisode", onclick: "selectEpisode", components: [
				{kind: "Item", layout: "HFlexBox", components: [
					{name: "episodeTitle", className: "nowrap"},
					{name: "episodePublished", className: "nowrap", style: "font-size: smaller"}
				]}
			]}
		]},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.episodeList = [];
		this.selectedIndex = -1;
		
		if (window.PalmSystem) 
			this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short", weekday: true});
	},
	
	setPodcast: function(podcast) {
		this.$.selectedPodcastName.setContent($L("Select from") + " \"" + podcast.title + "\"");
		this.showPodcastTitle = false;
		
		this.episodeList = podcast.episodeList;
		
		this.afterLoad();
	},
	
	setPodcastList: function(podcastList) {
		this.$.selectedPodcastName.setContent($L("Select from all"));
		this.showPodcastTitle = true;
		
		for (var index = 0; index < podcastList.length; index++) {
			var list = podcastList[index].episodeList;
			
			if (list)
				for (var item = 0; item < list.length; item++)
					this.episodeList.push(list[item]);
		}
		
		this.afterLoad();
	},
		
	getEpisode: function(inSender, index) {
		var episode = this.episodeList[index];

		if (episode) {
			this.$.episodeTitle.setContent(episode.title);
			if (this.selectedIndex == index) this.$.episodeTitle.addClass("highlight");
			
			var pubDate = new Date(episode.pubDate);
			if (this.formatter) this.$.episodePublished.setContent(this.formatter.format(pubDate));
			else this.$.episodePublished.setContent(episode.pubDate);
			
			// Put podcast title if wanted
			if (this.showPodcastTitle) this.$.episodePublished.setContent(episode.podcastTitle + " - " + this.$.episodePublished.getContent());
			
			if (this.selectedIndex == index) this.$.episodePublished.addClass("highlight");
		}
		
		return index < this.episodeList.length && index < this.LIMIT;
	},
	
	selectEpisode: function(inSender, inIndex) {
		this.selectedIndex = this.$.episodeListVR.fetchRowIndex();
		
		var episode = this.episodeList[this.selectedIndex];
		if (episode) this.doSelectEpisode(episode);
		
		this.$.episodeListVR.render();
	},
	
	prepareLoad: function() {
		this.$.selectedPodcastName.setContent($L("Select"));
		this.$.episodeSpinner.show();
		this.$.error.hide();
		
		this.selectedIndex = -1;
		this.episodeList = [];
		
		this.$.episodeListVR.render();	
	},
	
	afterLoad: function() {
		this.episodeList.sort(new Episode().compare);
		
		this.$.episodeListScroller.scrollTo(0, 0);
		this.$.episodeListVR.render();
		this.$.episodeSpinner.hide();
		
		if (this.episodeList.length === 0) this.loadFailed();
	},
	
	loadFailed: function() {
		this.$.error.setContent($L("The podcast feed failed to load. Please make sure that you are online."));
		this.$.error.setStyle("color: red;");
		this.$.error.show();
	}
}); 
