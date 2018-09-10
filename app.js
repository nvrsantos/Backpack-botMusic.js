const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const search = require('yt-search');
const config = require('./config.json');
const ffmpeg = require('ffmpeg');
const prefix = ".";

var bot = new Discord.Client();
var servers = {};
var player = "";

bot.on('ready', function(message){
    console.log(`BOT INICIADO: ${bot.user.username}, ID: ${bot.user.id}`);
    bot.user.setActivity('.ajuda', 'https://www.twitch.tv/neversantos');
});

bot.on('message', async message => {
    if(message.author.bot) return undefined;
    if(!message.content.startsWith(prefix)) return;
    var args = message.content.substring(prefix.length).split(" ");

    switch(args[0].toLowerCase()){
        case "teste":
            message.channel.sendMessage('Estou ativado!');
            break;
        case "apagar":
            let allowedRole = message.guild.roles.find(message.author, 'DONO');
            if(message.member.roles.has(allowedRole.id)){ //checking as an admin for example
                bot.deleteMessage(message, callBackFunc);
                message.channel.sendMessage(`Mensagens apagadas por ${message.author.username}!`);
            }else{
                message.channel.sendMessage(`Você não tem permissão para apagar mensagens!`);
            }
            break;
        case "ajuda":
            var embed = new Discord.RichEmbed()
                .setTitle('Menu de Ajuda!')
                .setColor(0xe67e22)
                .setDescription(".play LINK DA MúSICA - Toco sua música!\n.pause - Pauso a música!\n.volume VOLUME - Troco o volume da música\n.voltar - Volto a tocar a música!\n.stop - Paro a música!\n.sobre - Para saber mais sobre mim!");
            message.channel.send(embed);
            break;
        case "sobre":
            var embedSobre = new Discord.RichEmbed()
                .setTitle('Sobre o BOT!')
                .setColor(0xe67e22)
                .setDescription('Meu nome é Backpack, e sou um BOT exclusivo!')
                .addField('Criador:', 'Mário Santos', true)
                .addField('Data de criação:', '22/07/2018', true);
            message.channel.send(embedSobre);
            break;
        case "play":
            //checa se o autor inseriu um link
            if(!args[1]) return message.channel.sendMessage("Insira um link, .ajuda para pedir ajuda!");
            //checa se o autor esta em um canal de voz
            if(!message.member.voiceChannel) return message.channel.sendMessage("Você precisa estar em um canal de voz!");

            //valida a informacao
            let validate = ytdl.validateURL(args[1]);
            //checa a validacao
            if(!validate) return message.channel.send('Insira uma url valida!');

            //pega informacoes do video
            let info = await ytdl.getInfo(args[1]);

            //entra no canal do autor
            let connection = await message.member.voiceChannel.join();

            //toca a música
            const stream = ytdl(args[1], {filter: "audioonly"});
            const dispatcher = await connection.playStream(stream);
            player = dispatcher;
            
            //envia o embed
            var embedMusic = new Discord.RichEmbed()
                .setAuthor(`${message.author.username} colocou uma música para tocar!`)
                .setTitle(info.title)
                .setThumbnail(info.thumbnail_url)
                .setColor(0xe67e22)
                .addField('Canal:', info.author.name, true)
                .addField('Duração:', `${info.length_seconds}s`, true);
            message.channel.send(embedMusic);
            break;
        case "pause":
            //checar se o usuario esta no mesmo canal do bot
            if(!message.guild.voiceChannelID == message.member.voiceChannelID) return message.channel.sendMessage("Você e o bot estão em canais de voz diferentes!");
            //checa se a música esta pausada
            if(player.paused) return message.channel.send('Está música já está pausada!');

            //pausa a música
            player.pause();

            //envia a informacao
            message.channel.sendMessage('Música pausada, utilize .voltar para retornar a ouvir!')
            break;
        case "voltar":
            //checar se o usuario esta no mesmo canal do bot
            if(!message.guild.voiceChannelID == message.member.voiceChannelID) return message.channel.sendMessage("Você e o bot estão em canais de voz diferentes!");
            //checa se a música esta pausada
            if(!player.paused) return message.channel.sendMessage('Está música já está tocando!');

            //pausa a música
            player.resume();

            //envia a informacao
            message.channel.sendMessage('Música tocando, utilize .pause para pausar!')
            break;
        case "stop":
            var server = servers[message.guild.id];

            if(message.guild.voiceConnection) message.guild.me.voiceChannel.leave();
            break;
        case "sair":
            //checa se o autor esta em um canal de voz
            if(!message.member.voiceChannel) return message.channel.sendMessage("Você precisa estar em um canal de voz!");
            //checa se o bot esta em um canal de voz
            if(!message.guild.voiceChannel) return message.channel.sendMessage("O bot não está em um canal de voz!");
            //checa se o autor e o bot estao no mesmo canal
            if(!message.guild.voiceChannelID == message.member.voiceChannelID) return message.channel.sendMessage("Você e o bot estão em canais de voz diferentes!");

            //desconecta do canal
            message.guild.me.voiceChannel.leave();
        case "volume":
            //checa se passou um parametro de volume
            if(!args[1]) return message.channel.sendMessage("Você precisa informar um volume!");
            //checa se o numero e entre 0-200
            if(isNaN(args[1]) || args[1] > 200 || args[1] < 0) return message.channel.sendMessage("Informe um numero entre 0-200!");
            //checa se o autor e o bot estao no mesmo canal
            if(!message.guild.voiceChannelID == message.member.voiceChannelID) return message.channel.sendMessage("Você e o bot estão em canais de voz diferentes!");

            //seta o volume
            args[1] = parseInt(args[1]);
            player.setVolume(args[1] / 100);

            //envia a informacao
            message.channel.sendMessage(`Volume ajustado para ${args[1]}!`);
        default:
            message.channel.sendMessage('Comando inválido!');
    }
});

bot.login(config.token);