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
	var minutes = Math.floor(Math.floor(time) / 60) - 60 * hours;
	var seconds = Math.floor(time) % 60;
	
	if (isNaN(minutes) || !isFinite(minutes)) minutes = "--";
	else if (minutes < 10 && hours > 0) minutes = "0" + minutes;
	
	if (isNaN(seconds) || !isFinite(seconds)) seconds = "--"; 
	else if (seconds < 10) seconds = "0" + seconds;
	
	if (!isNaN(hours) && isFinite(hours) && hours > 0) return hours + ":" + minutes + ":" + seconds;
	else return minutes + ":" + seconds; 
};
	
Utilities.formatDownloadStatus = function(inResponse) {
	var percent = Math.floor(inResponse.amountReceived / inResponse.amountTotal * 100);
	percent = this.formatNumber(percent);
	
	var received = Math.round(inResponse.amountReceived / (1024*1024));
	received = this.formatNumber(received);
	
	var total = Math.round(inResponse.amountTotal / (1024*1024));
	total = this.formatNumber(total);
	
	return percent + "% (" + received + " " + $L("of") + " " + total + "MB)";
};
	
Utilities.formatNumber = function(number) {
	if (isNaN(number) || !isFinite(number)) return "--";
	else return number;
};