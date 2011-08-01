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
 * Shows list of all podcasts as a sliding pane
 * Throws event on podcast selection to be handled by owner
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.PodcastList",
	kind: "SlidingView",
	layoutKind: "VFlexLayout",
	events: {
		onSelectPodcast: ""
	},
	components: [
		{kind: "ApplicationEvents", onLoad: "startup"},
		{kind: "ApplicationEvents", onUnload: "shutdown"},
		{kind: "SystemService", name: "preferencesService"},
		{kind: "Net.Alliknow.PodCatcher.AddPodcastPopup", name: "addPodcastPopup", onAddPodcast: "addPodcast"},
		{kind: "Header", content: "Discover Podcasts",  style: "min-height: 60px;"},
		{kind: "Scroller", name: "podcastListScroller", flex: 1, components: [
			{kind: "VirtualRepeater", name: "podcastListVR", onSetupRow: "getPodcast", onclick: "selectPodcast", components: [
				{kind: "SwipeableItem", layoutKind: "HFlexLayout", onConfirm: "deletePodcast", components: [
					{name: "podcastTitle", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", content: ""}
				]}
			]}
		]},
		{kind: "Image", name: "podcastImage", style: "width: 82%; padding: 10px 20px; border-top: 2px solid gray", src: "icons/icon128.png"},
		{kind: "Toolbar", pack: "justify", components: [
			{kind: "ToolButton", caption: "Add", onclick: "showAddPodcastPopup", flex: 1},
			{kind: "ToolButton", name: "deleteButton", caption: "Delete", onclick: "deletePodcast", disabled: true}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.$.preferencesService.call(
		{
			keys: ["storedPodcastList"]
		},
		{
			method: "getPreferences",
			onSuccess: "gotPreferences",
			onFailure: "gotPreferencesFailure"
		});
		
		this.selectedIndex = -1;
		this.podcastList = [];
	},
	
	gotPreferences: function(inSender, inResponse) {
		if (inResponse.storedPodcastList == undefined) return;
		
		for (var index = 0; index < inResponse.storedPodcastList.length; index++) {
			this.podcastList.push(inResponse.storedPodcastList[index]);
		}
				
		this.$.podcastListVR.render();
	},
	
	gotPreferencesFailure: function(inSender, inResponse) {
		enyo.log("got failure from preferencesService");
	},
	
	startup: function() {
		if (this.podcastList.length == 0) this.showAddPodcastPopup();
	},
	
	shutdown: function() {
		enyo.log("shutdown called");
		this.$.preferencesService.call(
		{
			keys: {
				"storedPodcastList": this.podcastList
			}
		},
		{
			method: "setPreferences"
		});
	},
	
	getPodcast: function(inSender, inIndex) {
		var podcast = this.podcastList[inIndex];
		
		if (podcast) {
			this.$.podcastTitle.setContent(podcast.title);
			if (this.selectedIndex == inIndex) this.$.podcastTitle.addClass("highlight");
			return true;
		}
	},
	
	selectPodcast: function(inSender, inIndex) {
		this.selectedIndex = this.$.podcastListVR.fetchRowIndex();
		var podcast = this.podcastList[this.selectedIndex];
		
		if (podcast) {
			if (podcast.image != undefined) this.$.podcastImage.setSrc(podcast.image);
			else this.$.podcastImage.setSrc("icons/icon128.png");
			this.$.deleteButton.setDisabled(false);
			this.doSelectPodcast(podcast);
		}
		
		this.$.podcastListVR.render();
	},

	showAddPodcastPopup: function(inSender, inIndex) {
		this.$.addPodcastPopup.openAtCenter();
		this.$.addPodcastPopup.reset();
	},
	
	addPodcast: function(inSender, podcast) {
		// TODO Is already in list?
		this.podcastList.push(podcast);
		this.$.podcastListVR.render();
		
		this.$.podcastListScroller.scrollToBottom();
	},

	deletePodcast: function(inSender, inIndex) {
		// Make this work for the button as well
		if (inIndex instanceof MouseEvent) {
			if (this.selectedIndex < 0) return;
			inIndex = this.selectedIndex;
		}
		
		this.podcastList.splice(inIndex, 1);
		
		// Via button only
		if (inIndex == this.selectedIndex) {
			this.selectedIndex = -1;
			this.$.podcastImage.setSrc("icons/icon128.png");
			this.$.deleteButton.setDisabled(true);
		}
		// Via swipe and above in list
		else if (inIndex < this.selectedIndex) this.selectedIndex--;
		
		this.$.podcastListVR.render();	
	},
	
	addTestPodcasts: function() {
		this.podcastList.push({
			title: "Letter for Gaelic Learners",
			url: "http://downloads.bbc.co.uk/podcasts/scotland/litirbheag/rss.xml"
		});
		this.podcastList.push({
			title: "BBC World Update: Daily Commute",
			url: "http://downloads.bbc.co.uk/podcasts/worldservice/worldupmc/rss.xml"
		});
		this.podcastList.push({
			title: "Burmese Morning Broadcast",
			url: "http://downloads.bbc.co.uk/podcasts/worldservice/burmorning/rss.xml"
		});
		this.podcastList.push({
			title: "Newshour",
			url: "http://downloads.bbc.co.uk/podcasts/worldservice/newshour/rss.xml"
		});
		this.podcastList.push({
			title: "Anderson Cooper 360°",
			url: "http://rss.cnn.com/services/podcasting/ac360/rss"
		});
	}
}); 