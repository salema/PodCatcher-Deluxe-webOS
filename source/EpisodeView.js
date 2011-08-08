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
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "ApplicationEvents", onUnload: "storeResumeInformation"},
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{name: "episodeName", content: $L("Listen"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "stalledSpinner", align: "right"}
		]},
		{kind: "Sound"},
		{kind: "Scroller", name: "episodeScroller", flex: 1, style: "margin: 5px 12px", components: [
			{kind: "HtmlContent", name: "episodeDescription", onLinkClick: "openBrowser", flex: 1}
		]},
		{kind: "ProgressSlider", name: "playSlider", style: "margin: 10px;", onChange: "seek"},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "playButton", caption: $L("Play"), onclick: "togglePlay", disabled: true, flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
		
		this.$.preferencesService.call(
		{
			keys: ["resumeEpisode", "resumeTime"]
		},
		{
			method: "getPreferences",
			onSuccess: "resume",
		});
	},
	
	resume: function(inSender, inResponse) {
		if (inResponse.resumeEpisode == undefined) return;
		else {
			this.setEpisode(inResponse.resumeEpisode);
			
			if (inResponse.resumeTime > 0) {
				this.resumeOnce = inResponse.resumeTime;
				this.$.playButton.setCaption($L("Resume at") + " " + this.formatTime(inResponse.resumeTime));
			}
		}
	},
	
	storeResumeInformation: function() {
		if (this.episode == undefined) return;
		
		this.$.preferencesService.call(
		{
			"resumeEpisode": this.episode,
			"resumeTime": this.$.sound.audio.currentTime
		},
		{
			method: "setPreferences"
		});
	},
	
	setEpisode: function(episode) {
		// Don't do anything if same episode is set again
		if (episode.url == this.$.sound.getSrc()) return;
		if (this.plays) this.togglePlay();
		
		this.episode = episode;
		this.resumeOnce = -1;
		
		// Update UI
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
	},

	togglePlay: function() {
		if (!this.plays) {
			if (this.resumeOnce > 0) {
				this.$.sound.audio.currentTime = this.resumeOnce;
				this.resumeOnce = -1;
			}
			this.$.sound.play();
			this.updatePlaytime();
			this.interval = setInterval(enyo.bind(this, this.updatePlaytime), 1000);
		} else {
			this.$.sound.audio.pause();
			if (this.$.sound.audio.currentTime == 0) this.$.playButton.setCaption($L("Resume"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
			// TODO what happens to the spinner?
			clearInterval(this.interval);
		}
		
		this.plays = !this.plays;
	},
	
	seek: function(inSender, inEvent) {
		this.$.sound.audio.currentTime = inEvent;
		this.updatePlaytime();
	},
	
	updatePlaytime: function() {
		// Update stalled spinner
		if (this.$.sound.audio.readyState != 4) this.$.stalledSpinner.show();
		else this.$.stalledSpinner.hide();
		
		// Update play button
		if (this.$.sound.audio.currentTime == 0) this.$.playButton.setCaption($L("Pause"));
		else if (this.$.sound.audio.currentTime == this.$.sound.audio.duration) this.playbackEnded();
		else this.$.playButton.setCaption($L("Pause at") + " " + this.createTimeString());
		
		// Update play slider
		this.$.playSlider.setMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setBarMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setPosition(this.$.sound.audio.currentTime);
		this.$.playSlider.setBarPosition(this.$.sound.audio.currentTime);
	},
	
	playbackEnded: function() {
		this.$.playButton.setCaption($L("Playback complete"));
		this.$.playButton.setDisabled(true);
		this.$.stalledSpinner.hide();
		
		clearInterval(this.interval);
		this.plays = false;
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
	
	openBrowser: function(inSender, inUrl) {
		this.$.launchBrowserCall.call({"id": "com.palm.app.browser", "params": {"target": inUrl}});
	}
});