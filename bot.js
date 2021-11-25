const fs = require('fs');
const Discord = require('discord.js');
const { token } = require('./auth.json');
const { Intents } = require('discord.js');
const { prefix } = require('./config.json');
const database = require('./database.json');
const mysql = require('mysql');
const cooldowns = new Discord.Collection();

// Functions
const messageReport = require("./functions/messageReport");

// Set serverPrefix
let serverPrefix = prefix;

// Set Data for reportedMessage
const M_ID = "M_ID", C_ID = "C_ID";

// Set new Client
const client = new Discord.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
// Set new Collection for Commands
client.commands = new Discord.Collection();

// Read all (JS) files within the folder "commands"
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Once bot is online
client.once('ready', () => {
    client.user.setStatus('available')
    client.user.setPresence({
        game: {
            name: 'Reporting bad Users',
            type: "GAME",
        }
    });
    console.log('Bot is Ready!');
});

// Set Database Connection strings
let con = mysql.createConnection({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
});

// Check on connect if Con has an error if not, continue
con.connect(err => {
    if (err) {
        console.log("[mysql error]", err);
        throw err;
    }
    console.log("Connected to Database!");
});

// When there is a new message
client.on('messageCreate', message => {
    let serverID = message.guild.id;
    con.query(`SELECT * FROM server_settings WHERE serverID = ${serverID}`, (err, rows) => {
        if (err) throw err;
        if (rows.length !== 0) {
            serverPrefix = rows[0].prefix;
        }

        if (!message.content.startsWith(serverPrefix) || message.author.bot) return;

        const args = message.content.slice(serverPrefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`:x: please wait **${timeLeft.toFixed(0)}** more second(s) before using the \`${serverPrefix}${command.name}\` command again. :x:`);
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        try {
            command.execute(con, message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('there was an error trying to execute that command!');
        }
    })
});

client.on('interactionCreate', interaction => {

});

// When someone uses a reaction on messages
client.on('messageReactionAdd', async (messageData, user) => {
    let serverID = messageData.message.guildId;
    con.query(`SELECT * FROM server_settings WHERE serverID = ${serverID}`, (err, rows) => {
        let usedEmoji = messageData.emoji.name;
        let reportEmoji = "‼️";

        // fetch the message if it's not cached
        const message = !messageData.message.author ? messageData.message.fetch() : messageData.message;

        console.log(user)

        if (user.username !== "RepTools") {
            if (usedEmoji === reportEmoji) {
                console.log("IN")
                messageReport.messageReport(message, messageData, user, client, M_ID, C_ID, con)
            } else if (messageData.emoji.name === "✅" || messageData.emoji.name === "⚠" || messageData.emoji.name === "❌") {
                // if (messageData.message.channelId == client.channels.cache.find(channel => channel.name === "reports")) {
                //     messageDecision.messageDecision(messageData, user, client, M_ID, C_ID);
                // }
            }
        }
    })
});

client.login(token).then(console.log('Client login is DONE'));