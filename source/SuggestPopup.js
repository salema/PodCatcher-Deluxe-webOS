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
 * Displays a nice popup for the user to select from some suggested podcasts
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.SuggestPopup",
	kind: "ModalDialog",
	SOURCE: "http://salema.github.com/Yet-Another-Simple-Pod-Catcher/suggestions.json",
	caption: $L("Add a new Podcast"),
	layoutKind: "VFlexLayout",
	scrim: true,
	dismissWithClick: true,
	events: {
		onAddSuggestion: ""
	},
	width: "75%",
	components: [
		{kind: "WebService", name: "grabSuggestionsService", onSuccess: "grabSuggestionsSuccess", onFailure: "grabSuggestionsFailed"},
		{kind: "PalmService", name: "openEmailCall", service: "palm://com.palm.applicationManager/", method: "open"},
		{kind: "PickerGroup", label: $L("Filter for"), onChange: "updateSuggestions", style: "margin-left: 11px", components: [
			{name: "languagePicker", items: [$L("All"), $L("English"), $L("German")], className: "filterPicker"},
			{name: "categoryPicker", items: [$L("All"), $L("News"), $L("Sports"), $L("Technology")], className: "filterPicker"},
			{name: "typePicker", items: [$L("All"), $L("Audio"), $L("Video")], className: "filterPicker"}
		]},
		{kind: "Group", caption: $L("Featured Podcast"), components: [
			{kind: "HFlexBox", align: "center", components: [
				{name: "featuredTitle", style: "margin: 10px;"},
				{name: "featuredDetails", style: "color: grey; margin-left: 5px;", flex: 1},
				{kind: "Button", name: "addFeaturedButton", content: $L("Add Podcast"), onclick: "addFeatured", style: "margin-right: 13px;"}
			]},
			{name: "featuredDescription", style: "margin-left: 10px; margin-bottom: 10px; font-size: smaller"}
		]},
		{kind: "Group", caption: $L("Suggested Podcasts"), components: [
			{kind: "Scroller", name: "suggestScroller", style: "height: 290px", components: [
				{kind: "VirtualRepeater", name: "suggestListVR", onSetupRow: "getSuggestion", onclick: "selectPodcastClick", components: [
					{kind: "Item", components: [
						{kind: "HFlexBox", align: "center", components: [
							{name: "podcastTitle"},
							{name: "podcastDetails", style: "color: grey; margin-left: 15px;", flex: 1},
							{kind: "Button", name: "addSuggestionButton", content: $L("Add Podcast"), onclick: "addSuggestion"}
						]},
						{name: "podcastDescription", style: "font-size: smaller"}
					]}
				]}
			]}
		]},
		{kind: "HtmlContent", content: $L("<a href=\"\">Send a proposal</a> for suggestions to be included in this list!"), onLinkClick: "sendProposal", style: "width: 100%; text-align: center;"}
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.allFeatured = [];
				
		this.allSuggestions = [];
		this.currentSuggestions = [];
	},
	
	open: function() {
		this.inherited(arguments);
		
		if (enyo.g11n.currentLocale().getLanguage() == "de") this.$.languagePicker.setValue($L("German"));
		else this.$.languagePicker.setValue($L("English"));
		this.$.categoryPicker.setValue($L("All"));
		this.$.typePicker.setValue($L("Audio"));
		
		this.$.grabSuggestionsService.setUrl(this.SOURCE);
		this.$.grabSuggestionsService.call();
	},
	
	addFeatured: function() {
		this.doAddSuggestion(this.featured.url);
	},
	
	addSuggestion: function() {
		var suggestion = this.currentSuggestions[this.$.suggestListVR.fetchRowIndex()];
		this.doAddSuggestion(suggestion.url);
	},
	
	sendProposal: function() {
		var params =  {"summary":"A proposal for a podcast suggestion in the PodCatcher apps",
			"recipients":[{"type": "email",	"contactDisplay": "Kevin Hausmann", "role":1, "value": "kevin@alliknow.net"}]};
		this.$.openEmailCall.call({"id": "com.palm.app.email", "params": params});
	},
	
	getSuggestion: function(sender, index) {
		if (index < this.currentSuggestions.length) {
			var item = this.currentSuggestions[index];
			
			this.$.podcastTitle.setContent(item.title);
			this.$.podcastDetails.setContent(this.createMetadataString(item));
			this.$.podcastDescription.setContent(item.description);
		}
		
		return index < this.currentSuggestions.length;
	},
	
	grabSuggestionsSuccess: function(sender, response, request) {		
		this.allFeatured = eval(response).featured;
		this.allSuggestions = eval(response).suggestions;
		
		this.updateSuggestions();
	},
	
	updateSuggestions: function() {
		this.featured = this.filter(this.allFeatured)[0];
		if (!this.featured) this.featured = this.allFeatured[0];
		
		this.$.featuredTitle.setContent(this.featured.title);
		this.$.featuredDetails.setContent(this.createMetadataString(this.featured));
		this.$.featuredDescription.setContent(this.featured.description);
		
		this.currentSuggestions = this.filter(this.allSuggestions);
		this.$.suggestListVR.render();
		this.$.suggestScroller.scrollTo(0, 0);
	},
	
	filter: function(list) {
		var result = [];
		
		for (var index = 0; index < list.length; index++)
			if (this.accept(this.$.typePicker, list[index], "type") &&
				this.accept(this.$.categoryPicker, list[index], "category") &&
				this.accept(this.$.languagePicker, list[index], "language"))
					result.push(list[index]);
		
		return result;
	},
	
	accept: function(picker, item, property) {
		return picker.getValue() == $L("All") || picker.getValue() == $L(item[property]);
	},
	
	createMetadataString: function(suggestion) {
		return $L(suggestion.language) + " - " + $L(suggestion.category) + " - " + $L(suggestion.type);
	},
	
	grabSuggestionsFailed: function(sender, response, request) {
		this.close();
		this.warn("Failed to load suggestions from server: " +  response);
	}
});