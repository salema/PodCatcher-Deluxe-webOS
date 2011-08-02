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
 *  Show a single episode (podcast feed item) and allow playing
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.EpisodeView",
	kind: "SlidingView",
	components: [
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
   		{kind: "Header", layoutKind: "HFlexLayout", style: "min-height: 60px;", components: [
			{name: "episodeName", content: $L("Listen"), style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1}
		]},
		{kind: "Sound"},
		{kind: "Scroller", name: "episodeScroller", flex: 1, style: "margin: 5px 12px", components: [
			{kind: "HtmlContent", name: "episodeDescription", onLinkClick: "openBrowser", flex: 1}
		]},
		{kind: "Toolbar", components: [
		   	{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "playButton", caption: $L("Play"), onclick: "togglePlay", disabled: true, flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
	},
	
	setEpisode: function(episode) {
		if (this.plays) this.togglePlay();
		
//		this.$.sound.audio.ownerLink = this;
//		this.$.sound.audio.addEventListener("playing", function(inEvent) { 
//			this.ownerLink.log(inEvent);
//		}, true);
		
		this.$.playButton.setCaption($L("Play"));
		this.$.playButton.setDisabled(false);
		this.$.episodeName.setContent($L("Listen to") + " \"" + episode.title + "\"");
		this.$.episodeDescription.setContent(episode.description);
		this.$.episodeScroller.scrollTo(0, 0);
		this.$.sound.setSrc(episode.url);
	},

	togglePlay: function() {
		if (!this.plays) {
			this.$.sound.play();
			this.$.playButton.setCaption(this.resources.$L("Pause"));
			
			this.plays = true;
		} else {
			this.$.sound.audio.pause();
			this.$.playButton.setCaption($L("Resume"));
			
			this.plays = false;
		}
	},
	
	log: function(text) {
		//enyo.log(this.$.sound.audio.duration);
		//enyo.log(this.$.sound.audio.currentTime);
		var time = this.$.sound.audio.currentTime / 60 + ":" + this.$.sound.audio.duration / 60;
		this.$.time.setContent(time);
	},
	
	openBrowser: function(inSender, inUrl) {
		this.$.launchBrowserCall.call({"id": "com.palm.app.browser", "params":{"target": inUrl}});
	}
});