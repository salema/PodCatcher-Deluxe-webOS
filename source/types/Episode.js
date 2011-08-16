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
function Episode() {}

// Read episode information from feed
// Make sure to call isValid() before reading
Episode.prototype.read = function(xmlTree) {
	this.title = XmlHelper.getFirstValue(xmlTree, XmlHelper.TITLE);
	this.url = XmlHelper.getFirst(xmlTree, XmlHelper.ENCLOSURE).getAttribute(XmlHelper.URL);
	this.pubDate = XmlHelper.getFirstValue(xmlTree, XmlHelper.PUBDATE);
	
	if (XmlHelper.getFirst(xmlTree, XmlHelper.DESCRIPTION).firstChild != undefined)
		this.description = XmlHelper.getFirstValue(xmlTree, XmlHelper.DESCRIPTION);
	else this.description = "<i>" + $L("No description available.") + "</i>";
};

Episode.prototype.isValid = function(xmlTree) {
	return XmlHelper.has(xmlTree, XmlHelper.TITLE) &&
		XmlHelper.has(xmlTree, XmlHelper.ENCLOSURE) &&
		XmlHelper.has(xmlTree, XmlHelper.PUBDATE) &&
		XmlHelper.has(xmlTree, XmlHelper.DESCRIPTION);
};