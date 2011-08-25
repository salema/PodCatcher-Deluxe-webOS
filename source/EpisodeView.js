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
		onResume: "",
		onMarkEpisode: "",
		onDownloaded: "",
		onDelete: "",
		onOpenInBrowser: ""
	},
	components: [
		{kind: "SystemService", name: "preferencesService", subscribe : false},
		{kind: "PalmService", name: "episodeDownload", service: "palm://com.palm.downloadmanager/", method: "download", 
				onSuccess: "downloadSuccess", onFailure: "downloadFail", subscribe: true},
		{kind: "PalmService", name: "episodeDelete", service: "palm://com.palm.downloadmanager/", method: "deleteDownloadedFile", onFailure: "genericFail"},
		{kind: "PalmService", name: "cancel", service: "palm://com.palm.downloadmanager/", method: "cancelDownload", onSuccess: "cancelSuccess", onFailure: "genericFail"},
		{kind: "ApplicationEvents", onUnload: "storeResumeInformation"},
		{kind: "PalmService", name: "launchBrowserCall", service: "palm://com.palm.applicationManager/", method: "launch"},
		{kind: "Header", layoutKind: "HFlexLayout", className: "header", components: [
			{kind: "Image", name: "markButton", src: Episode.UNMARKED_ICON, onclick: "toggleMarked", style: "margin-right: 10px;"},
			{name: "episodeName", content: $L("Listen"), className: "nowrap", flex: 1},
			{kind: "Spinner", name: "stalledSpinner", align: "right"}
		]},
		{kind: "Sound"},
		{kind: "Button", name: "downloadButton", caption: $L("Download"), onclick: "startStopDelete"},
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
		this.downloads = false;
		this.player = this.$.sound.audio;
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), 250);
		
		this.$.preferencesService.call({keys: ["resumeEpisode", "resumeTime"]},	{method: "getPreferences", onSuccess: "resume"});
	},
	
	destroy: function() {
		clearInterval(this.sliderInterval);
		
		this.inherited(arguments);
	},
	
	resume: function(sender, response) {
		if (response.resumeEpisode != undefined) {
			var episode = new Episode();
			episode.readFromJSON(response.resumeEpisode);
			
			this.setEpisode(episode);
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
		// Don't do anything if downloading
		if (this.downloads) this.showError($L("Download active, please wait or cancel."));
		else if (this.plays && episode.url != this.episode.url) 
			this.showError($L("Playback active, please pause before switching."));
		else if (this.plays && episode.url == this.episode.url) 
			this.$.error.setStyle("display: none;");
		else if (this.episode == undefined || episode.url != this.episode.url) {
			if (this.plays) this.togglePlay();
			
			this.episode = episode;
			this.resumeOnce = -1;
			
			this.updateUIOnSetEpisode(episode);
			
			// Set sound source
			if (episode.isDownloaded) this.player.src = episode.file;
			else this.player.src = episode.url;
			
			//this.log(this.player.src);
			
			if (autoplay) this.togglePlay();
		}
	},
	
	startStopDelete: function(sender, response) {
		// Download episode 
		if (!this.downloads && !this.episode.isDownloaded) {
			this.downloads = true;
			this.$.downloadButton.setCaption($L("Cancel"));		
			this.$.episodeDownload.call({target: this.episode.url});
		} // Cannot delete file since it is playing
		else if (!this.downloads && this.episode.isDownloaded && this.plays && this.player.src == this.episode.file) {
			this.showError($L("Please stop playback before deleting."));
		} // Delete downloaded file
		else if (!this.downloads && this.episode.isDownloaded) {
			this.playersrc = this.episode.url;
			this.$.error.setStyle("display: none;");
			this.$.downloadButton.setCaption($L("Download"));
						
			this.$.episodeDelete.call({ticket: this.episode.ticket});
			this.episode.setDownloaded(false);
			this.doDelete(this.episode);
		} // Cancel download
		else {
			this.$.cancel.call({ticket: this.currentDownloadTicket});
			this.$.episodeDelete.call({ticket: this.currentDownloadTicket});
		}
	},
	
	downloadSuccess: function(sender, response) {
		this.currentDownloadTicket = response.ticket;
		this.$.downloadButton.setCaption($L("Cancel at") + " " + Utilities.formatDownloadStatus(response));
		
		if (response.completed) {
			this.downloads = false;
			this.$.error.setStyle("display: none;");
			this.$.downloadButton.setCaption($L("Delete from device"));
			
			this.episode.setDownloaded(true, response.ticket, response.target);
			this.doDownloaded(this.episode);
			
			if (!this.plays) this.player.src = response.target;
		}
	},
	
	cancelSuccess: function(sender, response) {
		this.downloads = false;
		this.$.error.setStyle("display: none;");
		this.$.downloadButton.setCaption($L("Download"));
	},
   
	downloadFail: function(sender, response) {
		this.downloads = false;
		this.$.downloadButton.setCaption($L("Download failed"));
		this.$.error.setStyle("display: none;");
		this.genericFail(sender, response);
	},
	
	genericFail: function(sender, response) {
		this.log("Service failure, results=" + enyo.json.stringify(response));
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
	
	seek: function(sender, event) {
		if (this.player.readyState === 0 || this.$.playButton.getDisabled()) return;
		
		this.player.currentTime = event;
		this.updatePlaytime();
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
			if (this.isAtStartOfPlayback()) this.$.playButton.setCaption($L("Resume"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
		}
		
		if (this.player.error > 0) this.playbackFailed();
	},
		
	updatePlaySlider: function () {
		this.$.playSlider.setMaximum(this.player.duration);
		this.$.playSlider.setBarMaximum(this.player.duration);
		this.$.playSlider.setPosition(this.player.currentTime);
		if (this.player.buffered.length > 0)
			this.$.playSlider.setBarPosition(this.player.buffered.end(this.player.buffered.length - 1));
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
	
	updateUIOnSetEpisode: function(episode) {
		this.$.error.setStyle("display: none;");
		this.$.playButton.setCaption($L("Play"));
		this.$.playButton.setDisabled(false);
		if (episode.isDownloaded) this.$.downloadButton.setCaption($L("Delete from device"));
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
		this.$.error.setStyle("display: block; width: 100%; text-align: center; padding-bottom: 5px; border-bottom: 1px solid gray;");
	}
});