var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

var players = new Array();
var map = new Map();

bot.on('message', function (user, userID, channelID, message, evt) {

    if (message.substring(0, 2) == 'n.') {
        var args = message.substring(2).split(' ');
        var cmd = args[0];
       
        // args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;

            case 'test':
                bot.sendMessage({
                    to: channelID,
                    message: evt
                });
            break;
            
            case 'getchannel':
                bot.sendMessage({
                    to: channelID,
                    message: channelID
                });
            break;

            case 'addplayer':
                if (args.length > 1) {
                    bot.sendMessage({
                        to: channelID,
                        message: args[1]
                    });
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Player argument needed'
                    });
                }
            break;

         }
     }
});