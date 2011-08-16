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

// Convert a time given in seconds with many digits to HH:MM:SS
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
	
Utilities.formatDownloadStatus = function(data) {
	var percent = Math.floor(data.amountReceived / data.amountTotal * 100);
	var received = Math.round(data.amountReceived / (1024*1024));
	var total = Math.round(data.amountTotal / (1024*1024));
	
	return this.formatNumber(percent) + "% (" + this.formatNumber(received) +
			" " + $L("of") + " " + this.formatNumber(total) + "MB)";
};
	
Utilities.formatNumber = function(number, makeTwoDigits) {
	if (isNaN(number) || !isFinite(number)) return "--";
	else if (number < 10 && makeTwoDigits) return "0" + number;
	else return number;
};