// Copyright 2011 Kevin Hausmann
//
// This file is part of Yet Another Simple Pod Catcher.
//
// Yet Another Simple Pod Catcher is free software: you can redistribute it 
// and/or modify it under the terms of the GNU General Public License as 
// published by the Free Software Foundation, either version 3 of the License,
// or (at your option) any later version.
//
// Yet Another Simple Pod Catcher is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Yet Another Simple Pod Catcher. If not, see <http://www.gnu.org/licenses/>.

// Show a single feed item (podcast) and allow playing
enyo.kind({
	name: "Net.Alliknow.PodCatcher.ItemView",
	kind: "SlidingView",
	components: [
		{kind: "Header", layoutKind: "HFlexLayout", style: "min-height: 60px;", components: [
			{content: "Listen", name: "selectedItemName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1}
		]},
		{kind: "Sound"},
		{kind: "Scroller", name: "itemScroller", flex: 1, style: "margin: 5px 12px", components: [
			{kind: "HtmlContent", content: "", name: "descriptionLabel", flex: 1}
		]},
		{kind: "Toolbar", pack: "right", components: [
			{kind: "GrabButton"},
			{kind: "ToolButton", name: "playButton", style: "margin-left: 40px", caption: "Play", onclick: "togglePlay", disabled: true, flex: 1}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.plays = false;
	},
	
	setItem: function(feedItem) {
		if (this.plays) this.togglePlay();
				
		this.$.playButton.setDisabled(false);
		this.$.selectedItemName.setContent("Listen to \"" + feedItem.title + "\"");
		this.$.descriptionLabel.setContent(feedItem.description);
		this.$.itemScroller.scrollTo(0, 0);
		this.$.sound.setSrc(feedItem.url);
	},

	togglePlay: function() {
		if (!this.plays) {
			this.$.sound.play();
			this.$.playButton.setCaption("Pause");
			this.$.sound.audio.ownerLink = this;
			this.$.sound.audio.addEventListener('ended', function(){ 
					this.ownerLink.togglePlay();
				}, false);
			
			this.plays = true;
		} else {
			this.$.sound.audio.pause();
			this.$.playButton.setCaption("Play");
			this.$.sound.audio.removeEventListener('ended');
			
			this.plays = false;
		}
	}
});