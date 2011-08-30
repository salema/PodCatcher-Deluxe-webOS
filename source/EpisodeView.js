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
	events: {
		onTogglePlay: "",
		onPlaybackEnded: "",
		onOpenInBrowser: ""
	},
	components: [
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{name: "episodeName", content: $L("Listen"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "stalledSpinner", align: "right"}
		]},
		{kind: "Sound"},
		{name: "error", style: "display: none", className: "error"},
		{kind: "Scroller", name: "episodeScroller", flex: 1, style: "margin: 5px 12px", components: [
			{kind: "HtmlContent", name: "episodeDescription", onLinkClick: "doOpenInBrowser", flex: 1}
		]},
		{kind: "ProgressSlider", name: "playSlider", style: "margin: 10px;", onChange: "seek", maximum: 0},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "playButton", caption: $L("Play"), onclick: "togglePlay", disabled: true, flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), 250);
	},
	
	destroy: function() {
		clearInterval(this.sliderInterval);
		
		this.inherited(arguments);
	},
	
	setEpisode: function(episode) {
		// Don't do anything if same episode is set again
		if (episode.url == this.$.sound.getSrc()) this.$.error.setStyle("display: none;");
		else if (this.plays) this.showError($L("Playback active, please pause before switching."));
		else {
			this.episode = episode;
			
			// Update UI
			this.$.error.setStyle("display: none;");
			this.$.playButton.setCaption($L("Play"));
			this.$.playButton.setDisabled(false);
			this.$.stalledSpinner.hide();
			this.$.episodeName.setContent($L("Listen to") + " \"" + episode.title + "\"");
			this.$.episodeDescription.setContent(episode.description);
			this.$.episodeScroller.scrollTo(0, 0);
			this.$.playSlider.setPosition(0);
			this.$.playSlider.setBarPosition(0);
			// Set sound source
			this.$.sound.setSrc(episode.url);
		}
	},

	togglePlay: function() {
		this.plays = !this.plays;
		this.doTogglePlay();
		
		if (this.plays) {
			this.$.sound.play();
			this.updatePlaytime();
			this.interval = setInterval(enyo.bind(this, this.updatePlaytime), 1000);
		} else {
			this.$.sound.audio.pause();
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Play"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
			this.$.stalledSpinner.hide();
			clearInterval(this.interval);
		}
	},
	
	seek: function(sender, seekTo) {
		if (this.$.sound.audio.readyState === 0 || this.$.playButton.getDisabled()) return;
		
		this.$.sound.audio.currentTime = seekTo;
		this.updatePlaytime();
	},
	
	updatePlaytime: function() {
		// Update stalled spinner
		if (this.plays && (this.$.sound.audio.readyState != 4 || this.$.sound.audio.seeking)) this.$.stalledSpinner.show();
		else this.$.stalledSpinner.hide();
		
		// Update play button
		if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Pause"));
		else if (this.isAtEndOfPlayback()) this.stopPlayback($L("Playback complete"));
		else this.$.playButton.setCaption($L("Pause at") + " " + this.createTimeString());
		
		if (this.$.sound.audio.error > 0) this.stopPlayback($L("Playback failed"));
	},
	
	updatePlaySlider: function () {
		this.$.playSlider.setMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setBarMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setPosition(this.$.sound.audio.currentTime);
		if (this.$.sound.audio.buffered.length > 0)
			this.$.playSlider.setBarPosition(this.$.sound.audio.buffered.end(this.$.sound.audio.buffered.length - 1));
	},
	
	stopPlayback: function(buttonText) {
		clearInterval(this.interval);
		this.plays = false;
		this.doPlaybackEnded();
		
		this.$.playButton.setCaption(buttonText);
		this.$.playButton.setDisabled(true);
		this.$.stalledSpinner.hide();
	},
	
	isAtStartOfPlayback: function() {
		return this.$.sound.audio.currentTime == 0;
	},
	
	isInMiddleOfPlayback: function() {
		return this.$.sound.audio.currentTime > 0 &&
			this.$.sound.audio.currentTime != this.$.sound.audio.duration;
	},
	
	isAtEndOfPlayback: function() {
		return this.$.sound.audio.currentTime == this.$.sound.audio.duration;
	},
	
	createTimeString: function() {
		return this.formatTime(this.$.sound.audio.currentTime) + " " +  $L("of") + " " +
			this.formatTime(this.$.sound.audio.duration);
	},
	
	// Convert a time given in seconds with many digits to MM:SS
	formatTime: function(time) {
		var minutes = Math.floor(Math.floor(time) / 60);
		var seconds = Math.floor(time) % 60;
		
		if (isNaN(minutes) || !isFinite(minutes)) minutes = "--";
		if (isNaN(seconds) || !isFinite(seconds)) seconds = "--"; 
		else if (seconds < 10) seconds = "0" + seconds;
		
		return  minutes + ":" + seconds; 
	},
	
	showError: function(text) {
		this.$.error.setContent(text);
		this.$.error.setStyle("display: block; width: 100%; text-align: center; padding-bottom: 5px; border-bottom: 1px solid gray;");
	}
});