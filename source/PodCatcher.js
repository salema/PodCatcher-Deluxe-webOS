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
 * Main podcatcher kind
 * Establishes components and manages some control flow
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher",
	kind: "VFlexBox",
	components: [
		{kind: "AppMenu", components: [
        	{kind: "HelpMenu", target: "http://salema.github.com/Yet-Another-Simple-Pod-Catcher/help.html"}
        ]},
		{kind: "SlidingPane", flex: 1, components: [
			{kind: "Net.Alliknow.PodCatcher.PodcastList", name: "podcastListPane", width: "230px", onSelectPodcast: "podcastSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeList", name: "episodeListPane", width: "350px", peekWidth: 100, onSelectEpisode: "episodeSelected"},
			{kind: "Net.Alliknow.PodCatcher.EpisodeView", name: "episodeViewPane", flex: 1, peekWidth: 250}
		]}
	],
	
	openAppMenuHandler: function() {
	    this.$.appMenu.open();
	},
	
	closeAppMenuHandler: function() {
	    this.$.appMenu.close();
	},
	
	podcastSelected: function(inSender, podcast) {
		this.$.episodeListPane.setPodcast(podcast);
	},
	
	episodeSelected: function(inSender, episode) {
		this.$.episodeViewPane.setEpisode(episode);
	}
});