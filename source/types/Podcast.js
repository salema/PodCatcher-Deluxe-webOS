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
	this.helper = new XmlHelper();
}

Podcast.prototype.setUrl = function(url) {
	this.url = url;
}

Podcast.prototype.read = function(xml) {
	var source = this.helper.createXmlParser(xml);
		
	this.title = this.helper.getFirstValue(source, XmlHelper.TITLE);
	this.description = this.helper.getFirstValue(source, XmlHelper.DESCRIPTION);
	this.image = this.findImage(source);
}

Podcast.prototype.isValid = function(xml) {
	var source = this.helper.createXmlParser(xml);
		
	var title = this.helper.get(source, XmlHelper.TITLE);
	var description = this.helper.get(source, XmlHelper.DESCRIPTION);
	
	return title.length > 0 && description.length > 0;
}

Podcast.prototype.findImage = function(source) {
	// TODO make this work all the time...
	//if (this.helper.get(source, XmlHelper.IMAGE).length > 0)
	//	return this.helper.getFirst(source, XmlHelper.IMAGE).getAttribute("url");
	if (this.helper.get(source, XmlHelper.THUMBNAIL).length > 0)
		return this.helper.getFirst(source, XmlHelper.THUMBNAIL).getAttribute(XmlHelper.URL);
	if (this.helper.get(source, XmlHelper.IMAGE).length > 0)
		return this.helper.getFirst(source, XmlHelper.IMAGE).getAttribute(XmlHelper.HREF);
}