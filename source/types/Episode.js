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
 * Represent a podcast episode
 */
function Episode() {
	this.helper = new XmlHelper();
}

// Read episode information from feed
// Make sure to call isValid() before reading
Episode.prototype.read = function(xmlTree) {
	this.title = this.helper.getFirstValue(xmlTree, XmlHelper.TITLE);
	this.url = this.helper.getFirst(xmlTree, XmlHelper.ENCLOSURE).getAttribute(XmlHelper.URL);
	this.pubDate = this.helper.getFirstValue(xmlTree, XmlHelper.PUBDATE);
	
	if (this.helper.getFirst(xmlTree, XmlHelper.DESCRIPTION).firstChild != undefined)
		this.description = this.helper.getFirstValue(xmlTree, XmlHelper.DESCRIPTION);
	else this.description = "<i>" + $L("No description available.") + "</i>";
};

Episode.prototype.isValid = function(xmlTree) {
	return this.helper.has(xmlTree, XmlHelper.TITLE) &&
		this.helper.has(xmlTree, XmlHelper.ENCLOSURE) &&
		this.helper.has(xmlTree, XmlHelper.PUBDATE) &&
		this.helper.has(xmlTree, XmlHelper.DESCRIPTION);
};

Episode.prototype.setDownloaded = function(downloaded, ticket, file) {
	this.isDownloaded = downloaded;
	
	if (downloaded) {
		this.ticket = ticket;
		this.file = file;
	} else {
		this.ticket = undefined;
		this.file = undefined;
	};
};

Episode.prototype.compare = function(episodeA, episodeB) {
	return Date.parse(episodeB.pubDate) - Date.parse(episodeA.pubDate);
};

Episode.MARKED_ICON = "icons/star-off.png";
Episode.UNMARKED_ICON = "icons/star-on.png";