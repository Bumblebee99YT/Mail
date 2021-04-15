const { MessageEmbed, Client, Collection} = require('discord.js');
class ModmailClient extends Client {
    constructor() {
        super();
        /*
        Dependencies
        */
       this.path = require('path');
       this.discord = require('discord.js');
       this.fs = require('fs');
       /*
       Collections
       */
      this.commands = new Collection();
      this.threads = new Collection();
      /*
      Constants
      */
     this.prefix = "m.";
     this.category = "831967405449805855";
     this.role = "812009521522278430";
    }
    commandHandler(path) {
        this.fs.readdirSync(this.path.normalize(path)).map((f) => {
            const File = require(this.path.join(__dirname, `..`, path, f));
            this.commands.set(File.name, File);
        })
    }
    getCommand(cmd) {
        return this.commands.has(cmd) ? this.commands.get(cmd) : false;
    }
    start(token, path) {
        this.commandHandler(path);
        this.login(token);
        this.on('ready', () => {
            console.log("Im now online!")
        });
        this.on('message', async(message) => {
            if(message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(this.prefix)) return;
            const args = message.content.slice(this.prefix.length).trim().split(/ +/g);
            const cmd = args.shift().toLowerCase();
            const command = this.getCommand(cmd);
            if(command) return command.run(this, message, args).catch(console.error);
        });
    };
    embed(data, message) {
        return new MessageEmbed(data).setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, format: "png" }));
    }
};
module.exports = ModmailClient;