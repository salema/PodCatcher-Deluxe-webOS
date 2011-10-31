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
 * Displays a nice popup for the user to enter login data
 */
enyo.kind({
	name: "Net.Alliknow.PodCatcher.LoginPopup",
	kind: "ModalDialog",
	caption: $L("Login"),
	scrim: false,
	dismissWithClick: true,
	events: {
		onLogin: ""
	},
	components: [
		{kind: "Input", name: "userInput", hint: $L("Username"), alwaysLooksFocused: true, selectAllOnFocus: true, spellcheck: false}, 
		{kind: "PasswordInput", name: "passInput", hint: $L("Password"), alwaysLooksFocused: true, selectAllOnFocus: true, spellcheck: false, style: "margin-top: 5px;"}, 
		{kind: "Button", name: "loginButton", caption: $L("Submit"), onclick: "doLogin", style: "margin-top: 8px;", className: "enyo-button-affirmative"}
	],
	
	open: function() {
		this.inherited(arguments);
		
		this.$.passInput.setValue("");
	},
	
	getUser: function() {
		if (this.$.userInput) return this.$.userInput.getValue();
		else return "";
	},
	
	getPass: function() {
		if (this.$.passInput) return this.$.passInput.getValue();
		else return "";
	}
});
