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
 * Manages episode downloads and display a nice progress bar if applicable
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.DownloadManager",
	kind: "HFlexBox",
	events: {
		onStatusUpdate: "",
		onDownloadComplete: "",
		onCancelSuccess: "",
		onDownloadFailed: ""
	},
	components: [
		{kind: "PalmService", name: "episodeDownload", service: "palm://com.palm.downloadmanager/", method: "download", 
			onSuccess: "downloadSuccess", onFailure: "downloadFail", subscribe: true},
		{kind: "PalmService", name: "episodeDelete", service: "palm://com.palm.downloadmanager/", method: "deleteDownloadedFile", onFailure: "genericFail"},
		{kind: "PalmService", name: "cancel", service: "palm://com.palm.downloadmanager/", method: "cancelDownload", onSuccess: "cancelSuccess", onFailure: "genericFail"},
		{kind: "ApplicationEvents", onUnload: "cancelAll"},
		{kind: "HFlexBox", name: "progressUI", components: [
			{kind: "ProgressBar", name: "bar", style: "margin: 10px;", maximum: 100, position: 0, flex: 1},
			{name: "downloadCount", content: "0", style: "margin-right: 10px;"}
		]}
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.activeEpisodes = [];
		this.alwaysHidden = false;
		this.$.progressUI.hide();
	},
	
	download: function(episode) {
		this.addToActive(episode);
		this.$.episodeDownload.call({target: episode.url, targetFilename: Utilities.createUniqueFilename(episode.url)});
	},
	
	downloadSuccess: function(sender, response) {
		var episode = this.getEpisodeForResponse(response);
		if (episode) {
			// Set ticket on first call
			if (!episode.ticket && response.ticket) episode.ticket = response.ticket;
			episode.amountReceived = response.amountReceived;
			episode.amountTotal = response.amountTotal;
			
			this.updateProgress();
			this.doStatusUpdate(episode, Utilities.formatDownloadStatus(response));
			
			if (response.completed) {
				this.log("Complete ticket: " + episode.ticket);
				episode.setDownloaded(true, response.target);
				
				this.doDownloadComplete(episode, response);
				this.removeFromActive(episode);
				this.updateProgress();
			}
		}
	},
	
	cancel: function(episode) {
		var activeEpisode = Utilities.getItemInList(this.activeEpisodes, episode);
		
		this.log("Cancel ticket: " + activeEpisode.ticket);
		this.$.cancel.call({ticket: activeEpisode.ticket});
	},
	
	cancelSuccess: function(sender, response) {
		var episode = this.getEpisodeForResponse(response);
		
		this.log("Cancel success: " + episode.ticket);
		this.doCancelSuccess(episode);
		this.removeFromActive(episode);
		this.updateProgress();
		
		this.deleteDownload(episode);
	},
	
	cancelAll: function() {
		for (var index = 0; index < this.activeEpisodes.length; index++)
			this.cancel(this.activeEpisodes[index]);
	},
	
	deleteDownload: function(episode) {
		this.log("Delete ticket: " + episode.ticket);
		this.$.episodeDelete.call({ticket: episode.ticket});
		episode.ticket = undefined;
	},
	
	isDownloading: function(episode) {
		return Utilities.isInList(this.activeEpisodes, episode);
	},
	
	downloadFail: function(sender, response) {
		var episode = this.getEpisodeForResponse(response);
		
		this.doDownloadFailed(episode);
		this.removeFromActive(episode);
		this.updateProgress();
		
		this.genericFail(sender, response);
	},
	
	genericFail: function(sender, response) {
		this.log("Service failure, results=" + enyo.json.stringify(response));
	},
	
	addToActive: function(episode) {
		if (! Utilities.isInList(this.activeEpisodes, episode))
			this.activeEpisodes.push(episode);
	},
	
	removeFromActive: function(episode) {
		if (Utilities.isInList(this.activeEpisodes, episode))
			this.activeEpisodes.splice(Utilities.getIndexInList(this.activeEpisodes, episode), 1);
	},
	
	updateProgress: function() {
		if (this.activeEpisodes.length === 0) {
			this.$.progressUI.hide();
			this.$.bar.setPosition(0);
		} else {
			if (!this.alwaysHidden) this.$.progressUI.show();
			this.$.downloadCount.setContent(this.activeEpisodes.length);
			
			var total = 0;
			var received = 0;
			
			for (var index = 0; index < this.activeEpisodes.length; index++) {
				if (this.activeEpisodes[index].amountTotal)	total += this.activeEpisodes[index].amountTotal;
				if (this.activeEpisodes[index].amountReceived) received += this.activeEpisodes[index].amountReceived;
			}
			
			this.$.bar.setMaximum(total);
			this.$.bar.setPosition(received);
		}
	},
	
	setAlwaysHide: function(hide) {
		if (hide) this.$.progressUI.hide();
		
		this.alwaysHidden = hide;
	},
	
	getEpisodeForResponse: function(response) {
		// This is for the first status call
		if (response.url && response.ticket && !response.completed) {
			for (var index = 0; index < this.activeEpisodes.length; index++)
				if (this.activeEpisodes[index].url == response.url) return this.activeEpisodes[index];
		} else {
			for (var index = 0; index < this.activeEpisodes.length; index++)
				if (this.activeEpisodes[index].ticket == response.ticket) return this.activeEpisodes[index];
		}
		
		this.log("No match for: " + JSON.stringify(response));
		this.log("in " + JSON.stringify(this.activeEpisodes));
	}
});