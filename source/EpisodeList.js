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
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "Header", layoutKind: "HFlexLayout", style: "min-height: 60px", components: [
			{content: $L("Select"), name: "selectedPodcastName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1},
			{kind: "Spinner", name: "episodeSpinner", align: "right"}
		]},
		{kind: "Scroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "episodeListVR", onSetupRow: "getEpisode", onclick: "selectEpisode", components: [
				{kind: "Item", layout: "HFlexBox", components: [
					{name: "episodeTitle", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"},
					{name: "episodePublished", style: "font-size: 0.75em"}
				]}
			]}
		]},
		{kind: "Toolbar", components: [
			{kind: "GrabButton"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.episodeList = [];
		this.selectedIndex = -1;
		this.formatter = new enyo.g11n.DateFmt({date: "long", time: "medium"});
	},
	
	getEpisode: function(inSender, inIndex) {
		var episode = this.episodeList[inIndex];

		if (episode) {
			this.$.episodeTitle.setContent(episode.title);
			if (this.selectedIndex == inIndex) this.$.episodeTitle.addClass("highlight");
			
			var pubDate = new Date(episode.pubDate);
			if (this.formatter != undefined) this.$.episodePublished.setContent(this.formatter.format(pubDate));
			else this.$.episodePublished.setContent(episode.pubDate);
			
			return true;
		}
	},
	
	selectEpisode: function(inSender, inIndex) {
		if (this.$.episodeListVR.fetchRowIndex() == this.selectedIndex) return; 
		else this.selectedIndex = this.$.episodeListVR.fetchRowIndex();
		
		var episode = this.episodeList[this.selectedIndex];
		
		if (episode) this.doSelectEpisode(episode);
		
		this.$.episodeListVR.render();
	},
	
	setPodcast: function(podcast) {
		this.$.selectedPodcastName.setContent($L("Select from") + " \"" + podcast.title + "\"");
		this.$.episodeSpinner.show();
		
		this.selectedIndex = -1;
		this.episodeList = [];
		this.$.episodeListVR.render();
		
		this.$.grabPodcast.setUrl(encodeURI(podcast.url));
		this.$.grabPodcast.call();
	},
	
	grabPodcastSuccess: function(inSender, inResponse, inRequest) {
		var parser = new DOMParser;
		var source = parser.parseFromString(inResponse, "text/xml");
		var items = source.getElementsByTagName("item");
		
		for (var index = 0; index < items.length; index++) {
			var episode = new Episode();
			if (! episode.isValid(items[index])) continue;
			
			episode.read(items[index]);
			this.episodeList.push(episode);
		}
		
		this.$.episodeListVR.render();
		this.$.episodeSpinner.hide();
	},
	
	grabPodcastFailed: function() {
		enyo.log("Failed to load podcast feed");
		this.$.episodeSpinner.hide();
	},
}); 