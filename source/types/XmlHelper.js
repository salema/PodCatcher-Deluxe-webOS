/** Copyright 2011, 2012 Kevin Hausmann
 *
 * This file is part of Simple PodCatcher.
 *
 * Simple PodCatcher is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * Simple PodCatcher is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Simple PodCatcher. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Some helper functions to work on XML documents (like podcast feeds)
 */
function XmlHelper() {}

XmlHelper.get = function(xmlTree, tagName) {
	return xmlTree.getElementsByTagName(tagName);
};

XmlHelper.has = function(xmlTree, tagName) {
	return this.get(xmlTree, tagName).length > 0;
};

XmlHelper.getFirst = function(xmlTree, tagName) {
	return this.get(xmlTree, tagName)[0];
};

XmlHelper.getFirstValue = function(xmlTree, tagName) {
	var firstChild = undefined;
	
	if (this.has(xmlTree, tagName)) firstChild = this.getFirst(xmlTree, tagName).firstChild;
	
	if (firstChild) return firstChild.data;
	else return undefined;
};

XmlHelper.parse = function(xmlDocument) {
	var parser = new DOMParser();
	
	return parser.parseFromString(xmlDocument, "text/xml");
};

XmlHelper.ITEM = "item";
XmlHelper.TITLE = "title";
XmlHelper.ENCLOSURE = "enclosure";
XmlHelper.PUBDATE = "pubDate";
XmlHelper.DESCRIPTION = "description";
XmlHelper.IMAGE = "image";
XmlHelper.THUMBNAIL = "thumbnail";
XmlHelper.URL = "url";
XmlHelper.HREF = "href";