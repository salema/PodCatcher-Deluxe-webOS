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
	this.helper = new XmlHelper();
}

Podcast.prototype.setUrl = function(url) {
	this.url = url;
}

// Read podcast information from feed
// Make sure to call isValid() before reading
Podcast.prototype.read = function(xmlDocument) {
	var xmlTree = this.helper.parse(xmlDocument);
		
	this.title = this.helper.getFirstValue(xmlTree, XmlHelper.TITLE);
	this.description = this.helper.getFirstValue(xmlTree, XmlHelper.DESCRIPTION);
	this.image = this.findImage(xmlTree);
}

Podcast.prototype.isValid = function(xmlDocument) {
	var xmlTree = this.helper.parse(xmlDocument);
		
	return this.helper.has(xmlTree, XmlHelper.TITLE) && this.helper.has(xmlTree, XmlHelper.DESCRIPTION)
}

Podcast.prototype.findImage = function(xmlTree) {
	// Image is in image tag
	if (this.helper.has(xmlTree, XmlHelper.IMAGE)) {
		var imageXmlTree = this.helper.getFirst(xmlTree, XmlHelper.IMAGE);
		
		// Image has seperate url tag
		if (this.helper.has(imageXmlTree, XmlHelper.URL))
			return this.helper.getFirstValue(imageXmlTree, XmlHelper.URL);
		// This is the <itunes:image href="xyz"> case
		else return imageXmlTree.getAttribute(XmlHelper.HREF);
	}	
	// Image is in thumbnail tag
	else if (this.helper.get(xmlTree, XmlHelper.THUMBNAIL).length > 0)
		return this.helper.getFirst(xmlTree, XmlHelper.THUMBNAIL).getAttribute(XmlHelper.URL);
}

Podcast.DEFAULT_IMAGE = "icons/icon128.png";