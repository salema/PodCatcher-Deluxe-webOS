/** Copyright 2011, 2012 Kevin Hausmann
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
			{name: "episodeName", content: $L("Watch"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "stalledSpinner", align: "right"}
		]},
		{kind: "Sound", audioClass: "media"},
		{kind: "Video", showControls: false, className: "fullWidth", style: "max-height: 620px", showing: false},
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
		this.resumeTimes = [];
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), this.SLIDER_INTERVAL);
		this.videoInterval = setInterval(enyo.bind(this, this.updateVideoMode), 500);
		
		if (window.PalmSystem) {
			this.$.headsetService.call({subscribe: true});
			this.$.headsetButtonService.call({subscribe: true});
		}
		
		this.$.preferencesService.call({keys: ["resumeEpisode", "resumeTimes"]}, {method: "getPreferences", onSuccess: "resumeOnStartup"});
	},
	
	destroy: function() {
		clearInterval(this.sliderInterval);
		clearInterval(this.videoInterval);
		
		this.inherited(arguments);
	},
	
	resumeOnStartup: function(sender, response) {
		if (response.resumeTimes != undefined)
			this.resumeTimes = response.resumeTimes;
		
		if (response.resumeEpisode != undefined) {
			var episode = new Episode();
			episode.readFromJSON(response.resumeEpisode);
			
			this.setEpisode(episode, false);
			this.doResume(episode);
			this.doMarkEpisode(episode);
		}
	},
	
	storeResumeInformation: function() {
		this.storeResumeTime();
		this.$.preferencesService.call({"resumeEpisode": this.episode, "resumeTimes": this.resumeTimes}, {method: "setPreferences"});
	},
	
	setEpisode: function(episode, autoplay) {
		// Active, and other episode selected
		if (this.plays && episode.url != this.episode.url) 
			this.showError($L("Playback active, please pause before switching."));
		// Active, and the current episode reselected
		else if (this.plays) this.$.error.hide();
		// Actually set new episode
		else {
			// Save resume information of former episode
			this.storeResumeTime();
				
			this.episode = episode;
			this.resumeOnce = this.canResume(episode);
			
			// Select the correct player
			if (this.isAudioOnly(episode)) this.player = this.$.sound.audio;
			else {
				this.player = this.$.video.hasNode();
				this.player.setAttribute("x-palm-media-audio-class", "media");
			}
			
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
			if (this.resumeOnce) this.player.currentTime = this.getResumeTime(this.episode);
			this.resumeOnce = false;
			
			this.player.play();
			this.playtimeInterval = setInterval(enyo.bind(this, this.updatePlaytime), this.PLAY_BUTTON_INTERVAL);
		} else {
			this.player.pause();
			clearInterval(this.playtimeInterval);
		}
		
		if (window.PalmSystem && !this.isAudioOnly(this.episode))
			enyo.windows.setWindowProperties(window, {blockScreenTimeout: this.plays});
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
		// No resume after manual seek
		//this.resumeOnce = false;
		
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
		
	updatePlaySlider: function() {
		if (this.player) {
			this.$.playSlider.setMaximum(this.player.duration);
			this.$.playSlider.setBarMaximum(this.player.duration);
			
			this.$.playSlider.setPosition(this.player.currentTime);
			
			if (this.player.buffered.length > 0)
				this.$.playSlider.setBarPosition(this.player.buffered.end(this.player.buffered.length - 1));
		}
	},
	
	updateVideoMode: function() {
		if (this.isVideoContentAvailable()) {
			this.$.video.show();
			
			if (this.episode != undefined) this.$.episodeName.setContent($L("Watching") + " \"" + this.episode.title + "\"");
			else this.$.episodeName.setContent($L("Watch"));
		} else {
			this.$.video.hide();
			
			if (this.episode != undefined) this.$.episodeName.setContent($L("Listen to") + " \"" + this.episode.title + "\"");
			else this.$.episodeName.setContent($L("Listen"));
		}
	},
	
	playlistChanged: function(newLength) {
		if (newLength > 0) this.$.nextButton.show();
		else this.$.nextButton.hide();
	},
	
	playbackEnded: function() {
		if (! this.episode.marked) this.toggleMarked();
		// remove from resume to list
		for (var index = 0; index < this.resumeTimes.length; index++)
			if (this.resumeTimes[index].url == this.episode.url) this.resumeTimes.splice(index, 1);
		
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
		
		if (window.PalmSystem && !this.isAudioOnly(this.episode))
			enyo.windows.setWindowProperties(window, {blockScreenTimeout: false});
		this.doPlaybackEnded();
	},
	
	videoResize: function(width) {
		var fullscreenMode = width > 1000 && this.isVideoContentAvailable();
		
		this.$.downloadManager.setAlwaysHide(fullscreenMode);
		enyo.setFullScreen(fullscreenMode);
		
		if (fullscreenMode) {
			this.$.downloadButton.hide();
			this.$.episodeDescription.hide();
		} else {
			this.$.downloadButton.show();
			this.$.episodeDescription.show();
		}
		
		this.$.episodeScroller.scrollTo(0, 0);
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
					if (this.episode && !this.plays && !this.isAtEndOfPlayback()) this.togglePlay();
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
		return !this.isAtStartOfPlayback() && !this.isAtEndOfPlayback(); 
	},
	
	isAtEndOfPlayback: function() {
		return this.player.ended;
	},
	
	isVideoContentAvailable: function() {
		return this.player && this.player.videoWidth > 0;
	},
	
	isAudioOnly: function(episode) {
		var filename = Utilities.createUniqueFilename(episode.url);
		
		var splits = filename.split(".");
		var ending = splits[splits.length - 1];
		
		return ending == "mp3" || ending == "ogg";
	},
	
	storeResumeTime: function() {
		if (this.episode && this.isInMiddleOfPlayback()) {
			// Remove old entry
			for (var index = 0; index < this.resumeTimes.length; index++)
				if (this.resumeTimes[index].url == this.episode.url) this.resumeTimes.splice(index, 1);
			
			// Push new entry
			this.resumeTimes.push({url: this.episode.url, time: this.player.currentTime});
		}
	},
	
	canResume: function(episode) {
		for (var index = 0; index < this.resumeTimes.length; index++)
			if (this.resumeTimes[index].url == episode.url) return true;
		
		return false;
	},
	
	getResumeTime: function(episode) {
		for (var index = 0; index < this.resumeTimes.length; index++)
			if (this.resumeTimes[index].url == episode.url) return this.resumeTimes[index].time;
		
		return 0;
	},
	
	updateUIOnSetEpisode: function(episode) {
		this.$.error.hide();
		
		if (this.canResume(episode))
			this.$.playButton.setCaption($L("Resume at") + " " + Utilities.formatTime(this.getResumeTime(episode)));
		else this.$.playButton.setCaption($L("Play"));
		
		this.$.playButton.setDisabled(false);
		this.$.stalledSpinner.hide();
		
		if (episode.isDownloaded) this.$.downloadButton.setCaption($L("Delete from device"));
		else if (this.$.downloadManager.isDownloading(episode)) this.$.downloadButton.setCaption($L("Cancel"));
		else this.$.downloadButton.setCaption($L("Download"));
				
		if (this.isVideoContentAvailable()) this.$.episodeName.setContent($L("Watching") + " \"" + episode.title + "\"");
		else this.$.episodeName.setContent($L("Listen to") + " \"" + episode.title + "\"");
		
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