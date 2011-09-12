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
function Utilities() {}

/**
 * Convert a time given in seconds with many digits to HH:MM:SS
 */
Utilities.formatTime = function(time) {
	var hours = Math.floor(Math.floor(time) / 3600);
	var hasHours = !isNaN(hours) && isFinite(hours) && hours > 0;
	
	var minutes = Math.floor(Math.floor(time) / 60) - 60 * hours;
	var seconds = Math.floor(time) % 60;
	
	minutes = this.formatNumber(minutes, hasHours);
	seconds = this.formatNumber(seconds, true);
	
	if (hasHours) return hours + ":" + minutes + ":" + seconds;
	else return minutes + ":" + seconds; 
};

/**
 * Convert a download status response to a nice amount downloaded string
 */
Utilities.formatDownloadStatus = function(data) {
	var percent = Math.floor(data.amountReceived / data.amountTotal * 100);
	var received = Math.round(data.amountReceived / (1024*1024));
	var total = Math.round(data.amountTotal / (1024*1024));
	
	return this.formatNumber(percent) + "% (" + this.formatNumber(received) +
			" " + $L("of") + " " + this.formatNumber(total) + "MB)";
};

/**
 * Make sure a number exists (and escape to "--" if not) and optional make it
 * two digits long. Use for positive integer only!
 */
Utilities.formatNumber = function(number, makeTwoDigits) {
	if (number === undefined || isNaN(number) || !isFinite(number)) return "--";
	else if (number < 10 && makeTwoDigits) return "0" + number;
	else return number;
};

/**
 * Check whether given string starts with a valid web protocol identifier
 */
Utilities.startsWithValidProtocol = function(url) {
	return url !== undefined && url.length > 8 && 
		(url.substring(0, 7) == "http://" || url.substring(0, 8) == "https://");
};

/**
 * Create an unique, no-hassle filename for a downloaded file
 */
Utilities.createUniqueFilename = function(url) {
	var urlToFile = url.split("?")[0];
	var splits = urlToFile.split(".");
	return new Date().getTime() + "." + splits[splits.length - 1];
};

/**
 * Check whether a given item ins in list via equals
 */
Utilities.isInList = function(list, item) {
	return this.getIndexInList(list, item) >= 0;	
};

/**
 * Return item index in list or -1 of not in
 */
Utilities.getIndexInList = function(list, item) {
	for (var index = 0; index < list.length; index++)
		if (list[index].equals(item)) return index;
			
	return -1;	
};

/**
 * Return item in list or undefined of not in
 */
Utilities.getItemInList = function(list, item) {
	return list[this.getIndexInList(list, item)];	
};

/**
 * Return item attribute in list or undefined of not in
 */
Utilities.getItemAttributeValueInList = function(list, item, name) {
	var listItem = list[this.getIndexInList(list, item)];
	
	if (listItem) return listItem[name];
	else return undefined;
};