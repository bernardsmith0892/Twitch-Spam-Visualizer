# Musubi Dashboard

### Introduction
I don't care what everyone says, I love Twitch chat. However, despite my best efforts, I cannot read 10,000 words per minute so I have no true idea what that firehose of spam is really saying. So I decided to waste a weekend building an ultimately pointless webapp that displays a bar graph of the currently most spammed emotes from the last 20 seconds. No longer do I have to stare at a waterfall of LULs to get a handle on how funny Twitch found that C9. Instead, here's a huge bar graph designed using [amCharts](https://www.amcharts.com/) so I don't have to expend more than 2 seconds of energy to gauge their reaction.

The default channel is ESL_CSGO, but you can change the channel in the settings.

### Screenshots
When the Philadelphia Fusion did a C9:

![Reaction to Fusion doing a C9](fusion_c9.png "OWL Fusion C9")

Going into map 5 between London Spitfire and Shanghai Dragons:

![Reaction to going into a new match. London vs Shanghai](map5-2-LvS.png "OWL Fusion C9")

Peta dissing Malik for playing on console:

![Reaction to Peta dissing Malik](peta_youplayonconsole.png "OWL Fusion C9")

Can you tell I made this before Overwatch League switched to Youtube?

## FAQ
The graph updates too slowly, can I make it faster?

*Yes. Update the refresh rate option in the Settings menu. Keep in mind, this is a pretty heavy graphing library, so fast refresh rates may bog down your computer a lot.*

The channel I'm in has a slower chat so I never see more than a few emotes on the graph. What can I do?

*You can increase the window length option in the Settings menu to maintain a longer history of emotes. This will keep emotes on the graph for longer.*

 What is this *Point Decay* option that I found in the Settings menu?

*So, I made two modes for this: 'Sliding Window', which is the default, and 'Point Decay'. Sliding Window just shows a total count of each emote within the last 20 seconds (also modifiable). Point Decay is supposed to be something like, each emote has a 'health bar' that decays overtime with each emote sent adding 1 point back to its health. I couldn't really find the sweet spot in the decay rate, so it's not super great right now. As it stands, it's more of a fun addition than anything else.*