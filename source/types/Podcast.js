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
 * Represent a podcast
 */
function Podcast(url) {
	this.url = url;
}

Podcast.prototype.setUrl = function(url) {
	this.url = url;
};

// Read podcast information from feed
// Make sure to call isValid() before reading
Podcast.prototype.readFromXML = function(xmlDocument) {
	var xmlTree = XmlHelper.parse(xmlDocument);
		
	this.title = XmlHelper.getFirstValue(xmlTree, XmlHelper.TITLE);
	//this.description = XmlHelper.getFirstValue(xmlTree, XmlHelper.DESCRIPTION);
	this.image = this.findImage(xmlTree);
};

//Read episode information from JSON data
Podcast.prototype.readFromJSON = function(data) {
	this.title = data.title;
	//this.description = data.description;
	this.image = data.image;
};

Podcast.prototype.isValidXML = function(xmlDocument) {
	var xmlTree = XmlHelper.parse(xmlDocument);
		
	return XmlHelper.has(xmlTree, XmlHelper.TITLE);
};

Podcast.prototype.findImage = function(xmlTree) {
	// Image is in image tag
	if (XmlHelper.has(xmlTree, XmlHelper.IMAGE)) {
		var imageXmlTree = XmlHelper.getFirst(xmlTree, XmlHelper.IMAGE);
		
		// Image has seperate url tag
		if (XmlHelper.has(imageXmlTree, XmlHelper.URL))
			return XmlHelper.getFirstValue(imageXmlTree, XmlHelper.URL);
		// This is the <itunes:image href="xyz"> case
		else return imageXmlTree.getAttribute(XmlHelper.HREF);
	}	
	// Image is in thumbnail tag
	else if (XmlHelper.get(xmlTree, XmlHelper.THUMBNAIL).length > 0)
		return XmlHelper.getFirst(xmlTree, XmlHelper.THUMBNAIL).getAttribute(XmlHelper.URL);
};

Podcast.prototype.equals = function(podcast) {
	return podcast instanceof Podcast && this.url == podcast.url;
};

Podcast.DEFAULT_IMAGE = "icons/icon128.png";