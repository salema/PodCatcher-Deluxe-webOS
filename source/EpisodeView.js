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
		
		this.$.preferencesService.call(
		{
			keys: ["resumeEpisode", "resumeMarked", "resumeTime"]
		},
		{
			method: "getPreferences",
			onSuccess: "resume",
		});
	},
	
	resume: function(inSender, inResponse) {
		if (inResponse.resumeEpisode != undefined) {
			this.setEpisode(inResponse.resumeEpisode, inResponse.resumeMarked);
			this.doResume(inResponse.resumeEpisode);
			this.doMarkEpisode(inResponse.resumeEpisode, inResponse.resumeMarked);
			
			if (inResponse.resumeTime > 0) {
				this.resumeOnce = inResponse.resumeTime;
				this.$.playButton.setCaption($L("Resume at") + " " + this.formatTime(inResponse.resumeTime));
			}
		}
	},
	
	storeResumeInformation: function() {
		this.$.preferencesService.call(
		{
			"resumeEpisode": this.episode,
			"resumeMarked": this.$.markButton.getSrc() == Episode.MARKED_ICON,
			"resumeTime": this.$.sound.audio.currentTime
		},
		{
			method: "setPreferences"
		});
	},
	
	setEpisode: function(episode, marked) {
		// Don't do anything if downloading
		if (this.downloads) {
			this.showError($L("Download active, please wait or cancel."));
			return;
		} this.$.error.setStyle("display: none;");
		// Don't do anything if same episode is set again
		if (this.episode != undefined && episode.url == this.episode.url) return;
		if (this.plays) this.togglePlay();
		
		this.episode = episode;
		this.resumeOnce = -1;
		
		// Update UI
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
		if (marked) this.$.markButton.setSrc(Episode.MARKED_ICON);
		else this.$.markButton.setSrc(Episode.UNMARKED_ICON);
		
		// Set sound source
		if (episode.isDownloaded) this.$.sound.setSrc(episode.file);
		else this.$.sound.setSrc(episode.url);
	},
	
	startStopDelete: function(inSender, inResponse) {
		// Download episode 
		if (!this.downloads && !this.episode.isDownloaded) {
			this.downloads = true;
			this.$.downloadButton.setCaption($L("Cancel"));		
			this.$.episodeDownload.call({target: this.episode.url});
		} // Delete downloaded file
		else if (!this.downloads && this.episode.isDownloaded) {
			if (this.plays) {
				this.showError($L("Please stop playback before deleting."));
				return;
			} else {
				this.$.sound.setSrc(this.episode.url);
				this.$.error.setStyle("display: none;");
			}
			
			this.$.episodeDelete.call({ticket: this.episode.ticket});
			this.doDelete(this.episode);
			this.episode.setDownloaded(false);
			
			this.$.downloadButton.setCaption($L("Download"));
		} // Cancel download
		else if (this.downloads) {
			this.$.cancel.call({ticket: this.currentDownloadTicket});
			this.$.episodeDelete.call({ticket: this.currentDownloadTicket});
		}
	},
	
	downloadSuccess: function(inSender, inResponse) {
		this.currentDownloadTicket = inResponse.ticket;
		this.$.downloadButton.setCaption($L("Cancel at") + " " + this.formatDownloadStatus(inResponse));
		
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
		if (this.episode == undefined) return; 
		
		if (this.$.markButton.getSrc() == Episode.MARKED_ICON) this.$.markButton.setSrc(Episode.UNMARKED_ICON);
		else this.$.markButton.setSrc(Episode.MARKED_ICON);
		
		this.doMarkEpisode(this.episode, this.$.markButton.getSrc() == Episode.MARKED_ICON);
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
		
		// Update play slider
		this.$.playSlider.setMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setBarMaximum(this.$.sound.audio.duration);
		this.$.playSlider.setPosition(this.$.sound.audio.currentTime);
		this.$.playSlider.setBarPosition(this.$.sound.audio.currentTime);
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
		
	createTimeString: function() {
		return this.formatTime(this.$.sound.audio.currentTime) + " " +  $L("of") + " " +
			this.formatTime(this.$.sound.audio.duration);
	},
	
	// Convert a time given in seconds with many digits to HH:MM:SS
	formatTime: function(time) {
		var hours = Math.floor(Math.floor(time) / 3600);
		var minutes = Math.floor(Math.floor(time) / 60) - 60 * hours;
		var seconds = Math.floor(time) % 60;
		
		if (isNaN(minutes) || !isFinite(minutes)) minutes = "--";
		else if (minutes < 10 && hours > 0) minutes = "0" + minutes;
		
		if (isNaN(seconds) || !isFinite(seconds)) seconds = "--"; 
		else if (seconds < 10) seconds = "0" + seconds;
		
		if (!isNaN(hours) && isFinite(hours) && hours > 0) return hours + ":" + minutes + ":" + seconds;
		else return minutes + ":" + seconds; 
	},
	
	formatDownloadStatus: function(inResponse) {
		var percent = Math.floor(inResponse.amountReceived / inResponse.amountTotal * 100);
		percent = this.formatNumber(percent);
		
		var received = Math.round(inResponse.amountReceived / (1024*1024));
		received = this.formatNumber(received);
		
		var total = Math.round(inResponse.amountTotal / (1024*1024));
		total = this.formatNumber(total);
		
		return percent + "% (" + received + " " + $L("of") + " " + total + "MB)";
	},
	
	formatNumber: function(number) {
		if (isNaN(number) || !isFinite(number)) return "--";
		else return number;
	}
});