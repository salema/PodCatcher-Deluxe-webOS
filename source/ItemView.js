enyo.kind({
	name: "Net.Alliknow.PodCatcher.ItemView",
	kind: "SlidingView",
	components: [
		{kind: "Header", layoutKind: "HFlexLayout", components: [
			{content: "Listen", name: "selectedItemName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1},
			{kind: enyo.Spinner, name: "feedWebViewSpinner", align: "right"}
		]},
		{kind: "Sound", src: "http://traffic.libsyn.com/linuxoutlaws/linuxoutlaws219.mp3"},
		{kind: "Button", content: "Play", flex: 1, onclick: "play", name: "playButton"},
		{kind: enyo.Toolbar, pack: "justify", components: [
			{kind: enyo.GrabButton}
		]}
	],

	ready: function() {
		this.plays = false;
		this.$.sound.audio.controls = true;
	},

	play: function() {
		if (!this.plays) {
			this.$.sound.play();
			this.plays = true;
			this.$.playButton.setContent("Pause");
		} else {
			this.$.sound.audio.pause();
			this.plays = false;
			this.$.playButton.setContent("Play");
		}
	}
});
