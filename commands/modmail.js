const Client = require('../structures/Client');
const { Message, NewsChannel } = require('discord.js');
module.exports = {
    name: `modmail`,

    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */

    run: async(client, message, args) => {
        if(client.threads.has(`${message.author.id}`)) return message.channel.send(`You already have a ticket open...`);
        const Channel = message.guild.channels.cache.find(ch => ch.name.toLowerCase().includes("modmail"))
        if(!Channel) return message.channel.send(`There is no mod mail channel...`);
        const Messages = [];
        const newChannel = await message.guild.channels.create(`modmail-${message.author.id}`, {
            type: `text`,
            parent: client.category,
            permissionOverwrites: [
                {
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL']
                },
                {
                    id: client.role,
                    allow: [`VIEW_CHANNEL`, `SEND_MESSAGES`, `ADD_REACTIONS`, `ATTACH_FILES`]
                },
                {
                    id: message.author.id,
                    allow: [`VIEW_CHANNEL`, `SEND_MESSAGES`, `ADD_REACTIONS`, `ATTACH_FILES`]
                }
            ]
        });
        Channel.send(client.embed({
            description: `The user ${message.author.tag} (${message.author.id}) is creating a modmail thread! Created in ${newChannel}`
        }, message));
        client.threads.set(message.author.id, {
            channel: newChannel
        });
        const ChannelCollector = newChannel.createMessageCollector((msg) => msg.channel.id == newChannel.id);
        const DMCollector = await message.author.send("*This is the beginning fo your conversation...*").then((msg) => msg.channel.createMessageCollector(async(msg) => await msg.author.id == message.author.id));
        ChannelCollector.on('collect', async(m) => {
            if(m.author.bot) return;
            if(m.content.toLowerCase() == `${client.prefix}close`) return ChannelCollector.stop("closed");
            Messages.push(`[Support] **${m.member.displayName}**: ${m.content}`);
            message.author.send(`**${m.member.displayName}**: ${m.content}`);
        });
        DMCollector.on('collect', async(m) => {
            if(m.author.bot) return;
            if(m.content.toLowerCase() == `${client.prefix}close`) return message.author.send(`You can't run this command...`);
            Messages.push(`[User] **${m.author.username}**: ${m.content}`);
            newChannel.send(`**${m.author.username}**: ${m.content}`)
        });
        ChannelCollector.on('end', async(collected, reason) => {
            if(reason == "closed"){
                DMCollector.stop();
                newChannel.send(`Generating transcript...`);
                message.author.send(`This ticket has been closed.`);
                await client.fs.writeFileSync(`../transcript.txt`, Messages.join("\n"));
                Channel.send(new client.discord.MessageAttachment(client.fs.createReadStream(`../transcript.txt`)));
                setTimeout(async() => {
                    await newChannel.delete();
                    await client.threads.delete(message.author.id);
                }, 5000)
            };
        });

    }
}