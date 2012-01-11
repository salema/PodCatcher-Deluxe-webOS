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
 * Displays a nice popup for the user to monitor current downloads
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.DownloadManagerPopup",
	kind: "ModalDialog",
	caption: $L("Download Manager"),
	layoutKind: "VFlexLayout",
	scrim: true,
	dismissWithClick: true,
	events: {
		onCancel: ""
	},
	width: "75%",
	components: [
		{kind: "Scroller", name: "downloadsScroller", style: "height: 320px; border: 1px solid gray;", components: [
			{kind: "VirtualRepeater", name: "downloadsListVR", onSetupRow: "getDownload", components: [
				{kind: "Item", components: [
					{kind: "HFlexBox", align: "center", components: [
						{name: "downloadName", flex: 1},
						{kind: "Button", name: "cancelDownload", content: $L("Cancel"), onclick: "cancelDownload", className: "enyo-button-negative"}
					]},
					{kind: "HFlexBox", align: "center", components: [
						{kind: "ProgressBar", name: "downloadBar", flex: 1},
						{name: "downloadStatus", style: "margin-left: 10px;"}
					]}
				]}
			]}
		]},
		{kind: "HtmlContent", name: "footer", showing: false, style: "width: 100%; text-align: center; color: gray;"}
	],
	
	update: function(items) {
		this.downloads = items;
		
		this.$.downloadsListVR.render();
	},
	
	getDownload: function(sender, index) {
		if (!this.downloads || this.downloads.length === 0) {
			this.$.footer.setContent($L("No active downloads"));
			this.$.footer.show();
		} else {
			this.$.footer.hide();
			var download = this.downloads[index];
		
			if (download) {
				this.$.downloadName.setContent(download.title + " (" + download.podcastTitle + ")");
				this.$.downloadBar.setMaximum(download.amountTotal);
				this.$.downloadBar.setPosition(download.amountReceived);
				this.$.downloadStatus.setContent(Utilities.formatDownloadStatus(download));
			}
		}
		
		return this.downloads && index < this.downloads.length;
	},
	
	cancelDownload: function(sender) {
		var download = this.downloads[this.$.downloadsListVR.fetchRowIndex()];
		
		this.doCancel(download);
	}
});
