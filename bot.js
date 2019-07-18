const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const client = new Discord.Client();
const fs = require('fs');
const path = require("path");

client.once('ready', () => {
	console.log('Ready!');
});

var map = new Map();
var players = new Map();
var items = new Map();
var default_stamina = 7;

client.on('message', message => {
	if (message.content.startsWith(`${prefix}`)) {
		var args = message.content.substring(prefix.length).split(' ');
		var cmd = args[0];

		// HOST COMMANDS -----------------------------------------------------------

		if (message.member.hasPermission('ADMINISTRATOR')) {
			switch(cmd) {
	
				// add a player to the db with stamina set to default
				case 'addplayer':
					let mentions = message.mentions.members;
	
					for (let [sf, member] of mentions) {
						players.set(member, [default_stamina, []]);
						message.channel.send(`Added player ${member.displayName}`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					}
				break;
	
	
				// remove a player from the database
				case 'removeplayer':
					let m = message.mentions.members;
	
					for (let [sf, member] of m) {
						players.delete(member);
						message.channel.send(`Removed player ${member.displayName}`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					}
				break;
	
				// list all players in the db
				case 'listplayers':
					for (let [player, stamina] of players) {
						message.channel.send(`${player}, ${stamina[0]} stamina, ${stamina[1].length} item(s)`)
					}
				break;
	
				// add a path; if channel not in db, add it
				case 'addpath':
					if (args.length == 3) {
						let channels = message.mentions.channels;
						let cur = message.channel;
						let direction = args[2]
	
						if (!map.has(cur.id)) {
							let mapTo = new Object();
							map.set(cur.id, mapTo);
						}
	
						for (let [sf, channel] of channels) {
							let paths = map.get(cur.id);
							paths[direction] = channel.id;
							map.set(cur.id, paths);
							message.channel.send(`${cur.name} linked to ${channel.name} in the ${direction} direction.`)
								.then(msg => {
									msg.delete(5000);
									message.delete(5000);
								})
								.catch(console.error);
						}
	
					} else {
						message.channel.send('Incorrect usage');
					}
				break;
	
				// remove a path from the map
				case 'removepath':
					if (args.length == 2) {
						let channels = message.mentions.channels;
						let cur = message.channel;
	
						if (map.has(cur.id)) {
							let paths = map.get(cur.id);
							let hasPath = false;

							let entries = Object.entries(paths);
	
							for (let [direction, channel] of entries) {
								if (channels.has(channel)) {
									delete paths[direction];
									map.set(cur.id, paths);
									message.channel.send(`Path to ${message.guild.channels.get(channel)} deleted.`)
										.then(msg => {
											msg.delete(5000);
											message.delete(5000);
										})
										.catch(console.error);
									hasPath = true;
								}							
							}
						} else {
							message.channel.send(`${cur.name} is not on the map.`)
						}
					} else {
						message.channel.send('Incorrect usage');
					}
					
				break;

				case 'additemuse':
					if (args.length == 3) {
						let channels = message.mentions.channels;
						let cur = message.channel;
						let item = args[2]
	
						if (!map.has(cur.id)) {
							let mapTo = new Object();
							map.set(cur.id, mapTo);
						}
	
						for (let [sf, channel] of channels) {
							let paths = map.get(cur.id);
							paths[item] = channel.id;
							map.set(cur.id, paths);
							message.channel.send(`${cur.name} linked to ${channel.name} through the use of ${item}.`)
								.then(msg => {
									msg.delete(5000);
									message.delete(5000);
								})
								.catch(console.error);
						}
	
					} else {
						message.channel.send('Incorrect usage');
					}
				break;

				case 'additem':
					if (args.length == 2) {
						let item = args[1];
						let cur = message.channel;

						items.set(cur.id, item);

						message.channel.send(`${item} added to channel ${cur.name}`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					} else {
						message.channel.send('Incorrect usage');
					}
				break;

				case 'listitems':
					for (let [ch, item] of items) {
						message.channel.send(`${item}, in channel ${message.guild.channels.get(ch).name}`);
					}
				break;
	
				// display all paths
				case 'map':
					for (let [id, paths] of map) {
						let channel = message.guild.channels.get(id);
						message.channel.send(`**${channel.name} has the following paths:**`)
	
						let entries = Object.entries(paths);

						for (let [direction, linked] of entries) {
							message.channel.send(`${direction}: ${message.guild.channels.get(linked)}`);
						}
					}
	
					message.channel.send(`**--END OF MAP--**`)
				break;
	
				case 'resetstamina':
					if (args.length == 2) {
						let m = message.mentions.members;

						for (let [sf, member] of m) {
							players.set(member, [default_stamina, players.get(member)[1]]);
							message.channel.send(`Reset stamina for player ${member.displayName}`)
								.then(msg => {
									msg.delete(5000);
									message.delete(5000);
								})
								.catch(console.error);
						}

					} else if (args.length == 1) {
						for (let [player, stamina] of players) {
							players.set(player, [default_stamina, stamina[1]]);
						}

						message.channel.send(`Reset stamina for all players`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					} else {
						message.channel.send('Incorrect usage');
					}
					
				break;
	
				// change the default stamina for all players
				case 'changedefaultstamina':
					if (!isNaN(args[1])) {
						if (args.length == 2) {
							default_stamina = +args[1];
							message.channel.send(`Default stamina changed to ${default_stamina}`)
								.then(msg => {
									msg.delete(5000);
									message.delete(5000);
								})
								.catch(console.error);
						} else {
							message.channel.send('Incorrect usage');
						}
					} else {
						message.channel.send(`${args[1]} is not a number.`);
					}
				break;

				case 'savemap':
					let mapObj = new Object();

					for (let [id, paths] of map) {
						mapObj[id] = paths;
					}

					let mapStr = JSON.stringify(mapObj);

					fs.writeFile(`${message.guild.id}_map.json`, mapStr, err => {
						if (err) {
							console.log(err);
						}
					});

					let itemsObj = new Object();

					for (let [id, item] of items) {
						itemsObj[id] = item;
					}

					let itemsStr = JSON.stringify(itemsObj);

					fs.writeFile(`${message.guild.id}_items.json`, itemsStr, err => {
						if (err) {
							console.log(err);
						}
					});


				break;

				case 'loadmap':
					if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_map.json`))) {
						let str = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_map.json`));
						let obj = JSON.parse(str);

						let loaded = new Map();

						for (let k of Object.keys(obj)) {
							loaded.set(k, obj[k]);
						}

						map = loaded;
						
					} else {
						message.channel.send("No map file found for this server.");
					}

					if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_items.json`))) {
						let itemsStr = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_items.json`));
						let itemsObj = JSON.parse(itemsStr);

						let itemsLoaded = new Map();

						for (let k of Object.keys(itemsObj)) {
							itemsLoaded.set(k, itemsObj[k]);
						}

						items = itemsLoaded;
						
					} else {
						message.channel.send("No items file found for this server.");
					}		
				break;
			}
		} 

		// PLAYER COMMANDS ---------------------------------------------------------

		switch (cmd) {

			// ping
			case 'ping':
				message.channel.send('Hey, listen!');
			break;

			// main player command; adds permissions to the channel in direction,
			// removes them from current channel, [and deletes their messages]
			case 'move':
				if (args.length == 2) {
					let direction = args[1]
					let cur = message.channel;
					let player = message.member;
					
					if (players.has(player)) {
						if (players.get(player)[0] > 0) {
							if (map.has(cur.id)) {
								let paths = map.get(cur.id);
	
								if (paths.hasOwnProperty(direction)) {
									let destination = message.guild.channels.get(paths[direction]);

									players.set(player, [players.get(player)[0] - 1, players.get(player)[1]]);

									destination.overwritePermissions(player, {
										VIEW_CHANNEL: true,
										SEND_MESSAGES: true,
										READ_MESSAGE_HISTORY: true
									})
									.then(() => {
										message.channel.send(`${player} successfully moved ${direction}`)
											.then(msg => {
												msg.delete(5000);
												message.delete(5000);
											})
											.catch(console.error);

										cur.permissionOverwrites.get(player.id).delete();
									})
									.catch(console.error);
									
								} else {
									message.channel.send(`You cannot travel towards direction ${direction}`);
								}
							} else {
								message.channel.send(`${cur} is not on the map`);
							}
						} else {
							message.channel.send('You have no more stamina left!');
						}
					} else {
						message.channel.send(`${player} is not in database`);
					}
				} else {
					message.channel.send('Incorrect usage');
				}

			break;

			case 'useitem':
				if (args.length == 2) { 
					let item = args[1];

					if (players.has(message.member)) {
						let itemExists = false;
						let player = message.member;
						let cur = message.channel;
						let paths = map.get(message.channel.id);

						if (paths.hasOwnProperty(item)) {
							let destination = message.guild.channels.get(paths[item]);

							if (players.get(player)[1].includes(item)) {
								let inventory = players.get(player)[1];

								players.set(player, [players.get(player)[0], inventory.splice(inventory.indexOf(item), 1)]);

								destination.overwritePermissions(player, {
									VIEW_CHANNEL: true,
									SEND_MESSAGES: true,
									READ_MESSAGE_HISTORY: true
								})
								.then(() => {
									message.channel.send(`${player} successfully used ${item}`)
										.then(msg => {
											msg.delete(5000);
											message.delete(5000);
										})
										.catch(console.error);

									cur.permissionOverwrites.get(player.id).delete();
								})
								.catch(console.error);
							} else {
								message.channel.send(`${item} is not in your inventory`);
							}
						} else {
							message.channel.send(`${item} cannot be used here`);
						}
					} else {
						message.channel.send(`${message.member} is not in database`);
					}
				} else {
					message.channel.send('Incorrect usage');
				}
				
			break;

			case 'takeitem':
				let cur = message.channel;

				if (players.has(message.member)) {
					let inventory = players.get(message.member)[1];

					if (items.has(cur.id)) {
						inventory.push(items.get(cur.id));
						players.set(message.member, [players.get(message.member)[0], inventory]);

						message.channel.send(`${items.get(cur.id)} added to inventory.`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					}
				} else {
					message.channel.send(`${message.member} is not in database`);
				}
				
			break;

			// lists the player's stamina
			case 'stamina':
				if (players.has(message.member)) {
					message.channel.send(`You have ${players.get(message.member)[0]} stamina remaining`)
						.then(msg => {
							msg.delete(5000);
							message.delete(5000);
						})
						.catch(console.error);
				} else {
					message.channel.send(`${message.member} is not in database`);
				}
			break;

			case 'inventory':
				if (players.has(message.member)) {
					if (players.get(message.member)[1].length == 0) {
						message.channel.send(`Your inventory is empty!`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					} else {
						message.channel.send(`You have ${players.get(message.member)[1].toString()} in your inventory`)
							.then(msg => {
								msg.delete(5000);
								message.delete(5000);
							})
							.catch(console.error);
					}
				} else {
					message.channel.send(`${message.member} is not in database`);
				}
			break;
		}
	}
});

client.login(token);