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
 * Displays a nice simple popup for the user to add a podcast URL
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.AddPodcastPopup",
	kind: "ModalDialog",
	caption: $L("Add a new Podcast"),
	scrim: false,
	dismissWithClick: true,
	events: {
		onAddPodcast: ""
	},
	width: "70%",
	components: [
		{kind: "WebService", name: "grabPodcastService", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "Net.Alliknow.PodCatcher.LoginPopup", name: "loginPopup", onLogin: "addPodcast"},
		{kind: "VFlexBox", components: [
			{kind: "HFlexBox", align: "center", components: [
				{kind: "Input", name: "urlInput", hint: $L("Insert Podcast URL here"), inputType: "url", flex: 1,
						alwaysLooksFocused: true, selectAllOnFocus: true, spellcheck: false, autoCapitalize: "lowercase"},
				{kind: "Spinner", name: "loadSpinner"},
				{kind: "Button", name: "addButton", content: $L("Add Podcast"), onclick: "addPodcast"}
			]},
			{name: "error", style: "display: none;", className: "error"}
		]}
	],
	
	open: function() {
		this.inherited(arguments);
		
		// update UI
		this.$.urlInput.setValue("");
		this.$.error.setStyle("display: none");
		this.$.loadSpinner.hide();
		this.$.urlInput.setDisabled(false);
		this.$.addButton.setDisabled(false);
		

		// call for clipboard contents (maybe a podcast feed url?!)
		enyo.dom.getClipboard(enyo.bind(this, this.gotClipboard));
	},
	
	gotClipboard: function(text) {
		if (Utilities.startsWithValidProtocol(text)) this.$.urlInput.setValue(text);
	},

	addPodcast: function() {
		// update UI
		this.$.loginPopup.close();
		this.$.error.setStyle("display: none");
		this.$.loadSpinner.show();
		this.$.urlInput.setDisabled(true);
		this.$.addButton.setDisabled(true);

		// Check for protocol and add http if none is given
		if (! Utilities.startsWithValidProtocol(this.$.urlInput.getValue()))
			this.$.urlInput.setValue("http://" + this.$.urlInput.getValue());
		
		// Try to grab podcast
		Utilities.prepareFeedService(this.$.grabPodcastService, this.$.urlInput.getValue(),
				this.$.loginPopup.getUser(), this.$.loginPopup.getPass());
		this.$.grabPodcastService.call();
	},
	
	grabPodcastSuccess: function(sender, response, request) {
		var podcast = new Podcast(this.$.urlInput.getValue());
		
		if (podcast.isValidXML(response)) {
			podcast.readFromXML(response);
			podcast.user = this.$.loginPopup.getUser();
			podcast.pass = this.$.loginPopup.getPass();
			
			this.doAddPodcast(podcast);
			this.close();
		} else this.grabPodcastFailed();
	},
	
	grabPodcastFailed: function(sender, response, request) {
		if (request && request.xhr.status === 401) this.$.loginPopup.openAtCenter();
		else this.showFailed();
	},
	
	showFailed: function() {
		this.$.error.setContent($L("Your podcast failed to load. Please check the URL and make sure you are online. Tap anywhere outside this window to cancel."));
		this.$.error.setStyle("display: block");
		
		this.$.urlInput.setDisabled(false);
		this.$.addButton.setDisabled(false);
		this.$.loadSpinner.hide();
	}
});
