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

Episode.prototype.read = function(xml) {
	this.title = this.helper.getFirstValue(xml, XmlHelper.TITLE);
	this.url = this.helper.getFirst(xml, XmlHelper.ENCLOSURE).getAttribute(Episode.URL);
	this.pubDate = this.helper.getFirstValue(xml, XmlHelper.PUBDATE);
	this.description = this.helper.getFirstValue(xml, XmlHelper.DESCRIPTION);
}

Episode.prototype.isValid = function(xml) {
	return this.helper.get(xml, XmlHelper.TITLE).length > 0 &&
		this.helper.get(xml, XmlHelper.ENCLOSURE).length > 0 &&
		this.helper.get(xml, XmlHelper.PUBDATE).length > 0 &&
		this.helper.get(xml, XmlHelper.DESCRIPTION).length > 0;
}