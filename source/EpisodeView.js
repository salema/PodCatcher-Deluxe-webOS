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
		onNext: "",
		onResume: "",
		onMarkEpisode: "",
		onDownloaded: "",
		onDeleteDownload: "",
		onOpenInBrowser: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "ApplicationEvents", onUnload: "storeResumeInformation"},
		{kind: "PalmService", name: "headsetService", service: "palm://com.palm.keys/headset/", method: "status", onSuccess: "headsetStatusChanged"},
		{kind: "PalmService", name: "headsetButtonService", service: "palm://com.palm.keys/media/", method: "status", onSuccess: "headsetButtonPressed"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{kind: "Image", name: "markButton", src: Episode.UNMARKED_ICON, onclick: "toggleMarked", style: "margin-right: 10px;"},
			{name: "episodeName", content: $L("Listen"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "stalledSpinner", align: "right"}
		]},
		{kind: "HtmlContent", name: "videoInfo", className: "info", onLinkClick: "doOpenInBrowser", showing: false, content: $L("This episode has video content. You might want to give <a href=\"http://developer.palm.com/appredirect/?packageid=net.alliknow.videocatcher\">Video PodCatcher Deluxe</a> a try.")},
		{kind: "Video", showControls: false, showing: false},
		{kind: "Button", name: "downloadButton", caption: $L("Download"), onclick: "startStopDelete"},
		{kind: "Net.Alliknow.PodCatcher.DownloadManager", name: "downloadManager", style: "display: block;", onStatusUpdate: "downloadStatusUpdate", 
			onDownloadComplete: "downloadComplete", onCancelSuccess: "cancelSuccess", onDownloadFailed: "downloadFailed"},
		{name: "error", showing: false, className: "error"},
		{kind: "Scroller", name: "episodeScroller", flex: 1, style: "margin: 5px 12px", components: [
			{kind: "HtmlContent", name: "episodeDescription", onLinkClick: "doOpenInBrowser", flex: 1}
		]},
		{kind: "ProgressSlider", name: "playSlider", style: "margin: 10px;", onmousedown: "seekTap", onChanging: "seeking", onChange: "seek"},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "playButton", caption: $L("Play"), onclick: "togglePlay", disabled: true, flex: 1},
			{kind: "ToolButton", name: "nextButton", caption: $L("Next"), onclick: "doNext", showing: false}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
		this.player = this.$.video.node;

		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), this.SLIDER_INTERVAL);
		this.videoInterval = setInterval(enyo.bind(this, this.updateVideoMode), 1000);
		
		if (window.PalmSystem) {
			this.$.headsetService.call({subscribe: true});
			this.$.headsetButtonService.call({subscribe: true});
		}
		
		this.$.preferencesService.call({keys: ["resumeEpisode", "resumeTime"]},	{method: "getPreferences", onSuccess: "resume"});
	},
	
	destroy: function() {
		clearInterval(this.sliderInterval);
		clearInterval(this.videoInterval);
		
		this.inherited(arguments);
	},
	
	resume: function(sender, response) {
		if (response.resumeEpisode != undefined) {
			var episode = new Episode();
			episode.readFromJSON(response.resumeEpisode);
			
			this.setEpisode(episode, false);
			this.doResume(episode);
			this.doMarkEpisode(episode);
			
			if (response.resumeTime > 0) {
				this.resumeOnce = response.resumeTime;
				this.$.playButton.setCaption($L("Resume at") + " " + Utilities.formatTime(response.resumeTime));
			}
		}
	},
	
	storeResumeInformation: function() {
		this.$.preferencesService.call({"resumeEpisode": this.episode, "resumeTime": this.player.currentTime}, {method: "setPreferences"});
	},
	
	setEpisode: function(episode, autoplay) {
		this.player = this.$.video.hasNode();
		this.player.setAttribute("x-palm-media-audio-class", "media");
		
		// Active, and other episode selected
		if (this.plays && episode.url != this.episode.url) 
			this.showError($L("Playback active, please pause before switching."));
		// Active, and the current episode reselected
		else if (this.plays) this.$.error.hide();
		// Actually set new episode
		else {
			this.episode = episode;
			this.resumeOnce = -1;
			
			this.updateUIOnSetEpisode(episode);
			
			// Set sound source
			if (episode.isDownloaded) this.player.src = episode.file;
			else this.player.src = episode.url;
			
			this.log(this.player.src);
			
			if (autoplay) this.togglePlay();
		}
	},
	
	startStopDelete: function(sender, response) {
		// Cancel download
		if (this.$.downloadManager.isDownloading(this.episode)) this.$.downloadManager.cancel(this.episode);
		else {
			// Cannot delete file since it is playing
			if (this.episode.isDownloaded && this.plays) {
				this.showError($L("Please stop playback before deleting."));
			} // Delete downloaded file
			else if (this.episode.isDownloaded) {
				this.$.error.hide();
				this.$.downloadButton.setCaption($L("Download"));
				
				this.player.src = this.episode.url;
				
				this.$.downloadManager.deleteDownload(this.episode);
				this.episode.setDownloaded(false);
				this.doDeleteDownload(this.episode);
			} // Download episode 
			else this.downloadEpisode(this.episode);
		} 
	},
	
	downloadEpisode: function(episode) {
		if (this.episode.equals(episode)) this.$.downloadButton.setCaption($L("Cancel"));
		
		this.$.downloadManager.download(episode);
	},
	
	downloadStatusUpdate: function(sender, episode, progress) {
		if (this.episode.equals(episode)) this.$.downloadButton.setCaption($L("Cancel at") + " " + progress);
	},
	
	downloadComplete: function(sender, episode) {
		if (this.episode.equals(episode)) {
			this.$.error.hide();
			this.$.downloadButton.setCaption($L("Delete from device"));
			
			if (! this.plays) this.player.src = episode.file;
		}
			
		this.doDownloaded(episode);
	},
	
	cancelSuccess: function(sender, episode) {
		if (this.episode.equals(episode)) {
			this.$.error.hide();
			this.$.downloadButton.setCaption($L("Download"));
		}
	},
   
	downloadFailed: function(sender, episode) {
		if (this.episode.equals(episode)) {
			this.$.error.hide();
			this.$.downloadButton.setCaption($L("Download failed"));
		}
	},
	
	reloadMarkedStatus: function() {
		if (this.episode.marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
	},
	
	toggleMarked: function() {
		this.episode.marked = !this.episode.marked;
		this.reloadMarkedStatus();
		
		this.doMarkEpisode(this.episode);
	},

	togglePlay: function() {
		this.plays = !this.plays;
		this.doTogglePlay();
		
		if (this.plays) {
			// This happens only once after startup to allow resume of last episode
			if (this.resumeOnce > 0) this.player.currentTime = this.resumeOnce;
			this.resumeOnce = -1;
			
			this.player.play();
			this.playtimeInterval = setInterval(enyo.bind(this, this.updatePlaytime), this.PLAY_BUTTON_INTERVAL);
		} else {
			this.player.pause();
			clearInterval(this.playtimeInterval);
		}
		
		this.updatePlaytime();
	},
	
	seekTap: function() {
		// We do not want to have the slider jump around
		clearInterval(this.sliderInterval);
		// Stop play button label text updates
		if (this.plays) clearInterval(this.playtimeInterval);
	},
	
	seeking: function(sender, currentlyAt) {
		var timeString = Utilities.createTimeString(currentlyAt, this.player.duration);
		
		if (this.plays) this.$.playButton.setCaption($L("Pause at") + " " + timeString);
		else this.$.playButton.setCaption($L("Resume at") + " " + timeString); 
	},
	
	seek: function(sender, seekTo) {
		// Set player to new position
		this.player.currentTime = seekTo;
		
		// Update play button text and restart updater
		this.updatePlaytime();
		if (this.plays)
			this.playtimeInterval = setInterval(enyo.bind(this, this.updatePlaytime), this.PLAY_BUTTON_INTERVAL);
				
		// Restart slider updater
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), this.SLIDER_INTERVAL);
		
		// If seeking after playback ended
		this.$.playButton.setDisabled(this.isAtEndOfPlayback());
	},
	
	updatePlaytime: function() {
		// Update stalled spinner
		if (this.plays && (this.player.readyState != 4 || this.player.seeking)) this.$.stalledSpinner.show();
		else this.$.stalledSpinner.hide();
		
		var timeString = Utilities.createTimeString(this.player.currentTime, this.player.duration);
		
		// Update play button
		if (this.plays) {
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Pause"));
			else if (this.isAtEndOfPlayback()) this.playbackEnded();
			else this.$.playButton.setCaption($L("Pause at") + " " + timeString);
		} else {
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Play"));
			else this.$.playButton.setCaption($L("Resume at") + " " + timeString);
		}
		
		if (this.player.error > 0) this.playbackFailed();
	},
		
	updatePlaySlider: function () {
		if (this.player) {
			this.$.playSlider.setMaximum(this.player.duration);
			this.$.playSlider.setBarMaximum(this.player.duration);
			
			this.$.playSlider.setPosition(this.player.currentTime);
			
			if (this.player.buffered.length > 0)
				this.$.playSlider.setBarPosition(this.player.buffered.end(this.player.buffered.length - 1));
		}
	},
	
	updateVideoMode: function() {
		if (this.isVideoContentAvailable()) this.$.videoInfo.show();
		else this.$.videoInfo.hide();
	},
	
	playlistChanged: function(newLength) {
		if (newLength > 0) this.$.nextButton.show();
		else this.$.nextButton.hide();
	},
	
	playbackEnded: function() {
		if (! this.episode.marked) this.toggleMarked();
		
		this.stopPlayback($L("Playback complete"));
	},
	
	playbackFailed: function() {
		this.stopPlayback($L("Playback failed"));
	},
	
	stopPlayback: function(buttonText) {
		clearInterval(this.playtimeInterval);
		this.plays = false;
		this.player.pause();
				
		this.$.playButton.setCaption(buttonText);
		this.$.playButton.setDisabled(true);
		this.$.stalledSpinner.hide();
		
		this.doPlaybackEnded();
	},
	
	headsetStatusChanged: function(sender, response) {
		// Only if headset is unplugged ("up") and we are playing 
		if (response && response.key == "headset" && response.state == "up" &&
			this.plays) this.togglePlay();
	},
	
	headsetButtonPressed: function(sender, event) {
		if (event.state == "down") {
			switch (event.key) {
				case "play":
					if (this.episode && !this.plays) this.togglePlay();
					break;
				case "pause":
				case "stop":
					if (this.plays) this.togglePlay();
					break;
				case "next":
					this.doNext();
					break;
				case "prev":
					break;
			}
		}
	},
		
	isAtStartOfPlayback: function() {
		return this.player.currentTime === 0;
	},
	
	isInMiddleOfPlayback: function() {
		return this.player.currentTime > 0 &&
			this.player.currentTime !== this.player.duration;
	},
	
	isAtEndOfPlayback: function() {
		return this.player.currentTime === this.player.duration;
	},
	
	isVideoContentAvailable: function() {
		return this.player && this.player.videoWidth > 0;
	},
	
	updateUIOnSetEpisode: function(episode) {
		this.$.videoInfo.hide();
		this.$.error.hide();
		this.$.playButton.setCaption($L("Play"));
		this.$.playButton.setDisabled(false);
		this.$.stalledSpinner.hide();

		if (episode.isDownloaded) this.$.downloadButton.setCaption($L("Delete from device"));
		else if (this.$.downloadManager.isDownloading(episode)) this.$.downloadButton.setCaption($L("Cancel"));
		else this.$.downloadButton.setCaption($L("Download"));

		this.$.episodeName.setContent($L("Listen to") + " \"" + episode.title + "\"");

		this.$.episodeDescription.setContent(episode.description);
		this.$.episodeScroller.scrollTo(0, 0);
		this.$.playSlider.setPosition(0);
		this.$.playSlider.setBarPosition(0);
		if (episode.marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
	},
		
	showError: function(text) {
		this.$.error.setContent(text);
		this.$.error.show();
		this.$.error.setStyle("width: 100%; text-align: center; padding-bottom: 5px; border-bottom: 1px solid gray;");
	}
});
