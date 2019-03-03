var DEBUG = false;
var LITE = false; // If true, use text versions of emotes instead
var wss = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

// Window Data Structures
// 3D Arrays - [emote_id, emote_text, occurrences]
var time_range = 10000; // Specifies the length of time to track an emote for
var resolution = 1000; // Specifies the refresh rate. (When to empty the bucket and add it to the historical values)
var top_length = 5; // Only output the top X used emotes

// The window structures
var hist_length = Math.floor(time_range / resolution); 
var gather_window = new Array();
var current_sum = new Array();
var hist_window = new Array();
var i;
for(i = 0; i < hist_length; i++){
	hist_window.push([['null','null', 0]]);
}


// Sets rotation interval
window.setInterval(rotateWindow, resolution);

// Join overwatchleague chat as an anonymous user. Random `justinfan` with a number between 0 - 999,999
wss.onopen = function open() {
	var nick = 'justinfan' + Math.floor(Math.random() * 10000000);
	var channel = 'overwatchleague';

	console.log('Joining #' + channel + ' with the nickname ' + nick)
	
	wss.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
	wss.send('NICK ' + nick);
	wss.send('JOIN #' + channel);
};

// Handles receipt of a new chat message
wss.onmessage = function(msg){
	var emote_list = getEmoteIDs(msg.data);
	if (emote_list != null){
		gather_window = addEmotes(emote_list, gather_window);		
	}
};

// Grabs id numbers for all emotes in this message
function getEmoteIDs(msg){
	// Regex to grab the `emotes` field
	var emote_re = /emotes=([0-9:\-,\/]*)/;
	var msg_re = /PRIVMSG \#overwatchleague :(.*)/
	
	if (DEBUG == true){
		console.log("Message: " + msg);
		console.log("`emote_data` Match: " + emote_data);
	}
	
	// Grab the `emotes` field
	var emote_data = msg.match(emote_re);
	
	/* 
	 Stops routine if:
	 1. We didn't find the `emotes` field
		OR 
	 2. The `emotes` field is empty
	*/
	if (emote_data != null && emote_data[1].length > 0){
		// Create a list of the emotes found
		var emotes = emote_data[1].split('/');
	
		// Prints out the id number and text for each emote
		var i;
		var emote_id;
		var text_pos;
		var chat = msg.match(msg_re)[1];
		var emote_list = [['', '', 0]]; // 0=id, 1=text, 2=value
		
		// Loops through each emote and adds its id, text, and occurrences to the list
		for (i = 0; i < emotes.length; i++){
			if(!emote_list[i]){
				emote_list[i] = ['','',0]
			}
			
			// Get ID
			emote_id = emotes[i].split(':')
			emote_list[i][0] = emote_id[0];
			
			// Get text
			text_pos = emote_id[1].split(',')[0].split('-');
			emote_list[i][1] = chat.substring(parseInt(text_pos[0]), parseInt(text_pos[1]) + 1);
			
			// Get occurrences
			emote_list[i][2] = (emote_id[1].split(',').length < 5) ? emote_id[1].split(',').length : 5;
		}
		
		return emote_list;
	}
	else{
		return null;
	}
}

// Increments or adds each emote in this window
function addEmotes(from_arr, to_arr){
	var i;
	var location;
	for (i = 0; i < from_arr.length; i++){
		// If the window doesn't have this emote set its value
		location = contains(to_arr, from_arr[i][0])
		if(location === -1){
			to_arr[to_arr.length] = from_arr[i].slice();
		}
		// If it does, then add its value
		else{
			to_arr[location][2] = to_arr[location][2] + from_arr[i][2];
		}
	}
	return to_arr;
}

// Searches `arr` for an element with `str` as it's 0th index.
// Returns its index if true, -1 if false
function contains(arr, str){
	var i;
	for(i = 0; i < arr.length; i++){
		if(arr[i][0] === str){
			return i;
		}
	}
	
	return -1;
}

// Returns comparison for the third column of a and b
function compareThirdColumn(a, b){
	if(a[2] === b[2]) {
		return 0;
	}
	else {
		return (a[2] < b[2]) ? 1 : -1;
	}
}

// Rotates the emote window forward
function rotateWindow(){
	// Moves the windows down an index and removes the oldest one	
	var i;
	for(i = 1; i < hist_length; i++){
		hist_window[i - 1] = hist_window[i];
	}
	// Adds the current gathering window to the historical window
	hist_window[hist_length - 1] = gather_window;
	
	// Clears the both temporary windows
	gather_window = [];
	current_sum = [];
	
	// Sums up the emote values from the historical window
	var i;
	for(i = 0; i < hist_length; i++){
		current_sum = addEmotes(hist_window[i], current_sum);
	}
	
	current_sum.sort(compareThirdColumn);
	document.getElementById('demo').innerHTML = emotesArraytoString(current_sum.slice(0, top_length));
}

// Converts an array of emote data into a printable string
function emotesArraytoString(emotes){
	ret_str = ""
	var i;
	for(i = 0; i < emotes.length; i++){
		if(emotes[i][0] != 'null'){
			if(LITE){
				ret_str += '<p><b>"' + emotes[i][1] + '</b>": ' + emotes[i][2] + '</p>';
			}
			else{
				ret_str += '<p><img src="' + IDtoImage(emotes[i][0]) + '">: ' + emotes[i][2] + '</p>';
			}
		}
	}
	
	return ret_str;
}

// Returns the full image link for an emote id
function IDtoImage(id){
	var scale = '1.0'
	return 'https://static-cdn.jtvnw.net/emoticons/v1/' + id + '/' + scale;
}
