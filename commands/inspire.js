const fetch = require("node-fetch");
const {RichEmbed} = require('discord.js');
exports.handleCommand = function (args, msg, PREFIX) {
    fetch("https://inspirobot.me/api?generate=true").then(r => r.text()).then(url => {
        let embed = new RichEmbed();
        embed.setImage(url);
        embed.setColor(0xff69b4);
        embed.setFooter("Generated by inspirobot.me for " + msg.author.tag, msg.author.avatarURL);
        msg.channel.send(embed);
    })
}