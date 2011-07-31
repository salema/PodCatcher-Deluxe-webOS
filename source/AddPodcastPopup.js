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
	kind: "Popup",
	events: {
		onAddPodcast: ""
	},
	width: "70%",
	components: [
		{kind: "WebService", name: "grabPodcast", onSuccess: "grabPodcastSuccess", onFailure: "grabPodcastFailed"},
		{kind: "VFlexBox", components: [
			{kind: "HFlexBox", align: "center", components: [
				{kind: "Input", name: "newPodcastURL", hint: "Insert Podcast URL here", onchange: "addPodcast", flex: 1, alwaysLooksFocused: true, selectAllOnFocus: true, autoCapitalize: "lowercase"},
				{kind: "Spinner", name: "loadSpinner"},
				{kind: "Button", content: "Add Podcast", onclick: "addPodcast"}
			]},
			{name: "error", content: "test", style: "display: none", className: "error"}
		]},
	],
	
	reset: function() {
		this.$.newPodcastURL.setValue("");
		this.$.error.setStyle("display: none");
		this.$.loadSpinner.hide();
		this.$.newPodcastURL.setDisabled(false);
	},

	addPodcast: function() {
		this.$.loadSpinner.show();
		this.$.error.setStyle("display: none");
		this.$.newPodcastURL.setDisabled(true);

		var url = this.$.newPodcastURL.getValue();
		// Check for protocol
		if (!(url.substring(0, 7) === "http://")) url = "http://" + url;
		
		// Try to grab podcast
		this.$.grabPodcast.setUrl(encodeURI(url));
		this.$.grabPodcast.call();
	},
	
	grabPodcastSuccess: function(inSender, inResponse, inRequest) {
		var podcast = new Podcast();
		
		if (podcast.isValid(inResponse)) {
			podcast.read(inResponse);
			podcast.setUrl(this.$.newPodcastURL.getValue());
			
			this.doAddPodcast(podcast);
			this.close();	
		} else this.grabPodcastFailed();		
	},
	
	grabPodcastFailed: function() {
		this.$.error.setContent("Your podcast failed to load. Please check the URL and make sure you are online. Tap anywhere outside this window to cancel.");
		this.$.error.setStyle("display: block");
		this.$.newPodcastURL.setDisabled(false);
		this.$.loadSpinner.hide();
	},
});