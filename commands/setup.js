// Automatic make new Channel for Reports

module.exports = {
    name: 'setup',
    description: 'setup RepTools',
    aliases: ['s'],
    usage: '',
    cooldown: 5,
    guildOnly: true,
    args: true,
    execute(con, message, args) {
        let serverID = message.guild.id;
        if (message.guild.ownerId === message.author.id) {
            switch (args[0]) {
                case "prefix":
                    setPrefix(args[1]);
                    break;
                case "help":
                    getSetupInfo();
                    break;
                default:
                    message.reply(`There is no first argument called ${args[0]}! Use 'setup help args' to see all possible arguments!`);
            }

            function setPrefix(prefix) {
                con.query(`SELECT * FROM server_settings WHERE serverID = ${serverID}`, (err, rows) => {
                    if (err) throw err;
                    if (rows[0].length !== 0) {
                        con.query(`UPDATE server_settings SET prefix = '${prefix}' WHERE serverID = '${serverID}'`);
                        newPrefix();
                    } else {
                        con.query(`INSERT INTO server_settings (serverID, prefix) VALUES ("${serverID}", "${prefix}")`);
                        newPrefix();
                    }
                });
            }

            function newPrefix() {
                con.query(`SELECT * FROM server_settings WHERE serverID = ${serverID}`, (err, rows) => {
                    if (err) throw err;
                    message.reply(`RepTools Prefix is now '**${rows[0].prefix}**'`)
                });
            }

            function getSetupInfo() {

            }
        } else {
            message.reply(":x: You are not allowed to use this command! :x:")
        }
    },
};