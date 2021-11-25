const Discord = require('discord.js');
const { prefix } = require('./../config.json');
const reportEmbed = new Discord.MessageEmbed();

let serverPrefix = prefix;

exports.messageReport = function(message, messageData, userID, client, M_ID, C_ID, con) {
    let serverID = messageData.message.guildId;
    con.query(`SELECT * FROM server_settings WHERE serverID = ${serverID}`, (err, rows) => {
        if (err) throw err;
        if (rows.length !== 0) {
            serverPrefix = rows[0].prefix;
        }
        const reportChannel = client.channels.cache.find(channel => channel.name === rows[0].reportChannel);
        let reportedMessage = message.content;

        if ((reportedMessage === null || reportedMessage === undefined || reportedMessage === "")) {
            reportedMessage = "Click on the 'GoTo' link to see the message!";
        } else if (reportedMessage.length > 1000) {
            reportedMessage = reportedMessage.substring(0, 500) + "...";
        }

        reportEmbed.setColor('#c20000')
        reportEmbed.setTitle('**Tools - Reports**');
        reportEmbed.setFooter(`For more info on Reports type: ${prefix}reports help`);

        reportEmbed.addField(`Reported by`, `<@${userID.id}>`, true);
        reportEmbed.addField(`GoTo`, `https://discord.com/channels/` + messageData.message.guildId + `/` + messageData.message.channelId + `/` + messageData.message.id, true);
        reportEmbed.addField(`Message`, reportedMessage, false);
        reportEmbed.addField(M_ID, messageData.message.id, true);
        reportEmbed.addField(C_ID, messageData.message.channelId, true);

        if (reportChannel !== undefined) {
            reportChannel.send({embeds: [reportEmbed]}).then(embedMessage => {
                embedMessage.react("✅");
                embedMessage.react("⚠");
                embedMessage.react("❌");
            });
        } else {
            console.log(reportChannel)
        }
    });
}