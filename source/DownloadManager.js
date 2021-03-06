/** Copyright 2011, 2012 Kevin Hausmann
 *
 * This file is part of PodCatcher Deluxe.
 *
 * PodCatcher Deluxe is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * PodCatcher Deluxe is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PodCatcher Deluxe. If not, see <http://www.gnu.org/licenses/>.
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
		{kind: "Net.Alliknow.PodCatcher.DownloadManagerPopup", name: "downloadManagerPopup", onCancel: "cancelFromPopup"},
		{kind: "HFlexBox", name: "progressUI", align: "center", components: [
			{kind: "ProgressBar", name: "bar", style: "margin: 10px 12px;", maximum: 100, position: 0, flex: 1},
			{kind: "Button", name: "downloadCount", content: "0", style: "margin-right: 10px;", onclick: "showPopup"}
		]}
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.activeEpisodes = [];
		this.alwaysHidden = false;
		this.$.progressUI.hide();
	},
	
	showPopup: function() {
		this.$.downloadManagerPopup.openAtCenter();
		this.$.downloadManagerPopup.update(this.activeEpisodes);
	},
	
	download: function(episode) {
		if (! this.isDownloading(episode)) {
			this.addToActive(episode);
			this.$.episodeDownload.call({target: episode.url, targetFilename: Utilities.createUniqueFilename(episode.url)});
		}
	},
	
	downloadSuccess: function(sender, response) {
		var episode = this.getEpisodeForResponse(response);
		
		if (episode) {
			// Set ticket on first call
			if (!episode.ticket && response.ticket) episode.ticket = response.ticket;
			episode.amountReceived = response.amountReceived;
			episode.amountTotal = response.amountTotal;
			
			if (response.completed && episode.amountReceived > 0) {
				this.log("Completed download for ticket: " + episode.ticket);
				episode.setDownloaded(true, response.target);
				
				this.doDownloadComplete(episode, response);
				this.removeFromActive(episode);
			} 
			else if (response.completed) this.downloadFail(sender, response);
			else this.doStatusUpdate(episode, Utilities.formatDownloadStatus(response));
			
			this.updateProgress();	
		}
	},
	
	cancel: function(episode) {
		var activeEpisode = Utilities.getItemInList(this.activeEpisodes, episode);
		
		this.$.cancel.call({ticket: activeEpisode.ticket});
	},
	
	cancelFromPopup: function(sender, episode) {
		this.cancel(episode);
	},
	
	cancelSuccess: function(sender, response) {
		var episode = this.getEpisodeForResponse(response);
		
		this.log("Cancel success for ticket: " + episode.ticket);
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
		this.log("Delete downloaded file for ticket: " + episode.ticket);
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
		
		this.deleteDownload(episode);
		this.genericFail(sender, response);
	},
	
	genericFail: function(sender, response) {
		this.warn("Service failure, results=" + enyo.json.stringify(response));
	},
	
	addToActive: function(episode) {
		if (! Utilities.isInList(this.activeEpisodes, episode))
			this.activeEpisodes.push(episode);
	},
	
	removeFromActive: function(episode) {
		Utilities.removeItemFromList(this.activeEpisodes, episode);
		
		episode.amountReceived = undefined;
	},
	
	updateProgress: function() {
		if (this.activeEpisodes.length === 0) {
			this.$.progressUI.hide();
			this.$.bar.setPosition(0);
		} else {
			if (! this.alwaysHidden) this.$.progressUI.show();
			
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
		
		// Notify Download Manager Popup if active and open
		if (this.$.downloadManagerPopup.showing) this.$.downloadManagerPopup.update(this.activeEpisodes);
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
		
		this.warn("No match for: " + JSON.stringify(response));
		this.warn("in " + JSON.stringify(this.activeEpisodes));
	}
});
