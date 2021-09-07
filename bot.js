const Discord = require('discord.js');
const {token} = require('./config.json');
const prefix = 'n.';
const client = new Discord.Client();
const fs = require('fs');
const path = require("path");

client.once('ready', () => {
	console.log('Ready!');
});

// messy code below

var map = new Map();
var players = new Map();
var items = new Map();
var currency_map = new Map();
var default_stamina = 15;
var default_currency = 0;
var currency_name = "coins";
var home = "";
var item_array = [];
var last_server = "";

function run_command(message) {
	var args = message.content.substring(prefix.length).split(' ');
	var cmd = args[0];

	// HOST COMMANDS -----------------------------------------------------------

	if (message.member.hasPermission('ADMINISTRATOR')) {
		switch(cmd) {

			// add a player to the db with stamina set to default
			// {player id: [current stamina, [inventory], default stamina, currency], ...}

			case 'addplayer':
				let mentions = message.mentions.members;

				for (let [sf, member] of mentions) {
					if (!players.has(member.id)) {
						players.set(member.id, [default_stamina, [], default_stamina, default_currency]);
						message.channel.send(`Added player ${member.displayName}`);
					} else {
						message.channel.send(`Player ${member.displayName} already in database`);
					}
				}
			break;


			// remove a player from the database
			case 'removeplayer':
				let m = message.mentions.members;

				for (let [sf, member] of m) {
					if (players.has(member.id)) {
						players.delete(member.id);
						message.channel.send(`Removed player ${member.displayName}`);
					} else {
						message.channel.send(`Player ${member.displayName} is not in database`);
					}
				}
			break;

			// list all players in the db
			case 'listplayers':
				for (let [player, stamina] of players) {
					if (message.guild.members.cache.has(player)) {
						message.channel.send(`${message.guild.members.cache.get(player).displayName}, ${stamina[0]} of ${stamina[2]} stamina, ${stamina[1].length} item(s), ${stamina[3]} ${currency_name}`);
					} else {
						message.channel.send(`Player not in server (ID ${player}), ${stamina[0]} of ${stamina[2]} stamina, ${stamina[1].length} item(s), ${stamina[3]} ${currency_name}`);
					}
				}

				message.channel.send(`**--END OF PLAYERS--**`);
			break;

			// add a path; if channel not in db, add it
			// {channel id: {direction: [destination channel id, cost], ...}, ...}
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
						paths[direction] = [channel.id, 0];
						map.set(cur.id, paths);
						message.channel.send(`${cur.name} linked to ${channel.name} in the ${direction} direction.`)
							.then(msg => {
								msg.delete({timeout: 5000});
								message.delete({timeout: 5000});
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
							if (channels.has(channel[0])) {
								delete paths[direction];
								map.set(cur.id, paths);
								message.channel.send(`Path to ${message.guild.channels.cache.get(channel[0])} deleted.`)
									.then(msg => {
										msg.delete({timeout: 5000});
										message.delete({timeout: 5000});
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

			// add an item use path to current channel
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
						paths[item] = [channel.id, 0];
						map.set(cur.id, paths);
						message.channel.send(`${cur.name} linked to ${channel.name} through the use of ${item}.`)
							.then(msg => {
								msg.delete({timeout: 5000});
								message.delete({timeout: 5000});
							})
							.catch(console.error);
					}

				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// add item to channel for player pickup
			case 'additem':
				if (args.length == 2) {
					let item = args[1];
					let cur = message.channel;

					items.set(cur.id, item);

					message.channel.send(`${item} added to channel ${cur.name}`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// remove item from channel
			case 'removeitem':
				if (args.length == 1) {
					let cur = message.channel;

					if (items.has(cur.id)) {
						let item = items.get(cur.id);
						items.delete(cur.id);

						message.channel.send(`${item} removed from channel ${cur.name}`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
					}

				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// remove item from player's inventory
			case 'removefrominventory':
				if (args.length == 3) {
					let mentions = message.mentions.members;
					let item = args[1];

					for (let [sf, member] of mentions) {
						if (players.get(member.id)[1].includes(item)) {
							let inventory = players.get(member.id)[1];
							inventory.splice(inventory.indexOf(item), 1);
							players.set(member.id, [players.get(member.id)[0], inventory, players.get(member.id)[2], players.get(member.id)[3]]);
							message.channel.send(`Removed ${item} from ${member.displayName}'s inventory`);
						} else {

						}
					}
				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// list all items currently on map
			case 'listitems':
				for (let [ch, item] of items) {
					message.channel.send(`${item}, in channel ${message.guild.channels.cache.get(ch).name}`);
				}

				message.channel.send(`**--END OF ITEMS--**`);
			break;

			// display all paths
			case 'map':
				for (let [id, paths] of map) {
					let channel = message.guild.channels.cache.get(id);
					message.channel.send(`**${channel} has the following paths:**`)

					let entries = Object.entries(paths);

					for (let [direction, linked] of entries) {
						message.channel.send(`${direction}: ${message.guild.channels.cache.get(linked[0])}, ${linked[1]} ${currency_name}`);
					}
				}

				message.channel.send(`**--END OF MAP--**`);
			break;

			// list paths from the current channel
			case 'getpaths':
				let cur = message.channel;
				
				if (map.has(cur.id)) {
					let paths = map.get(cur.id);

					message.channel.send(`**${cur.name} has the following paths:**`)

					let entries = Object.entries(paths);

					for (let [direction, linked] of entries) {
						message.channel.send(`${direction}: ${message.guild.channels.cache.get(linked[0])}, ${linked[1]} ${currency_name}`);
					}

					message.channel.send(`**--END OF PATHS--**`)
				} else {
					message.channel.send(`Channel ${cur.name} does not have any paths.`)
				}

			break;

			// reset stamina to default for all players or specific player
			case 'resetstamina':
				if (args.length == 2) {
					let m = message.mentions.members;

					for (let [sf, member] of m) {
						if (players.has(member.id)) {
							players.set(member.id, [players.get(member.id)[2], players.get(member.id)[1], players.get(member.id)[2], players.get(member.id)[3]]);
							message.channel.send(`Reset stamina for player ${member.displayName}`);
						} else {
							message.channel.send(`${member.displayName} is not in database`);
						}
					}

				} else if (args.length == 1) {
					for (let [player, stamina] of players) {
						players.set(player, [stamina[2], stamina[1], stamina[2], stamina[3]]);
					}

					message.channel.send(`Reset stamina for all players`);
				} else {
					message.channel.send('Incorrect usage');
				}
				
			break;

			// change the default stamina of all players or specific players
			case 'changedefaultstamina':
				if (!isNaN(args[1])) {
					if (args.length == 2) {
						default_stamina = +args[1];
						for (let [player, stamina] of players) {
							players.set(player, [stamina[0], stamina[1], default_stamina, stamina[3]]);
						}
						message.channel.send(`Default stamina for all players changed to ${default_stamina}`);
					} else if (args.length == 3) {
						let m = message.mentions.members;

						for (let [sf, member] of m) {
							if (players.has(member.id)) {
								players.set(member.id, [players.get(member.id)[0], players.get(member.id)[1], +args[1], players.get(member.id)[3]]);
								message.channel.send(`Default stamina for player ${member.displayName} changed to ${args[1]}`);
							} else {
								message.channel.send(`${member.displayName} is not in database`);
							}
						}
					} else {
						message.channel.send('Incorrect usage');
					}
				} else {
					message.channel.send(`${args[1]} is not a number.`);
				}
			break;

			// set currency for a player
			case 'setcurrency':
				if (args.length == 3) {
					let mentions = message.mentions.members;
					let amount = args[1];

					for (let [sf, member] of mentions) {
						players.set(member.id, [players.get(member.id)[0], players.get(member.id)[1], players.get(member.id)[2], amount]);
						message.channel.send(`Changed ${member.displayName}'s ${currency_name} to ${amount}`);
					}
				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// set currency name
			case 'setcurrencyname':
				if (args.length == 2) {
					currency_name = args[1];
					message.channel.send(`Changed currency name to ${args[1]}`);
				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// add pickup-able currency to the channel
			case 'addcurrency':
				if (args.length == 2) {
					let amount = +args[1];
					let cur = message.channel;

					currency_map.set(cur.id, [amount, []]);

					message.channel.send(`${amount} ${currency_name} assigned to channel ${cur.name}`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			case 'removecurrency':
				if (args.length == 1) {
					let cur = message.channel;

					if (currency_map.has(cur.id)) {
						currency_map.delete(cur.id);
						message.channel.send(`Currency cleared from channel ${cur.name}`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
					}
				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			// add a path with a currency cost
			case 'addcurrencypath':
				if (args.length == 4) {
					let channels = message.mentions.channels;
					let cur = message.channel;
					let direction = args[2];
					let cost = args[3];

					if (!map.has(cur.id)) {
						let mapTo = new Object();
						map.set(cur.id, mapTo);
					}

					for (let [sf, channel] of channels) {
						let paths = map.get(cur.id);
						paths[direction] = [channel.id, cost];
						map.set(cur.id, paths);
						message.channel.send(`${cur.name} linked to ${channel.name} in the ${direction} direction with cost of ${cost} ${currency_name}.`)
							.then(msg => {
								msg.delete({timeout: 5000});
								message.delete({timeout: 5000});
							})
							.catch(console.error);
					}

				} else {
					message.channel.send('Incorrect usage');
				}
			break;

			case 'currencymap':
				for (let [id, currency_data] of currency_map) {
					let channel = message.guild.channels.cache.get(id);
					message.channel.send(`**${channel} has ${currency_data[0]} ${currency_name}**, and has been visited by ${currency_data[1].length} player(s)`)
				}

				message.channel.send(`**--END OF MAP--**`);
			break;
			
			// set the home channel for the map
			case 'sethome':
				let current = message.channel;

				if (map.has(current.id)) {
					home = current.id;

					message.channel.send(`Home set to ${current.name}`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
				} else {
					message.channel.send(`Home channel must be on the map`);
				}
			break;

			// save map data to json file
			case 'savemap':
				let mapObj = new Object();

				for (let [id, paths] of map) {
					mapObj[id] = paths;
				}

				let mapStr = JSON.stringify(mapObj);

				fs.writeFile(`${message.guild.id}_map_data.json`, mapStr, err => {
					if (err) {
						console.log(err);
					}
				});

				message.channel.send(`Map successfully saved`);

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

				message.channel.send(`Items successfully saved`);


			break;

			// load map data for current server from json file, if exists
			case 'loadmap':
				if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_map_data.json`))) {
					let str = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_map_data.json`));
					let obj = JSON.parse(str);

					let loaded = new Map();

					for (let k of Object.keys(obj)) {
						loaded.set(k, obj[k]);
					}

					map = loaded;

					message.channel.send(`Map successfully loaded`);
					
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
					item_array = Array.from(items.values());

					message.channel.send(`Items successfully loaded`);
					
				} else {
					message.channel.send("No items file found for this server.");
				}
			break;

			// save player data to json file
			case 'saveplayers':
				let playObj = new Object();

				for (let [id, properties] of players) {
					playObj[id] = properties;
				}

				let playStr = JSON.stringify(playObj);

				fs.writeFile(`${message.guild.id}_player_data.json`, playStr, err => {
					if (err) {
						console.log(err);
					}
				});

				message.channel.send(`Players successfully saved`);
			break;

			// load player data for current server from json file, if exists
			case 'loadplayers':
				if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_player_data.json`))) {
					let playStr = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_player_data.json`));
					let playObj = JSON.parse(playStr);

					let playersLoaded = new Map();

					for (let k of Object.keys(playObj)) {
						playersLoaded.set(k, playObj[k]);
					}

					players = playersLoaded;

					message.channel.send(`Players successfully loaded`);
					
				} else {
					message.channel.send("No players file found for this server.");
				}
			break;

			// set items to array data
			case 'itemarray':
				item_array = Array.from(items.values());
				message.channel.send(`${item_array.toString}`);
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
		// removes them from current channel
		case 'move':
			if (args.length == 2) {
				let direction = args[1]
				let cur = message.channel;
				let player = message.member;
				
				if (players.has(player.id)) {
					if (players.get(player.id)[0] > 0) {
						if (map.has(cur.id)) {
							let paths = map.get(cur.id);

							if (paths.hasOwnProperty(direction)) {
								if (item_array.includes(direction)) {
									message.channel.send(`You cannot travel towards direction ${direction}`)
										.then(msg => {
											msg.delete({timeout: 5000});
											message.delete({timeout: 5000});
										})
										.catch(console.error);
								} else {
									let cost = paths[direction][1];

									if (cost > players.get(player.id)[3]) {
										message.channel.send(`You do not have enough ${currency_name} to travel towards direction ${direction}`)
									} else {
										let destination = message.guild.channels.cache.get(paths[direction][0]);

										players.set(player.id, [players.get(player.id)[0] - 1, players.get(player.id)[1], players.get(player.id)[2], players.get(player.id)[3] - cost]);

										destination.createOverwrite(player, {
											VIEW_CHANNEL: true,
											SEND_MESSAGES: true,
											READ_MESSAGE_HISTORY: true
										})
										.then(() => {
											message.channel.send(`${player} successfully moved ${direction}`)
												.then(msg => {
													msg.delete({timeout: 5000});
													message.delete({timeout: 5000});
												})
												.catch(console.error);

											cur.permissionOverwrites.get(player.id).delete();
										})
										.catch(console.error);
									}
								}
								
							} else {
								message.channel.send(`You cannot travel towards direction ${direction}`)
									.then(msg => {
										msg.delete({timeout: 5000});
										message.delete({timeout: 5000});
									})
									.catch(console.error);
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

		// moves similar to move command but tests if player has item in inventory
		case 'useitem':
			if (args.length == 2) { 
				let item = args[1];

				if (players.has(message.member.id)) {
					let itemExists = false;
					let player = message.member;
					let cur = message.channel;

					if (map.has(cur.id)) {
						let paths = map.get(cur.id);

						if (paths.hasOwnProperty(item)) {
							let destination = message.guild.channels.cache.get(paths[item][0]);

							if (players.get(player.id)[1].includes(item)) {
								// let inventory = players.get(player.id)[1];

								// players.set(player.id, [players.get(player.id)[0], inventory.splice(inventory.indexOf(item), 1), players.get(player.id)[2], players.get(player.id)[3]]);

								destination.createOverwrite(player, {
									VIEW_CHANNEL: true,
									SEND_MESSAGES: true,
									READ_MESSAGE_HISTORY: true
								})
								.then(() => {
									message.channel.send(`${player} successfully used ${item}`)
										.then(msg => {
											msg.delete({timeout: 5000});
											message.delete({timeout: 5000});
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
						message.channel.send(`${cur} is not on the map`);
					}
				} else {
					message.channel.send(`${message.member} is not in database`);
				}
			} else {
				message.channel.send('Incorrect usage');
			}
			
		break;

		// adds item in channel to player's inventory
		case 'takeitem':

			if (players.has(message.member.id)) {
				let cur = message.channel;
				let inventory = players.get(message.member.id)[1];

				if (items.has(cur.id)) {
					inventory.push(items.get(cur.id));
					players.set(message.member.id, [players.get(message.member.id)[0], inventory, players.get(message.member.id)[2], players.get(message.member.id)[3]]);

					message.channel.send(`${items.get(cur.id)} added to inventory.`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
				}
			} else {
				message.channel.send(`${message.member} is not in database`);
			}
			
		break;

		// transfers an item to another player
		// can also be used by admin to directly give a player an item
		case 'giveitem':
			if (args.length == 3) {
				let item = args[1];
				let mentions = message.mentions.members;

				if (players.has(message.member.id)) {
					let player = message.member;
					let inventory = players.get(player.id)[1];

						for (let [sf, member] of mentions) {
							if (players.has(member.id)) {
								let other_inventory = players.get(member.id)[1];
								if (inventory.includes(item)) {
									if (other_inventory.includes(item)) {
										message.channel.send(`${member} already has item ${item}!`);
									} else {
										inventory.splice(inventory.indexOf(item), 1);
										players.set(player.id, [players.get(player.id)[0], inventory, players.get(player.id)[2], players.get(player.id)[3]]);
										other_inventory.push(item);
										players.set(member.id, [players.get(member.id)[0], other_inventory, players.get(member.id)[2], players.get(member.id)[3]]);

										message.channel.send(`${player} gave ${item} to ${member}`)
											.then(msg => {
												msg.delete({timeout: 5000});
												message.delete({timeout: 5000});
											})
											.catch(console.error);
									}
								} else {
									message.channel.send(`You do not have item ${item}!`);
								}
							} else {
								message.channel.send(`${member} is not in database`);
							}
						}
				} else if (message.member.hasPermission('ADMINISTRATOR')) {
					for (let [sf, member] of mentions) {
						if (players.has(member.id)) {
							let other_inventory = players.get(member.id)[1];

							if (other_inventory.includes(item)) {
								message.channel.send(`${member} already has item ${item}!`);
							} else {
								other_inventory.push(item);
								players.set(member.id, [players.get(member.id)[0], other_inventory, players.get(member.id)[2], players.get(member.id)[3]]);

								message.channel.send(`Gave ${item} to ${member}`)
									.then(msg => {
										msg.delete({timeout: 5000});
										message.delete({timeout: 5000});
									})
									.catch(console.error);
							}
						} else {
							message.channel.send(`${member} is not in database`);
						}
					}
				} else {
					message.channel.send("You do not have permission to use this command");
				}
			} else {
				message.channel.send("Incorrect usage, correct syntax is ``n.giveitem [item] [player tag]``");
			}
		break;

		// takes currency in the channel
		case 'takecurrency':
			if (players.has(message.member.id)) {
				let cur = message.channel;

				if (currency_map.has(cur.id)) {
					let amount = currency_map.get(cur.id)[0];
					let used = currency_map.get(cur.id)[1];

					if (used.includes(message.member.id)) {
						message.channel.send(`You've already taken these ${currency_name}!`);
					} else {
						players.set(message.member.id, [players.get(message.member.id)[0], players.get(message.member.id)[1], players.get(message.member.id)[2], players.get(message.member.id)[3] + amount]);

						used.push(message.member.id);
						currency_map[cur.id] = [amount, used];

						message.channel.send(`${amount} ${currency_name} added to wallet.`)
							.then(msg => {
								msg.delete({timeout: 5000});
								message.delete({timeout: 5000});
							})
							.catch(console.error);
					}
				}
			} else {
				message.channel.send(`${message.member} is not in database`);
			}
		break;
		
		// gives amount of currency to another player
		case 'givecurrency':
			if (args.length == 3) {
				let amount = +args[1];
				let mentions = message.mentions.members;

				if (players.has(message.member.id)) {
					let player = message.member;
					let cur_amount = players.get(player.id)[3];

					for (let [sf, member] of mentions) {
						if (players.has(member.id)) {
							let other_amount = players.get(member.id)[3];

							if (cur_amount >= amount) {
								players.set(player.id, [players.get(player.id)[0], players.get(player.id)[1], players.get(player.id)[2], players.get(player.id)[3] - amount]);
								players.set(member.id, [players.get(member.id)[0], players.get(member.id)[1], players.get(member.id)[2], +(players.get(member.id)[3] + amount)]);

								message.channel.send(`${player} gave ${amount} ${currency_name} to ${member}`)
									.then(msg => {
										msg.delete({timeout: 5000});
										message.delete({timeout: 5000});
									})
									.catch(console.error);
							} else {
								message.channel.send(`You don't have enough ${currency_name} for that!`)
							}
						} else {
							message.channel.send(`${member} is not in database`);
						}
					}
				} else {
					message.channel.send("You do not have permission to use this command");
				}
			} else {
				message.channel.send("Incorrect usage, correct syntax is ``n.givecurrency [amount] [player tag]``");
			}
		break;

		// moves player to the home channel, if set
		case 'home':

			if (players.has(message.member.id)) {
				if (map.has(home)) {
					let cur = message.channel;
					let player = message.member;
					let destination = message.guild.channels.cache.get(home);

					if (players.get(player.id)[0] >= 3) {

						players.set(player.id, [players.get(player.id)[0] - 3, players.get(player.id)[1], players.get(player.id)[2], players.get(player.id)[3]]);

						destination.createOverwrite(player, {
							VIEW_CHANNEL: true,
							SEND_MESSAGES: true,
							READ_MESSAGE_HISTORY: true
						})
						.then(() => {
							message.channel.send(`${player} successfully returned to ${message.guild.channels.cache.get(home).name}`)
								.then(msg => {
									msg.delete({timeout: 5000});
									message.delete({timeout: 5000});
								})
								.catch(console.error);

							cur.permissionOverwrites.get(player.id).delete();
						})
						.catch(console.error);

					} else {
						message.channel.send("Not enough stamina!");
					}
				} else {
					message.channel.send("Home incorrectly set up");
				}
			} else {
				message.channel.send(`${message.member} is not in database`);
			}
		break;

		// lists the player's stamina
		case 'stamina':
			if (players.has(message.member.id)) {
				message.channel.send(`You have ${players.get(message.member.id)[0]} stamina remaining`)
					.then(msg => {
						msg.delete({timeout: 5000});
						message.delete({timeout: 5000});
					})
					.catch(console.error);
			} else {
				message.channel.send(`${message.member} is not in database`);
			}
		break;

		// lists player's inventory
		case 'inventory':
			if (players.has(message.member.id)) {
				if (players.get(message.member.id)[1].length == 0) {
					message.channel.send(`Your inventory is empty!`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
				} else {
					message.channel.send(`You have ${players.get(message.member.id)[1].toString()} in your inventory`)
						.then(msg => {
							msg.delete({timeout: 5000});
							message.delete({timeout: 5000});
						})
						.catch(console.error);
				}
			} else if (message.member.hasPermission('ADMINISTRATOR')) {
				let mentions = message.mentions.members;

				for (let [sf, member] of mentions) {
					if (players.has(member.id)) {
						if (players.get(member.id)[1].length == 0) {
							message.channel.send(`Player ${member.displayName}'s inventory is empty!`);
						} else {
							message.channel.send(`Player ${member.displayName} has ${players.get(member.id)[1].toString()} in their inventory`);
						}
					} else {
						message.channel.send(`${member} is not in database`);
					}
				}
			
			} else {
				message.channel.send(`${message.member} is not in database`);
			}
		break;

		// lists the player's currency amount
		case 'currency':
			if (players.has(message.member.id)) {
				message.channel.send(`You currently have ${players.get(message.member.id)[3]} ${currency_name}`)
					.then(msg => {
						msg.delete({timeout: 5000});
						message.delete({timeout: 5000});
					})
					.catch(console.error);
			} else {
				message.channel.send(`${message.member} is not in database`);
			}
		break;
	}
}

function autoload(message, callback) {
	if (message.guild.id != last_server) {
		last_server = message.guild.id;

		if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_map_data.json`))) {
			let str = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_map_data.json`));
			let obj = JSON.parse(str);

			let loaded = new Map();

			for (let k of Object.keys(obj)) {
				loaded.set(k, obj[k]);
			}

			map = loaded;

			// message.channel.send(`Map successfully loaded`);
			
		} else {
			map = new Map();
		}

		if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_items.json`))) {
			let itemsStr = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_items.json`));
			let itemsObj = JSON.parse(itemsStr);

			let itemsLoaded = new Map();

			for (let k of Object.keys(itemsObj)) {
				itemsLoaded.set(k, itemsObj[k]);
			}

			items = itemsLoaded;
			item_array = Array.from(items.values());

			// message.channel.send(`Items successfully loaded`);

		} else {
			items = new Map();
			item_array = [];
		}

		if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_player_data.json`))) {
			let playStr = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_player_data.json`));
			let playObj = JSON.parse(playStr);

			let playersLoaded = new Map();

			for (let k of Object.keys(playObj)) {
				playersLoaded.set(k, playObj[k]);
			}

			players = playersLoaded;

			// message.channel.send(`Players successfully loaded`);
			
		} else {
			players = new Map();
		}

		if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_currency_map.json`))) {
			let curStr = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_currency_map.json`));
			let curObj = JSON.parse(curStr);

			let curLoaded = new Map();

			for (let k of Object.keys(curObj)) {
				curLoaded.set(k, curObj[k]);
			}

			currency_map = curLoaded;

			// message.channel.send(`Currency map successfully loaded`);
			
		} else {
			currency_map = new Map();
		}

		if (fs.existsSync(path.resolve(__dirname, `${message.guild.id}_server_data.json`))) {
			let dataStr = fs.readFileSync(path.resolve(__dirname, `${message.guild.id}_server_data.json`));
			let dataObj = JSON.parse(dataStr);

			if (dataObj.hasOwnProperty("default_stamina")) {
				default_stamina = +dataObj["default_stamina"];
			} else {
				default_stamina = 15;
			}

			if (dataObj.hasOwnProperty("default_currency")) {
				default_currency = +dataObj["default_currency"];
			} else {
				default_currency = 0;
			}
			
			if (dataObj.hasOwnProperty("currency_name")) {
				currency_name = dataObj["currency_name"];
			} else {
				currency_name = "coins";
			}

			if (dataObj.hasOwnProperty("home")) {
				home = dataObj["home"];
			} else {
				home = "";
			}

			// message.channel.send(`Server data successfully loaded`);
			
		} else {
			default_stamina = 15;
			default_currency = 0;
			currency_name = "coins";
			home = "";
		}
	} else {
		// message.channel.send(`Same server!`);
	}

	callback();
	
}

function autosave(message) {
	let mapObj = new Object();

	for (let [id, paths] of map) {
		mapObj[id] = paths;
	}

	let mapStr = JSON.stringify(mapObj);

	fs.writeFile(`${message.guild.id}_map_data.json`, mapStr, err => {
		if (err) {
			console.log(err);
		}
	});

	// message.channel.send(`Map successfully saved`);

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

	// message.channel.send(`Items successfully saved`);

	let playObj = new Object();

	for (let [id, properties] of players) {
		playObj[id] = properties;
	}

	let playStr = JSON.stringify(playObj);

	fs.writeFile(`${message.guild.id}_player_data.json`, playStr, err => {
		if (err) {
			console.log(err);
		}
	});

	// message.channel.send(`Players successfully saved`);

	let curObj = new Object();

	for (let [id, properties] of currency_map) {
		curObj[id] = properties;
	}

	let curStr = JSON.stringify(curObj);

	fs.writeFile(`${message.guild.id}_currency_map.json`, curStr, err => {
		if (err) {
			console.log(err);
		}
	});

	// message.channel.send(`Currency map successfully saved`);

	let dataObj = new Object();

	dataObj["default_stamina"] = default_stamina;
	dataObj["default_currency"] = default_currency;
	dataObj["currency_name"] = currency_name;
	dataObj["home"] = home;

	let dataStr = JSON.stringify(dataObj);

	fs.writeFile(`${message.guild.id}_server_data.json`, dataStr, err => {
		if (err) {
			console.log(err);
		}
	});

	// message.channel.send(`Players successfully saved`);
}

// MAIN LOOP ---------------------------------------------------------------

client.on('message', message => {
	if (message.content.startsWith(`${prefix}`)) {

		autoload(message, () => {
			run_command(message);
			autosave(message);
		})

	}
});

client.login(token);