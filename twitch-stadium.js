var DEBUG = false
var wss = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

// Data Analytics Values
var time_range = 15000;
var resolution = 100;
var top = 10;
var hist_length = time_range / resolution;
var gather_window = new Object();
var current_sum = new Object();

var hist_window = new Array();
var i;
for(i = 0; i < hist_length; i++){
	hist_window[i] = new Object();
}

// Sets rotation interval
window.setInterval(rotate_window, resolution);

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
	var emote_list = get_emote_ids(msg.data);
	if (emote_list != null){
		gather_window = add_emotes_a2d(emote_list, gather_window);		
	}
};

function emotes_dict2str(window){
	ret_str = ""
	for(var emote in window){
		ret_str += '<p><img src="' + id_to_image(emote) + '">: ' + window[emote] + '</p>';
	}
	
	return ret_str;
}

function emotes_arr2str(emotes){
	ret_str = ""
	var i;
	for(i = 0; i < emotes.length; i++){
		if(emotes[i][0] != 'null'){
			ret_str += '<p><img src="' + id_to_image(emotes[i][0]) + '">: ' + emotes[i][1] + '</p>';
		}
	}
	
	return ret_str;
}

function window_to_toparray(wind, num_top){
	var max = ['null', 0]
	var top_emotes = new Array();
	
	var i;
	for(i = 0; i < 10; i++){
		for(var emote in wind){
			if(wind[emote] > max[1] && !contains(top_emotes, emote)){
				max = [emote, wind[emote]];
			}
		}
		
		top_emotes[i] = max;
		max = ['null', 0]
	}
	
	return top_emotes;
}

function contains(arr, str){
	var i;
	for(i = 0; i < arr.length; i++){
		if(arr[i][0] == str){
			return true;
		}
	}
	
	return false;
}

// Grabs id numbers for all emotes in this message
function get_emote_ids(msg){
	// Regex to grab the `emotes` field
	var emote_re = /emotes=([0-9:\-,\/]*)/;
	
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
	
		// Prints out the id number for each emote
		var i;
		var emote_id;
		var emote_list = [""];
		for (i = 0; i < emotes.length; i++){
			emote_id = emotes[i].split(':')
			emote_list[i] = emote_id[0];
		}
		
		return emote_list;
	}
	else{
		return null;
	}
}

// Increments or adds each emote in this window (Array to Dictionary)
function add_emotes_a2d(emote_list, window){
	var i;
	for (i = 0; i < emote_list.length; i++){
		// If the window has this emote then increment its value
		if(window[emote_list[i]] != null){
			window[emote_list[i]]++;
		}
		// If it doesn't, then add it and set its value to 1
		else{
			window[emote_list[i]] = 1;
		}
	}
	
	return window;
}

// Increments or adds each emote in this window (Dictionary to Dictionary)
function add_emotes_d2d(from_window, to_window){
	for(var emote in from_window){
		// If the window has this emote then increment its value
		if(to_window[emote] != null){
			to_window[emote]++;
		}
		// If it doesn't, then add it and set its value to 1
		else{
			to_window[emote] = 1;
		}
	}
	
	return to_window;
}

// Rotates the emote window forward
function rotate_window(){
	// Moves the windows down an index and removes the oldest one	
	var i;
	for(i = 1; i < hist_length; i++){
		hist_window[i - 1] = hist_window[i];
	}
	// Adds the current gathering window to the historical window
	hist_window[hist_length - 1] = gather_window;
	
	// Clears the both temporary windows
	gather_window = new Object();
	current_sum = new Object();
	
	// Sums up the emote values from the historical window
	for(i = 0; i < hist_length; i++){
		current_sum = add_emotes_d2d(hist_window[i], current_sum);
	}
	
	document.getElementById('demo').innerHTML = emotes_arr2str(window_to_toparray(current_sum, top));
}

// Returns the full image link for an emote id
function id_to_image(id){
	var scale = '1.0'
	return 'https://static-cdn.jtvnw.net/emoticons/v1/' + id + '/' + scale;
}