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
 * Displays a nice simple popup for the user to add a podcast URL
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.AddPodcastPopup",
	kind: "ModalDialog",
	caption: $L("Add a new Podcast"),
	scrim: true,
	dismissWithClick: true,
	events: {
		onAddPodcast: ""
	},
	width: "70%",
	components: [
		{kind: "WebService", name: "grabSuggestionsService", onSuccess: "grabSuggestionsSuccess", onFailure: "grabSuggestionsFailed"},
		{kind: "WebService", name: "grabPodcastService", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "Net.Alliknow.PodCatcher.LoginPopup", name: "loginPopup", onLogin: "addPodcast"},
		{kind: "Net.Alliknow.PodCatcher.SuggestPopup", name: "suggestPopup", onAddSuggestion: "addSuggestion", onBeforeOpen: "updateSuggestions"},
		{kind: "VFlexBox", components: [
			{kind: "HFlexBox", align: "center", components: [
				{kind: "Input", name: "urlInput", hint: $L("Insert Podcast URL here"), inputType: "url", flex: 1, 
						alwaysLooksFocused: true, selectAllOnFocus: true, spellcheck: false, autoCapitalize: "lowercase"},
				{kind: "ActivityButton", name: "addButton", content: $L("Add Podcast"), onclick: "addPodcast", className: "enyo-button-affirmative"}
			]},
			{name: "error", showing: false, className: "error"},
			{kind: "ActivityButton", name:"showSuggestionsButton", content: $L("Show suggestions..."), style: "margin-top: 10px; color: #fff; background-color: #f60;", onclick: "showSuggestions"}
		]},
	],
	
	open: function() {
		this.inherited(arguments);
		
		this.$.urlInput.setValue("");
		this.$.error.hide();
		this.$.urlInput.setDisabled(false);
		this.$.addButton.setDisabled(false);
		this.$.addButton.setActive(false);
		this.$.showSuggestionsButton.setCaption($L("Show suggestions..."));
		this.$.showSuggestionsButton.setDisabled(false);
		
		enyo.dom.getClipboard(enyo.bind(this, this.gotClipboard));
	},
	
	gotClipboard: function(inText) {
		if (Utilities.startsWithValidProtocol(inText)) this.$.urlInput.setValue(inText);
	},
	
	updateSuggestions: function() {
		this.$.suggestPopup.initPicker();
		this.$.suggestPopup.updateSuggestions();
	},
	
	showSuggestions: function() {
		this.$.showSuggestionsButton.setActive(true);
			
		this.$.grabSuggestionsService.setUrl(this.$.suggestPopup.SOURCE);
		this.$.grabSuggestionsService.call();
	},

	addPodcast: function() {
		// update UI
		this.$.loginPopup.close();
		this.$.error.hide();
		this.$.urlInput.setDisabled(true);
		this.$.addButton.setDisabled(true);
		this.$.addButton.setActive(true);
		
		// Check for protocol and add http if none is given
		if (! Utilities.startsWithValidProtocol(this.$.urlInput.getValue()))
			this.$.urlInput.setValue("http://" + this.$.urlInput.getValue());
		
		// Try to grab podcast
		Utilities.prepareFeedService(this.$.grabPodcastService, this.$.urlInput.getValue(),
				this.$.loginPopup.getUser(), this.$.loginPopup.getPass());
		this.$.grabPodcastService.call();
	},
	
	addSuggestion: function(sender, url) {
		// Try to grab podcast
		Utilities.prepareFeedService(this.$.grabPodcastService, url);
		this.$.grabPodcastService.call();
	},
	
	grabPodcastSuccess: function(inSender, inResponse, inRequest) {
		var podcast = new Podcast(inRequest.url);
		
		if (podcast.isValid(inResponse)) {
			podcast.read(inResponse);
			podcast.user = this.$.loginPopup.getUser();
			podcast.pass = this.$.loginPopup.getPass();
			
			this.doAddPodcast(podcast);
			this.close();	
		} else this.grabPodcastFailed();		
	},
	
	grabSuggestionsSuccess: function(sender, response, request) {		
		this.$.showSuggestionsButton.setActive(false);
		
		// Make sure there is a useful response
		if (! response || ! response.featured) this.grabSuggestionsFailed(sender, response, request);
		else {
			this.$.suggestPopup.setData(response);
			
			this.close();
			this.$.suggestPopup.openAtCenter();
		}
	},
	
	grabPodcastFailed: function(sender, response, request) {
		if (request && request.xhr.status === 401) this.$.loginPopup.openAtCenter();
		else this.showFailed();
	},
	
	grabSuggestionsFailed: function(sender, response, request) {
		this.$.showSuggestionsButton.setActive(false);
		this.$.showSuggestionsButton.setDisabled(true);
		this.$.showSuggestionsButton.setCaption($L("Download failed"));
				
		this.warn("Failed to load suggestions from server: " +  response);
	},
	
	showFailed: function() {
		this.$.error.setContent($L("Your podcast failed to load. Please check the URL and make sure that you are online. Tap anywhere outside this window to cancel."));
		this.$.error.show();
		
		this.$.urlInput.setDisabled(false);
		this.$.addButton.setDisabled(false);
		this.$.addButton.setActive(false);
	}
});
