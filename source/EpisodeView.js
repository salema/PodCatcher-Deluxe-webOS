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
		onNext: "",
		onResume: "",
		onMarkEpisode: "",
		onDownloaded: "",
		onDelete: "",
		onOpenInBrowser: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "ApplicationEvents", onUnload: "storeResumeInformation"},
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
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
		{kind: "ProgressSlider", name: "playSlider", style: "margin: 10px;", onChanging: "seeking", onChange: "seek", maximum: 0},
		{kind: "Toolbar", className: "toolbar", components: [
			{kind: "GrabButton", style: "position: static"},
			{kind: "ToolButton", name: "playButton", caption: $L("Play"), onclick: "togglePlay", disabled: true, flex: 1},
			{kind: "ToolButton", name: "nextButton", caption: $L("Next"), onclick: "doNext", showing: false}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), 250);
		this.videoInterval = setInterval(enyo.bind(this, this.updateVideoMode), 1000);
		
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
		this.player = this.$.video.node;
		
		if (this.plays && episode.url != this.episode.url) 
			this.showError($L("Playback active, please pause before switching."));
		else if (this.plays) 
			this.$.error.hide();
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
		// Download episode 
		if (!this.$.downloadManager.isDownloading(this.episode)) {
			if (!this.episode.isDownloaded) {
				this.$.downloadButton.setCaption($L("Cancel"));
				this.$.downloadManager.download(this.episode);
			} // Cannot delete file since it is playing
			else if (this.episode.isDownloaded && this.plays) {
				this.showError($L("Please stop playback before deleting."));
			} // Delete downloaded file
			else if (this.episode.isDownloaded) {
				this.player.src = this.episode.url;
				this.$.error.hide();
				this.$.downloadButton.setCaption($L("Download"));
						
				this.$.downloadManager.deleteDownload(this.episode);
				this.episode.setDownloaded(false);
				this.doDelete(this.episode);
			}
		} // Cancel download
		else this.$.downloadManager.cancel(this.episode);
	},
	
	downloadStatusUpdate: function(sender, episode, progress) {
		if (this.episode.equals(episode)) this.$.downloadButton.setCaption($L("Cancel at") + " " + progress);
	},
	
	downloadComplete: function(sender, episode) {
		if (this.episode.equals(episode)) {
			this.$.error.hide();
			this.$.downloadButton.setCaption($L("Delete from device"));
			
			if (!this.plays) this.player.src = episode.file;
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
	
	toggleMarked: function() {
		this.episode.marked = !this.episode.marked;
		
		if (this.episode.marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
		
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
			this.updatePlaytime();
			this.playtimeInterval = setInterval(enyo.bind(this, this.updatePlaytime), 1000);
		} else {
			this.player.pause();
			this.updatePlaytime();
			clearInterval(this.playtimeInterval);
		}		
	},
	
	seeking: function(sender, currentlyAt) {
		if (this.player.readyState === 0 || this.$.playButton.getDisabled()) return;
		
		if (this.plays) clearInterval(this.playtimeInterval);
		
		if (this.plays) 
			this.$.playButton.setCaption($L("Pause at") + " " + Utilities.formatTime(currentlyAt) + " " +
				$L("of") + " " + Utilities.formatTime(this.player.duration));
		else this.$.playButton.setCaption($L("Resume at") + " " + Utilities.formatTime(currentlyAt) + " " +
				$L("of") + " " + Utilities.formatTime(this.player.duration));
	},
	
	seek: function(sender, seekTo) {
		if (this.player.readyState === 0 || this.$.playButton.getDisabled()) return;
		
		this.player.currentTime = seekTo;
		
		this.updatePlaytime();
		if (this.plays) {
			// just in case this has not been cleared by seeking before (we do not want multiple intervals!)
			clearInterval(this.playtimeInterval);
			this.playtimeInterval = setInterval(enyo.bind(this, this.updatePlaytime), 1000);
		}
	},
	
	updatePlaytime: function() {
		// Update stalled spinner
		if (this.plays && (this.player.readyState != 4 || this.player.seeking)) this.$.stalledSpinner.show();
		else this.$.stalledSpinner.hide();
		
		// Update play button
		if (this.plays) {
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Pause"));
			else if (this.isAtEndOfPlayback()) this.playbackEnded();
			else this.$.playButton.setCaption($L("Pause at") + " " + this.createTimeString());
		} else {
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Play"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
		}
		
		if (this.player.error > 0) this.playbackFailed();
	},
		
	updatePlaySlider: function () {
		this.$.playSlider.setMaximum(this.player.duration);
		this.$.playSlider.setBarMaximum(this.player.duration);
		
		// Change position only if not seeking, i.e. delta is small
		// Also, there are special conditions for the start of the episode and seeking
		// non-playing state
		var delta = this.player.currentTime - this.$.playSlider.getPosition();
		if ((this.player.currentTime > 0 && this.player.currentTime <= 1) || 
			(delta > 0 && delta <= 1)) this.$.playSlider.setPosition(this.player.currentTime);
		
		if (this.player.buffered.length > 0)
			this.$.playSlider.setBarPosition(this.player.buffered.end(this.player.buffered.length - 1));
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
		this.showError($L("Playback failed"));
	},
	
	stopPlayback: function(buttonText) {
		clearInterval(this.playtimeInterval);
		this.plays = false;
				
		this.$.playButton.setCaption(buttonText);
		this.$.playButton.setDisabled(true);
		this.$.stalledSpinner.hide();
		
		this.doPlaybackEnded(this.episode);
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
		if (episode.isDownloaded) this.$.downloadButton.setCaption($L("Delete from device"));
		else if (this.$.downloadManager.isDownloading(episode)) this.$.downloadButton.setCaption($L("Cancel"));
		else this.$.downloadButton.setCaption($L("Download"));
		this.$.stalledSpinner.hide();
		this.$.episodeName.setContent($L("Listen to") + " \"" + episode.title + "\"");
		this.$.episodeDescription.setContent(episode.description);
		this.$.episodeScroller.scrollTo(0, 0);
		this.$.playSlider.setPosition(0);
		this.$.playSlider.setBarPosition(0);
		if (episode.marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
	},
		
	createTimeString: function() {
		return Utilities.formatTime(this.player.currentTime) + " " +  $L("of") + " " +
			Utilities.formatTime(this.player.duration);
	},
	
	showError: function(text) {
		this.$.error.setContent(text);
		this.$.error.show();
		this.$.error.setStyle("width: 100%; text-align: center; padding-bottom: 5px; border-bottom: 1px solid gray;");
	}
});
