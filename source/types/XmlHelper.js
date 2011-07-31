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
 * Some helper functions
 */
function XmlHelper() {
}

XmlHelper.prototype.get = function(xml, tag) {
	return xml.getElementsByTagName(tag);
}

XmlHelper.prototype.getFirst = function(xml, tag) {
	return this.get(xml, tag)[0];
}

XmlHelper.prototype.getFirstValue = function(xml, tag) {
	return this.getFirst(xml, tag).firstChild.data;
}

XmlHelper.prototype.createXmlParser = function(xml) {
  var parser = new DOMParser();
	return parser.parseFromString(xml, "text/xml");
}

XmlHelper.TITLE = "title";
XmlHelper.ENCLOSURE = "enclosure";
XmlHelper.PUBDATE = "pubDate";
XmlHelper.DESCRIPTION = "description";
XmlHelper.IMAGE = "image";
XmlHelper.THUMBNAIL = "thumbnail";
XmlHelper.URL = "url";
XmlHelper.HREF = "href";