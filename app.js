const Discord = require('discord.js'); // lib do discord.js

var {TOKEN, PREFIX, PREFIX_MUSIC, ROLE_MASTER, CHAT_CHANNEL, COMMAND_CHANNEL} = require('./config.json'); // arquivo para manter as configs
const levels = require('./levels.json'); // arquivo para manter os niveis

/*----------------------------------
 DB MODELS
---------------------------------- */
const UserModel = require('./models/User');
const GuildModel = require('./models/Guild');

/*----------------------------------
 VARIABLES & SETS
---------------------------------- */
var bot = new Discord.Client(); // cria a variavel do client
var channelsCommand = ['424985836694798346', '568928952316329984']; // cria variavel dos canais que permitem comandos
var channelCommand = channelsCommand[0]; // cria a variavel para armazenar o canal de comandos
const { connect } = require('mongoose'); // cria variavel de conexao do mongoose

/*----------------------------------
 FUNCTIONS
---------------------------------- */

// FUNCAO PARA ADICIONAR NOVO PARTICIPANTE NA LIGA DE NIVEIS
async function AddUserOnLeague(member) { 
    var req = await UserModel.findOne({id: member.id});// PROCURA O USUARIO NO DB

    // SE O USUARIO NAO ESTIVER NO DB
    if(!req){ 
        var insertUser = new UserModel({id: member.id, level: 0, xp: 0}); // QUERY PARA ADICIONAR O USUARIO
        await insertUser.save(); // ADICIONANDO O USUARIO AO DB
        return;
    }
}

// FUNCAO PARA MOSTRAR O RANK
async function ShowRankLeague(member, channel, guild) { 
    var req = await UserModel.find().limit(5).sort({level: -1}); // PROCURA, LIMITA OS FIELDS EM 5 E COLOCA EM ORDEM DECRESCENTE DOS NIVEIS
    var memberAuthor = await UserModel.findOne({id: member.id}); // PROCURA O AUTOR NO DB
    var counterPositionRank = 1; // CRIA A POSICAO INICIAL DE CONTAGEM DO RANK
    var embedShowRank = new Discord.MessageEmbed() // CRIA O EMBED PARA A MENSAGEM
        .setColor('#9b59b6') // SETA A COR DO EMBED
        .setTitle('TOP #5') // SETA O TITULO DO EMBED
        .setDescription(`**${member.user.username} - Level ${memberAuthor.level} - XP Total ${memberAuthor.xp}**`) // SETA A DESCRICAO DO EMBED
        .setTimestamp() // SETA A DATA DO EMBED
        .setFooter('Create By: nevr001'); // SETA O FOOTER DO EMBED

    // PERCORRE OS CAMPOS ENCONTRADOS
    for (var index in req) {
        var memberUser = await guild.members.fetch(req[index].id); // PEGA O USUARIO DO RANK ATRAVES DO ID
        embedShowRank.addField(`Top #${counterPositionRank}`, `${memberUser.user.username} - Level: ${req[index].level}`) // ADICIONA UM CAMPO AO EMBED
        counterPositionRank += 1; // AUMENTA A CONTAGEM DA POSICAO
    }

    return channel.send(embedShowRank); // RETORNA O EMBED PARA SER ENVIADO

}

// ADICIONA LEVEL E XP PARA OS USUARIOS
async function AddLevel(msg, member){ 
    var req = await UserModel.findOne({id: member.id}); // PROCURA O AUTOR NO DB
    
    // SE O USUARIO ESTIVER NO DB
    if(req){

        // PERCORRE OS NIVEIS
        for (var item in levels){ 

            // SE O XP ATUAL DO AUTOR FOR MAIOR OU IGUAL O XP DE ALGUM LEVEL
            if(req.xp >= levels[item]){
                var levelNumber = item.replace('level', ''); // PEGA O NUMERO DO NOVO NIVEL

                // IF O LEVEL DO AUTOR MENOR OU IGUAL O NIVEL PERCORRIDO E O NIVEL DO AUTOR FOR DIFERENTE DO NIVEL PERCORRIDO
                if(req.level <= levelNumber && req.level != levelNumber){

                    // ATUALIZA O NIVEL DO USUARIO NO DB
                    UserModel.updateOne({id: member.id}, {$set: {level: levelNumber}}, (err, res) => {
                        // SE OCORRER ALGUM ERRO
                        if(err){
                            console.log(err);
                        }
                        msg.reply(`Parabéns você upou para o nivel ${levelNumber} !`) // RETORNA UMA MENSAGEM QUE O USUARIO SUBIU DE NIVEL
                    });
                    return;
                }
            }else{
                // VARIAVEL PARA ADICIONAR +1 XP
                var newXP = req.xp + 1;
                // ATUALIZA O XP DO USUARIO
                UserModel.updateOne({id: member.id}, {$set: {xp: newXP}}, (err, res) => {
                    if(err) throw console.log(err); // SE OCORRER ALGUM ERRO
                });
                return;
            }
        }
    }else{
        return;
    }
}

// REDIRECIONA A MENSAGEM PARA UM NOVO CANAL
async function RedirectMessage(msg, channelNext, option=''){
    // SE A OPCAO DE REDIRECIONAMENTO FOR UM COMANDO
    if(option == 'command'){
        // SE A MENSAGEM COMECAR COM O PREFIXO DE BOT
        if(msg.content.startsWith(PREFIX_MUSIC)){
            // SE O CANAL QUE FOI ENVIADO A MENSAGEM FOR DIFERENTE DO CANAL DESTINO
            if(msg.channel != channelNext){
                msg.delete();
                channelCommand = bot.channels.fetch(channelNext)
                .then((channel) => {
                    var embedRedirectMessage = new Discord.MessageEmbed() // CRIA O EMBED PARA A MENSAGEM
                    .setColor('#9b59b6') // SETA A COR DO EMBED
                    .setTitle(msg) // SETA O TITULO DO EMBED
                    .setDescription(`Autor da mensagem: ${msg.author}`) // SETA A DESCRICAO DO EMBED
                    channel.send(embedRedirectMessage);
                    if(!channelsCommand.includes(channelCommand)){
                        channelsCommand.join(channelCommand);
                    }
                })
                .catch(console.error);
            }
        }
    
    // SE A OPCAO DE REDIRECIONAMENTO FOR UM CHAT
    }else if(option == 'chat'){
        // SE A MENSAGEM NAO COMECAR COM O PREFIXO DE BOT
        if(!msg.content.startsWith(PREFIX_MUSIC)){
            // SE O CANAL QUE FOI ENVIADO A MENSAGEM FOR DIFERENTE DO CANAL DESTINO
            if(msg.channel != channelNext){
                msg.delete();
                bot.channels.fetch(channelNext) // PEGA O CANAL DE CHAT ATRAVES DO ID
                // SE ENCONTRAR O CHANNEL ACIMA
                .then(channel => {
                    var embedRedirectMessage = new Discord.MessageEmbed() // CRIA O EMBED PARA A MENSAGEM
                    .setColor('#9b59b6') // SETA A COR DO EMBED
                    .setTitle(msg) // SETA O TITULO DO EMBED
                    .setDescription(`Autor da mensagem: ${msg.author}`) // SETA A DESCRICAO DO EMBED
                    channel.send(embedRedirectMessage); // REENVIA A MENSAGEM NO CANA CORRETO
                })
                .catch(console.error); // SE OCORRER ALGUM ERRO AO ENCONTRAR O CANAL, EXIBIR O ERRO NO CONSOLE
            }
        }
    // SE A OPCAO DE REDIRECIONAMENTO FOR UMA MENSAGEM DO BOT
    }else if(option = 'bot_send'){
        // SE O CANAL QUE FOI ENVIADO A MENSAGEM FOR DIFERENTE DO CANAL DESTINO
        if(msg.channel != channelNext){
            msg.delete();
            channelCommand = bot.channels.fetch(channelNext)
            .then((channel) => {
                var embedRedirectMessage = new Discord.MessageEmbed() // CRIA O EMBED PARA A MENSAGEM
                    .setColor('#9b59b6') // SETA A COR DO EMBED
                    .setTitle(msg) // SETA O TITULO DO EMBED
                    .setDescription(`Autor da mensagem: ${msg.author}`) // SETA A DESCRICAO DO EMBED
                channel.send(embedRedirectMessage);
                if(!channelsCommand.includes(channelCommand)){
                    channelsCommand.join(channelCommand);
                }
            })
            .catch(console.error);
        }
    }
}

async function UpdateRolesLevel(){
    //
}

/*----------------------------------
 EVENTS DISCORD.JS
---------------------------------- */

// EVENTO PARA QUANDO O BOT ESTIVER INICIADO
bot.on("ready", (message) => {
    // EXIBE UMA MENSAGEM NO CONSOLE
    console.log(`BOT INICIADO: ${bot.user.username}, ID: ${bot.user.id}`);
    // ALTERA O ACTIVITY DO BOT
    bot.user.setActivity(PREFIX+'ajuda', 'https://www.twitch.tv/neversantos');
});

// EVENTO PARA QUANDO ENTRAR UM NOVO USUARIO NO SERVER
bot.on("guildMemberAdd", (member) => {
    // CHAMA A FUNCAO PARA ADICIONAR O USUARIO NA LIGA
    AddUserOnLeague(member);
});

// EVENTO CASO OCORRA ERRO NA INICIALIZACAO DO BOT
bot.on("error", console.error);

// EVENTO PARA QUANDO O BOT "OUVIR" ALGUMA MENSAGEM
bot.on("message", async (message) => {
    // CASO A MENSAGEM SEJA DE UM BOT
    if(message.author.bot) return ;
    if(!message.guild) return; // SE A MENSAGEM NAO ESTIVER NO SERVIDOR
    message.content = message.content.toLowerCase(); // COLOCA TODAS AS MENSAGENS RECEBIDAS EM LOWER CASE

    // MENSAGEM PARA DEFINIR NOVA SALA DE COMANDOS
    if(message.content.startsWith(PREFIX+'new_channel ')){
        
        var msg = message.content.replace(PREFIX+'new_channel ', ''); // TRATA A MENSAGEM RECEBIDA
        if(msg != ''){
            var insertSQL = new GuildModel({channel: msg});
            await insertSQL.save();
            message.reply('novo canal definido!');
        }
    }
    // ADICIONA A PESSA NA COMPETICAO
    else if(message.content.startsWith(PREFIX_MUSIC+'p ')){
        str = message.content.replace(PREFIX_MUSIC+'p', '');
        if(str != ''){
            AddUserOnLeague(message.member);
            AddLevel(message, message.member);
            RedirectMessage(message, COMMAND_CHANNEL, 'command')
        }
    }
    // ADICIONA A PESSA NA COMPETICAO
    else if(message.content == PREFIX+'rank'){
        ShowRankLeague(message.member, message.channel, message.guild);
    }
    // SETA AS CONFIGURACOES PARA O SERVIDOR
    else if(message.content.startsWith(PREFIX+'config')){
        var str = message.content.replace(PREFIX+'config ', ''); // VARIAVEL PARA ARMAZENAR A STRING PARA CONFIG

        // SE A STRING FOR PARA ALTERAR O PREFIX
        if(str.startsWith('prefix')){
            PREFIX = str.replace('prefix ', '').trim(); // ALTERA O PREFIX PARA A STRING TRATADA
        }

        // SE A STRING FOR PARA ALTERAR O PREFIX_MUSIC
        else if(str.startsWith('prefix_music')){
            PREFIX_MUSIC = str.replace('prefix_music ', '').trim(); // ALTERA O PREFIX_MUSIC PARA A STRING TRATADA
        }

        // SE A STRING FOR PARA ALTERAR O CHAT_CHANNEL
        else if(str.startsWith('chat_channel')){
            CHAT_CHANNEL = str.replace('chat_channel ', '').trim(); // ALTERA O CHAT_CHANNEL PARA A STRING TRATADA
        }

        // SE A STRING FOR PARA ALTERAR O COMMAND_CHANNEL
        else if(str.startsWith('command_channel')){
            COMMAND_CHANNEL = str.replace('command_channel ', '').trim(); // ALTERA O COMMAND_CHANNEL PARA A STRING TRATADA
        }
    }
    // SE MANDAR ALGUMA MENSAGEM NO CANAL DE BOTS QUE NAO SEJA UM COMANDO
    else{
        // SE A MENSAGEM FOR ENVIADA NO CANAL DE COMANDOS
        if(channelsCommand.includes(message.channel.id)){
            RedirectMessage(message, CHAT_CHANNEL, 'chat');
        }

        // SE A MENSAGEM FOR ENVIADA NO CANAL DE CHAT
        if(message.channel.id == CHAT_CHANNEL){
            RedirectMessage(message, COMMAND_CHANNEL, 'command');
        }
    }
});

(async () => {
    await connect('mongodb://localhost/mongodb-backpackbot', {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
    return bot.login(TOKEN);
})()
