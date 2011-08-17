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
		{kind: "CustomButton", name: "error", style: "display: none", className: "error"},
		{kind: "Button", name: "downloadButton", caption: $L("Download"), onclick: "startStopDelete"},
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
		this.sliderInterval = setInterval(enyo.bind(this, this.updatePlaySlider), 1000);
		
		this.$.preferencesService.call(
		{
			keys: ["resumeEpisode", "resumeTime"]
		},
		{
			method: "getPreferences",
			onSuccess: "resume",
		});
	},
	
	destroy: function() {
		clearInterval(this.sliderInterval);
		
		this.inherited(arguments);
	},
	
	resume: function(inSender, inResponse) {
		if (inResponse.resumeEpisode != undefined) {
			var episode = new Episode();
			episode.readFromJSON(inResponse.resumeEpisode);
			
			this.setEpisode(episode);
			this.doResume(episode);
			this.doMarkEpisode(episode);
			
			if (inResponse.resumeTime > 0) {
				this.resumeOnce = inResponse.resumeTime;
				this.$.playButton.setCaption($L("Resume at") + " " + Utilities.formatTime(inResponse.resumeTime));
			}
		}
	},
	
	storeResumeInformation: function() {
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
		// Don't do anything if downloading
		if (this.downloads) this.showError($L("Download active, please wait or cancel."));
		else if (this.episode == undefined || episode.url != this.episode.url) {
			if (this.plays) this.togglePlay();
			
			this.episode = episode;
			this.resumeOnce = -1;
			
			this.updateUIOnSetEpisode();
			
			// Set sound source
			if (episode.isDownloaded) this.$.sound.setSrc(episode.file);
			else this.$.sound.setSrc(episode.url);
		}
	},
	
	startStopDelete: function(inSender, inResponse) {
		// Download episode 
		if (!this.downloads && !this.episode.isDownloaded) {
			this.downloads = true;
			this.$.downloadButton.setCaption($L("Cancel"));		
			this.$.episodeDownload.call({target: this.episode.url});
		} // Cannot delete file since it is playing
		else if (!this.downloads && this.episode.isDownloaded && this.plays && this.$.sound.getSrc() == this.episode.file) {
			this.showError($L("Please stop playback before deleting."));
		} // Delete downloaded file
		else if (!this.downloads && this.episode.isDownloaded) {
			this.$.sound.setSrc(this.episode.url);
			this.$.error.setStyle("display: none;");
			this.$.downloadButton.setCaption($L("Download"));
						
			this.$.episodeDelete.call({ticket: this.episode.ticket});
			this.doDelete(this.episode);
			this.episode.setDownloaded(false);
		} // Cancel download
		else {
			this.$.cancel.call({ticket: this.currentDownloadTicket});
			this.$.episodeDelete.call({ticket: this.currentDownloadTicket});
		}
	},
	
	downloadSuccess: function(inSender, inResponse) {
		this.currentDownloadTicket = inResponse.ticket;
		this.$.downloadButton.setCaption($L("Cancel at") + " " + Utilities.formatDownloadStatus(inResponse));
		
		if (inResponse.completed) {
			this.downloads = false;
			this.$.error.setStyle("display: none;");
			this.$.downloadButton.setCaption($L("Delete from device"));
			
			this.doDownloaded(this.episode, inResponse);
			this.episode.setDownloaded(true, inResponse.ticket, inResponse.target);
			
			if (!this.plays) this.$.sound.setSrc(inResponse.target);
		}
	},
	
	cancelSuccess: function(inSender, inResponse) {
		this.downloads = false;
		this.$.error.setStyle("display: none;");
		this.$.downloadButton.setCaption($L("Download"));
	},
   
	downloadFail: function(inSender, inResponse) {
		this.downloads = false;
		this.$.downloadButton.setCaption($L("Download failed"));
		this.$.error.setStyle("display: none;");
		this.genericFail(inSender, inResponse);
	},
	
	genericFail: function(inSender, inResponse) {
		this.log("Service failure, results=" + enyo.json.stringify(inResponse));
	},
	
	toggleMarked: function() {
		this.episode.marked = !this.episode.marked;
		
		if (this.episode.marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
		
		this.doMarkEpisode(this.episode);
	},

	togglePlay: function() {
		this.plays = !this.plays;
		
		if (this.plays) {
			// This happens only once after startup to allow resume of last episode
			if (this.resumeOnce > 0) {
				this.$.sound.audio.currentTime = this.resumeOnce;
				this.resumeOnce = -1;
			}
			this.$.sound.play();
			this.updatePlaytime();
			this.interval = setInterval(enyo.bind(this, this.updatePlaytime), 1000);
		} else {
			this.$.sound.audio.pause();
			this.updatePlaytime();
			clearInterval(this.interval);
		}		
	},
	
	seek: function(inSender, inEvent) {
		if (this.$.sound.audio.readyState == 0 || this.$.playButton.getDisabled()) return;
		
		this.$.sound.audio.currentTime = inEvent;
		this.updatePlaytime();
	},
	
	updatePlaytime: function() {
		// Update stalled spinner
		if (this.plays && (this.$.sound.audio.readyState != 4 || this.$.sound.audio.seeking)) this.$.stalledSpinner.show();
		else this.$.stalledSpinner.hide();
		
		// Update play button
		if (this.plays) {
			if (this.$.sound.audio.currentTime == 0) this.$.playButton.setCaption($L("Pause"));
			else if (this.$.sound.audio.currentTime == this.$.sound.audio.duration) this.playbackEnded();
			else this.$.playButton.setCaption($L("Pause at") + " " + this.createTimeString());
		} else {
			if (this.$.sound.audio.currentTime == 0) this.$.playButton.setCaption($L("Resume"));
			else this.$.playButton.setCaption($L("Resume at") + " " + this.createTimeString());
		}
	},
		
	updatePlaySlider: function () {
		this.$.playSlider.setMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setBarMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setPosition(this.$.sound.audio.currentTime);
		if (this.$.sound.audio.buffered.length > 0)
			this.$.playSlider.setBarPosition(this.$.sound.audio.buffered.end(this.$.sound.audio.buffered.length - 1));
	},
	
	playbackEnded: function() {
		clearInterval(this.interval);
		this.plays = false;
		
		this.$.playButton.setCaption($L("Playback complete"));
		this.$.playButton.setDisabled(true);
		this.$.stalledSpinner.hide();
		if (this.$.markButton.getSrc() == Episode.UNMARKED_ICON) this.toggleMarked();		
	},
	
	showError: function(text) {
		this.$.error.setContent(text);
		this.$.error.setStyle("display: block; width: 100%; text-align: center;");
	},
	
	updateUIOnSetEpisode: function() {
		this.$.error.setStyle("display: none;");
		this.$.playButton.setCaption($L("Play"));
		this.$.playButton.setDisabled(false);
		if (this.episode.isDownloaded) this.$.downloadButton.setCaption($L("Delete from device"));
		else this.$.downloadButton.setCaption($L("Download"));
		this.$.stalledSpinner.hide();
		this.$.episodeName.setContent($L("Listen to") + " \"" + this.episode.title + "\"");
		this.$.episodeDescription.setContent(this.episode.description);
		this.$.episodeScroller.scrollTo(0, 0);
		this.$.playSlider.setPosition(0);
		this.$.playSlider.setBarPosition(0);
		if (this.episode.marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
	},
		
	createTimeString: function() {
		return Utilities.formatTime(this.$.sound.audio.currentTime) + " " +  $L("of") + " " +
			Utilities.formatTime(this.$.sound.audio.duration);
	}
});