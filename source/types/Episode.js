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
 * Represent a podcast episode
 */
function Episode() {}

// Read episode information from feed
// Make sure to call isValid() before reading
Episode.prototype.readFromXML = function(xmlTree) {
	this.title = XmlHelper.getFirstValue(xmlTree, XmlHelper.TITLE);
	this.url = XmlHelper.getFirst(xmlTree, XmlHelper.ENCLOSURE).getAttribute(XmlHelper.URL);
	this.pubDate = this.getPubDate(xmlTree);
	
	if (XmlHelper.has(xmlTree, XmlHelper.DESCRIPTION) &&
		XmlHelper.getFirst(xmlTree, XmlHelper.DESCRIPTION).firstChild != undefined)
			this.description = XmlHelper.getFirstValue(xmlTree, XmlHelper.DESCRIPTION);
	else this.description = "<i>" + $L("No description available.") + "</i>";
};

// Read episode information from JSON data
Episode.prototype.readFromJSON = function(data) {
	this.title = data.title;
	this.url = data.url;
	this.pubDate = data.pubDate;
	
	if (data.description != undefined) this.description = data.description;
	else this.description = "<i>" + $L("No description available.") + "</i>";
	
	if (data.ticket != undefined) this.ticket = data.ticket;
	if (data.file != undefined) this.file = data.file;
	if (data.podcastTitle != undefined) this.podcastTitle = data.podcastTitle;
	if (data.isDownloaded != undefined) this.isDownloaded = data.isDownloaded;
	if (data.marked != undefined) this.marked = data.marked;
};

Episode.prototype.isValidXML = function(xmlTree) {
	return XmlHelper.has(xmlTree, XmlHelper.TITLE) &&
		XmlHelper.has(xmlTree, XmlHelper.ENCLOSURE) && (
			XmlHelper.has(xmlTree, XmlHelper.PUBDATE) ||
			XmlHelper.has(xmlTree, XmlHelper.DATE));
};

Episode.prototype.getPubDate = function(xmlTree) {
	if (XmlHelper.has(xmlTree, XmlHelper.PUBDATE)) return XmlHelper.getFirstValue(xmlTree, XmlHelper.PUBDATE);
	else return XmlHelper.getFirstValue(xmlTree, XmlHelper.DATE);
};

Episode.prototype.setDownloaded = function(downloaded, file) {
	this.isDownloaded = downloaded;
	
	if (downloaded) this.file = file;
	else this.file = undefined;
};

Episode.prototype.equals = function(episode) {
	return episode instanceof Episode && this.url == episode.url;
};

Episode.prototype.compare = function(episodeA, episodeB) {
	return Date.parse(episodeB.pubDate) - Date.parse(episodeA.pubDate);
};

Episode.MARKED_ICON = "icons/star-off.png";
Episode.UNMARKED_ICON = "icons/star-on.png";
