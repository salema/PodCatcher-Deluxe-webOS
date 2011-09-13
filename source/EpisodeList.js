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
		onSelectEpisode: ""
	},
	components: [
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
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
		
		//this.formatter = new enyo.g11n.DateFmt({date: "long", time: "short", weekday: true});
	},
	
	setPodcast: function(podcast) {
		this.prepareLoad($L("Select from") + " \"" + podcast.title + "\"", false);
		this.podcastList.push(podcast);
		
		Utilities.prepareFeedService(this.$.grabPodcast, podcast.url, podcast.user, podcast.pass);
		this.$.grabPodcast.call();
	},
	
	setPodcastList: function(podcastList) {
		this.prepareLoad($L("Select from all"), true);
		
		for (var index = 0; index < podcastList.length; index++) {
			this.podcastList.push(podcastList[index]);
			Utilities.prepareFeedService(this.$.grabPodcast, podcastList[index].url,
					podcastList[index].user, podcastList[index].pass);
			this.$.grabPodcast.call();
		}
	},
		
	getEpisode: function(inSender, index) {
		var episode = this.episodeList[index];

		if (episode) {
			this.$.episodeTitle.setContent(episode.title);
			if (this.selectedIndex == index) this.$.episodeTitle.addClass("highlight");
			
			var pubDate = new Date(episode.pubDate);
			if (this.formatter != undefined) this.$.episodePublished.setContent(this.formatter.format(pubDate));
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
	
	grabPodcastSuccess: function(sender, response, request) {
		this.loadCounter++;
		
		var xmlTree = XmlHelper.parse(response);
		var items = XmlHelper.get(xmlTree, XmlHelper.ITEM);
		
		for (var index = 0; index < items.length; index++) {
			var episode = new Episode();
			if (! episode.isValid(items[index])) continue;
			
			episode.read(items[index]);
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
			else this.afterLoad(true);
		}
	},
	
	loadFailed: function() {
		this.warn("Failed to load podcast feed");
		this.$.error.setContent($L("The podcast feed failed to load. Please make sure you are online."));
		this.$.error.setStyle("color: red;");
		this.$.error.show();
		this.$.episodeSpinner.hide();
	},
	
	prepareLoad: function (paneTitle, showPodcastTitles) {
		this.$.selectedPodcastName.setContent(paneTitle);
		this.$.episodeSpinner.show();
		this.$.error.hide();
		
		this.showPodcastTitle = showPodcastTitles;
		this.selectedIndex = -1;
		this.episodeList = [];
		this.loadCounter = 0;
		this.podcastList = [];
		
		this.$.episodeListVR.render();	
	},
	
	afterLoad: function (sort) {
		if (sort) this.episodeList.sort(new Episode().compare);
		
		this.$.episodeListScroller.scrollTo(0, 0);
		this.$.episodeListVR.render();
		this.$.episodeSpinner.hide();
	}
}); 
