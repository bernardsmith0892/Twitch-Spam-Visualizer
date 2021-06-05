var DEBUG = false;
var LITE = false; // If true, use text versions of emotes instead
var MAX_EMOTE = 4; // How many emotes per message to consider when adding
var DEFAULT_MAX = (DECAY_MODE) ? 10 : 50; // What to set the highest value to as a default
var wss = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
var DECAY_MODE = getParameter('mode') === 'decay' && !(getParameter('mode') === null);
var channel = (getParameter('channel') === null) ? 'esl_csgo' : getParameter('channel'); // If URL param 'channel' isn't set, use the default
var interval;

// Window Data Structures
// 3D Arrays - [emote_id, emote_text, occurrences]
var resolution = (DECAY_MODE) ? 250 : 1000; // Specifies the refresh rate, in milliseconds
var top_length = 5; // Only output the top X used emotes

// Return the value of a GET parameter
function getParameter(param){
	var params = window.location.search.substr(1);
	params = params.split('&');
	
	if (params.length > 0){
		var i;
		for(i = 0; i < params.length; i++){
			if(param === params[i].split('=')[0]){
				return params[i].split('=')[1];
			}
		}
	}
	
	return null;
}


var gather_window = new Array();

if(DECAY_MODE){
	var low_value_decay = resolution / 2000; // Keeps low value emotes (less than 1) for two seconds
	var decay_modifier = resolution / 1000; // Slows down decay to align with changes in resolution
	// Sets decay interval
	interval = setInterval(decayTick, resolution);
}
else{
	var time_range = 20000; // Specifies the length of time, in milliseconds, to track an emote for
	// Initialize the windowing structures
	var hist_length = Math.floor(time_range / resolution); 
	var current_sum = new Array();
	var hist_window = new Array();
	var i;
	for(i = 0; i < hist_length; i++){
		hist_window.push([['null','null', 0]]);
	}

	// Sets rotation interval
	interval = setInterval(rotateWindow, resolution);
}

// Called when user updates the collection settings
function changeRefreshInterval(){
	// Update resolution
	resolution = document.getElementById("refresh_rate").value;
	// Stop current redraw interval
	clearInterval(interval);
	
	// Settings Update for Decay Mode
	if(DECAY_MODE){
		low_value_decay = resolution / 1000;
		decay_modifier = resolution / 1000;
		
		// Sets redraw interval
		interval = setInterval(decayTick, resolution);		
	}
	// Settings Update for Window Mode
	else{
		time_range = document.getElementById("window_range").value;
		// Reinitialize windows
		hist_length = Math.floor(time_range / resolution); 
		gather_window = new Array();
		current_sum = new Array();
		hist_window = new Array();
		var i;
		for(i = 0; i < hist_length; i++){
			hist_window.push([['null','null', 0]]);
		}
		
		// Sets rotation interval
		interval = setInterval(rotateWindow, resolution);
	}
	

}

// Join overwatchleague chat as an anonymous user. Random `justinfan` with a number between 0 - 999,999
wss.onopen = function open() {
	var nick = 'justinfan' + Math.floor(Math.random() * 10000000);
	
	console.log('Joining #' + channel + ' with the nickname ' + nick)
	
	wss.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
	wss.send('NICK ' + nick);
	wss.send('JOIN #' + channel);
	
	// Set the iframe's address to the proper chatroom
	twitch_chat.src = "https://www.twitch.tv/embed/" + channel + "/chat?parent=bernardsmith0892.github.io";
	
	// Corrects the values for the settings forms
	mode_dropdown.value = (DECAY_MODE) ? 'decay' : 'window';
	channel_form.value = channel;
	channel_display.textContent = "Channel: " + channel;
	refresh_rate.value = resolution;
	if(DECAY_MODE){
		window_range.disabled = true;
	}
};

// Handles receipt of a new chat message
wss.onmessage = function(msg){
	// Replies to PING messages from the chatroom
	if(msg.data.includes('PING :tmi.twitch.tv')){
		wss.send("PONG :tmi.twitch.tv");
	}
	// Gathers emotes from chat messages
	else if(msg.data.includes('PRIVMSG')){
		var emote_list = getEmoteIDs(msg.data);
		if (emote_list != null){
			gather_window = addEmotes(emote_list, gather_window);		
		}
	}
	// Outputs all other messages to the console when in DEBUG mode
	else if(DEBUG){
		console.log(msg.data);
	}
};

// Grabs id numbers for all emotes in this message
function getEmoteIDs(msg){
	// Regex to grab the `emotes` field
	var emote_re = /emotes=([0-9:\-,\/]*)/;
	var msg_re = /PRIVMSG \#[a-zA-Z0-9_]* :(.*)/
	
	// Grab the `emotes` field
	var emote_data = msg.match(emote_re);
		
	/* 
	 Stops routine if:
	 1. We didn't find the `emotes` field
		OR 
	 2. The `emotes` field is empty
	*/
	if (emote_data != null && emote_data[1].length > 0){
		try{
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
				
				// Get occurrences, only consider up to the MAX_EMOTE value
				emote_list[i][2] = (emote_id[1].split(',').length < 5) ? emote_id[1].split(',').length : MAX_EMOTE;
			}
			
			return emote_list;
		}
		catch(err){
			console.log(err);
			console.log("Message: " + msg);
			console.log("`emote_data` Match: " + emote_data);
			return null;
		}
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
			to_arr[location][2] += from_arr[i][2];
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

	// Sorts the sum list in descending mode and then prints it to the webpage
	current_sum.sort(compareThirdColumn);
	updateChart(current_sum.slice(0, top_length));
}

// Decays each emote value
function decayTick(){
	// Decreases each sum value by log base 3
	// Switches to decreasing by 20% when under 20
	// Switches to the `low_value_decay` when under 2
	// Removes the value if it's 0 or below
	var i;
	for(i = 0; i < gather_window.length; i++){
		if(gather_window[i][2] <= 0){
			gather_window[i][2] = 0;
			gather_window.splice(i, 1);
			i--;
		}
		else if(gather_window[i][2] < 2){
			gather_window[i][2] -= low_value_decay;
		}
		else if(gather_window[i][2] < 20){
			gather_window[i][2] -= gather_window[i][2] * 0.20 * decay_modifier;
		}
		else{
			gather_window[i][2] -= (Math.log(gather_window[i][2]) / Math.log(3)) * decay_modifier;
		}
	}
	
	// Sorts the sum list in descending mode and then prints it to the webpage
	gather_window.sort(compareThirdColumn);
	updateChart(gather_window.slice(0, top_length));
}

// Converts an array of emote data into HTML
function emotesArraytoHTML(emotes){
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

// Converts an array of emote data into a string
function emotesArraytoString(emotes){
	ret_str = ""
	var i;
	for(i = 0; i < emotes.length; i++){
		if(emotes[i][0] != 'null'){
			ret_str += emotes[i][1] + ': ' + emotes[i][2] + '; ';
		}
	}
	
	return ret_str;
}

// Returns the full image link for an emote id
function IDtoImage(id){
	var scale = '1.0'
	return 'https://static-cdn.jtvnw.net/emoticons/v1/' + id + '/' + scale;
}

// Updates dataset of and resizes (if needed) the amchart graph
function updateChart(emotes){
	var max = DEFAULT_MAX;
	
	// Loop through the given emote list and adds their data to the graph. Skip 'null' emotes
	var i;
	// console.log(emotes.length);
	for(i = 0; i < emotes.length; i++){
		if(emotes[i][0] != 'null'){
			// Do not draw the images if in 'lite' mode
			if(!LITE){
				chart.data[i].bullet = IDtoImage(emotes[i][0]);
			}
			chart.data[i].name = emotes[i][1];
			chart.data[i].value = emotes[i][2];
			if(chart.data[i].value >= max){
				max = chart.data[i].value + 10;
			}
		}
	}
	
	// Clears out the rest of the chart data if there aren't enough emotes
	for(i = emotes.length; i < chart.data.length; i++){
			chart.data[i].name = '';
			chart.data[i].value = 0;
			chart.data[i].bullet = '';
	}
	
	valueAxis.max = max;
	chart.invalidateData();
}