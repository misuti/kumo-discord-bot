const Discord = require('discord.js');
const request = require('request');
const moment = require('moment');
const {
    parse
} = require('node-html-parser');
const client = new Discord.Client();
const prefix = process.env.PREFIX;
const USERTOKEN = process.env.CMTOKEN;
const j = request.jar();
const cookie = request.cookie('remember_user_token=' + USERTOKEN);
j.setCookie(cookie, "https://nushigh.coursemology.org");

const PING_EMBED = new Discord.RichEmbed().setTitle("機器雲的延時").setColor(0x21f8ff).addField("Latency", 0).addField("Discord API Latency", 0);

console.log('APP STARTING...');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setPresence({
        game: {
            name: 'ZY\'s Bot'
        },
        status: 'idle'
    });
});

client.on('message', async msg => {
    if (!msg.channel.type === "text") return;
    if (!msg.guild) return;
    if (msg.content.indexOf(prefix) !== 0) return;
    let args = msg.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    console.log("Command " + command + " | Args [" + args.join(", ") + "] | Owner " + msg.author.username);
    if (msg.channel.id === "642988383626592286" || msg.channel.id === "642993162943725568") {
        if (command === "ping") {
            msg.delete();
            console.log(`${msg.author.username} requested a ping!`);
            const m = await msg.channel.send("Ping?");
            PING_EMBED.fields[0].value = m.createdTimestamp - msg.createdTimestamp;
            PING_EMBED.fields[1].value = Math.round(client.ping);
            PING_EMBED.setFooter("Requested By " + msg.author.username, msg.author.displayAvatarURL);
            m.edit(PING_EMBED);
        }
        if (command === "test") {
            msg.channel.send("TESTING COMMAND.  Arguments: " + args.join(", "));
            console.log(`${msg.author.username} requested test!`);
            msg.delete();
        }
        if (command === "coursemology" || command === "cm") {
            if (args.length < 1) return msg.channel.send("Correct Usage: `" + prefix + "coursemology (info|list|leaderboard) [args]`");
            switch (args.shift()) {
                case "i":
                case "info":
                    if (args.length == 1) args = [1706, args[0]];
                    if (args.length != 2) return msg.channel.send("Correct Usage: `" + prefix + "coursemology info [course id] assessment-id`");
                    exeInfo(args[0], args[1], msg);
                    break;
                case "l":
                case "list":
                    if (args.length == 2) args = [1706, args[0], args[1]];
                    if (args.length != 3) return msg.channel.send("Correct Usage: `" + prefix + "coursemology list [course id] category-id tab-id`")
                    exeList(args[0], args[1], args[2], msg);
                    break;
                case "lb":
                case "leaderboard":
                    if (args.length == 0) args = [1706, "level"];
                    if (args.length == 1) {
                        if (!isNaN(args[0])) args = [args[0], "level"];
                        else args = [1706, args[0]];
                    }
                    if ((args[1] !== "level" && args[1] !== "achievement") || args[0] === "help" || args[0] === "h") return msg.channel.send("Correct Usage: `" + prefix + "coursemology leaderboard [course id] [level|achievement]`")
                    exeLB(args[0], exeLB[1], msg);
                    break;
            }

        }
    }
});

function exeInfo(course, id, msg) {
    request({
        url: `https://nushigh.coursemology.org/courses/${course}/assessments/${id}`,
        jar: j
    }, function(error, response, body) {
        if (error || response.statusCode == 404) {
            msg.channel.send("Coursemology Query Failed!");
        } else {
            let result = parse(body);
            let title = result.querySelector(".course-layout .course-assessment-assessments .page-header h1 span").text;
            let contents = result.querySelector("#assessment_" + id);
            let embed = new Discord.RichEmbed().setTitle(title);
            embed.setColor(0x21f8ff)
            if (contents.querySelector(".well")) embed.setDescription(contents.querySelector(".well").text.replace(/<[^>]+>/g, ''));
            embed.addField("Type", contents.querySelector(".type td").text);
            embed.addField("EXP", contents.querySelector(".base_exp td").text + " (" + contents.querySelector(".bonus_exp td").text + ")");
            let achievements = contents.querySelectorAll(".condition_assessment");
            let required = achievements.map(a => a.rawText.replace(/<a.+>(.+)<\/a>(.+)/, "**$1** $2")).join("\n");
            if (required) embed.addField("Required for Achievements", required, true);
            let files = [];
            let linksInDiv = contents.querySelectorAll("div a");
            for (var i = 0; i < linksInDiv.length; i++)
                if (linksInDiv[i].attributes.href.match("(\\/courses\\/[0-9]+\\/materials\\/folders\\/[0-9]+\\/files\\/[0-9]+)")) embed.addField(linksInDiv[i].text, "[Download](" + "https://nushigh.coursemology.org" + linksInDiv[i].attributes.href + ")");
            embed.attachFiles(files);
            embed.setFooter("Requested By " + msg.author.username, msg.author.displayAvatarURL);
            msg.channel.send(embed);
        }
    });
}

function exeList(course, cat, tab, msg) {
    request({
        url: `https://nushigh.coursemology.org/courses/${course}/assessments?category=${cat}&tab=${tab}`,
        jar: j
    }, function(error, response, body) {
        if (error || response.statusCode == 404) {
            msg.channel.send("Coursemology Query Failed!");
        } else {
            let result = parse(body);
            let contents = result.querySelector(".assessments-list tbody");
            let embed = new Discord.RichEmbed().setTitle(result.querySelector(".page-header h1 span").text);
            embed.setColor(0x21f8ff);
            let rows = contents.querySelectorAll("tr");
            let desc = rows.map(row => {
                let title = row.firstChild.firstChild;
                let disabled = !row.attributes.class.includes("currently-active");
                return {
                    name: `${disabled?"~~":"**"}${row.attributes.id.replace("assessment_", "")}${disabled?"~~":"**"}`,
                    value: `[${title.text}](https://nushigh.coursemology.org${title.attributes.href})`,
                    inline: true
                };
            });
            embed.fields = desc;
            embed.setFooter("Requested By " + msg.author.username, msg.author.displayAvatarURL);
            msg.channel.send(embed);
        }
    });
}

function exeLB(course, type, msg) {
    request({
        url: `https://nushigh.coursemology.org/courses/${course}/leaderboard`,
        jar: j
    }, function(error, response, body) {
        if (error || response.statusCode == 404) {
            msg.channel.send("Coursemology Query Failed!");
        } else {
            let result = parse(body);
            let contents = result.querySelector(".leaderboard-" + type + " tbody");
            let rows = contents.querySelectorAll("tr");
            let row1 = rows.shift();
            let embed = new Discord.RichEmbed().setTitle(`#1 ${row1.querySelector(".user-profile div a").text} _(${row1.querySelector(".user-profile").lastChild.text})_`);
            embed.setThumbnail(row1.querySelector(".user-picture img").attributes.src);
            let desc = rows.map(row => {
                let rank = row.firstChild.text;
                return {
                    name: `#${row.firstChild.text}`,
                    value: `[${row.querySelector(".user-profile div a").text}](https://nushigh.coursemology.org${row1.querySelector(".user-profile div a").attributes.href})`
                };
            });
            embed.fields = desc;
            embed.setFooter("Requested By " + msg.author.username, msg.author.displayAvatarURL);
            embed.setColor(0x21f8ff);
            msg.channel.send(embed);
        }
    });
}

client.login(process.env.TOKEN);
