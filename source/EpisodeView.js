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
	PLAY_BUTTON_INTERVAL: 1000,
	SLIDER_INTERVAL: 500,
	events: {
		onTogglePlay: "",
		onPlaybackEnded: "",
		onOpenInBrowser: ""
	},
	components: [
		{kind: "PalmService", name: "headsetService", service: "palm://com.palm.keys/headset/", method: "status",
			subscribe: true, onSuccess: "headsetStatusChanged"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{name: "episodeName", content: $L("Listen"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "stalledSpinner", align: "right"}
		]},
		{kind: "Sound", audioClass: "media"},
		{name: "error", showing: false, className: "error"},
		{kind: "Scroller", name: "episodeScroller", flex: 1, style: "margin: 5px 12px", components: [
			{kind: "HtmlContent", name: "episodeDescription", onLinkClick: "doOpenInBrowser", flex: 1}
		]},
		{kind: "ProgressSlider", name: "playSlider", style: "margin: 10px;", onmousedown: "seekTap", onChanging: "seeking", onChange: "seek"},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "playButton", caption: $L("Play"), onclick: "togglePlay", disabled: true, flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), this.SLIDER_INTERVAL);
		
		if (window.PalmSystem) this.$.headsetService.call({});
	},
	
	destroy: function() {
		clearInterval(this.sliderInterval);
		
		this.inherited(arguments);
	},
	
	setEpisode: function(episode) {
		// Don't do anything if same episode is set again
		if (episode.url == this.$.sound.getSrc()) this.$.error.hide();
		else if (this.plays) this.showError($L("Playback active, please pause before switching."));
		else {
			this.episode = episode;
			
			// Update UI
			this.$.error.hide();
			this.$.playButton.setCaption($L("Play"));
			this.$.playButton.setDisabled(false);
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
			this.interval = setInterval(enyo.bind(this, this.updatePlaytime), this.PLAY_BUTTON_INTERVAL);
		} else {
			this.$.sound.audio.pause();
			
			clearInterval(this.interval);
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Play"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
			
			this.$.stalledSpinner.hide();
		}
	},
	
	seekTap: function() {
		// We do not want to have the slider jump around
		clearInterval(this.sliderInterval);
		// Stop play button label text updates
		if (this.plays) clearInterval(this.interval);
	},
	
	seeking: function(sender, currentlyAt) {
		if (this.plays) 
			this.$.playButton.setCaption($L("Pause at") + " " + Utilities.formatTime(currentlyAt) + " " +
				$L("of") + " " + Utilities.formatTime(this.$.sound.audio.duration));
		else this.$.playButton.setCaption($L("Resume at") + " " + Utilities.formatTime(currentlyAt) + " " +
				$L("of") + " " + Utilities.formatTime(this.$.sound.audio.duration));
	},
	
	seek: function(sender, seekTo) {
		// Set player to new position
		this.$.sound.audio.currentTime = seekTo;
		
		// Update play button text and restart updater
		this.updatePlaytime();
		if (this.plays)
			this.interval = setInterval(enyo.bind(this, this.updatePlaytime), this.PLAY_BUTTON_INTERVAL);
				
		// Restart slider updater
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), this.SLIDER_INTERVAL);
		
		// If seeking after playback ended
		this.$.playButton.setDisabled(this.isAtEndOfPlayback());
	},
	
	updatePlaytime: function() {
		// Update stalled spinner
		if (this.plays && (this.$.sound.audio.readyState != 4 || this.$.sound.audio.seeking)) this.$.stalledSpinner.show();
		else this.$.stalledSpinner.hide();
		
		// Update play button
		if (this.plays) {
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Pause"));
			else if (this.isAtEndOfPlayback()) this.stopPlayback($L("Playback complete"));
			else this.$.playButton.setCaption($L("Pause at") + " " + this.createTimeString());
		} else {
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Play"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
		}
		
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
		this.$.sound.audio.pause();
		this.doPlaybackEnded();
		
		this.$.playButton.setCaption(buttonText);
		this.$.playButton.setDisabled(true);
		this.$.stalledSpinner.hide();
	},
	
	headsetStatusChanged: function(sender, response) {
		// Only if headset is unplugged ("up") and we are playing 
		if (response && response.key == "headset" && response.state == "up" &&
			this.plays) this.togglePlay();
	},
	
	isAtStartOfPlayback: function() {
		return this.$.sound.audio.currentTime === 0;
	},
	
	isInMiddleOfPlayback: function() {
		return this.$.sound.audio.currentTime > 0 &&
			this.$.sound.audio.currentTime != this.$.sound.audio.duration;
	},
	
	isAtEndOfPlayback: function() {
		return this.$.sound.audio.currentTime == this.$.sound.audio.duration;
	},
	
	createTimeString: function() {
		return Utilities.formatTime(this.$.sound.audio.currentTime) + " " +  $L("of") + " " +
				Utilities.formatTime(this.$.sound.audio.duration);
	},
	
	showError: function(text) {
		this.$.error.setContent(text);
		this.$.error.show();
		this.$.error.setStyle("width: 100%; text-align: center; padding-bottom: 5px; border-bottom: 1px solid gray;");
	}
});
