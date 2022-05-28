//----importing .env content----
require('dotenv').config();
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_BOT_MESSAGING_CHANNEL_ID = process.env.DISCORD_BOT_MESSAGING_CHANNEL_ID;
const DISCORD_BOT_ROLE_ID = process.env.DISCORD_BOT_ROLE_ID;

//----importing cron module----
const cron = require('node-cron');

//----importing notion function----
const { getInfo } = require('./notion.js');      


//----initializing discord client----
//also only worked with var not const
const { Client, Intents, Channel, Message } = require('discord.js');           //only importing client class from discord api

const myIntents = new Intents();        //declaring intents
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES);                      //intents taken from discord.js intents section

const client = new Client({ intents: myIntents});

const PREFIX = '$';             //prefix to begin a command

//----functions----
//preparing the message that will be displayed with tasks within ten days
function prepareDisplay(tasks) {
    const time10Days = new Date();
    time10Days.setDate(time10Days.getDate() + 10);
    const timeNow = Date.now();
    let timeDue;
    let returnedMessage = '----------------------------\n';
    returnedMessage = returnedMessage + '\n**Tasks Due in the Next 10 days:**\n';
    for (let i = 0; i < tasks.length; i++) { 
        timeDue = new Date(tasks[i].date);       
        if ((timeDue.getTime() - timeNow) <= (time10Days.getTime() - timeNow)) {
            returnedMessage = returnedMessage + `\nTask: ${tasks[i].title}\nDue Date: ${tasks[i].date}\nDescription: ${tasks[i].description}\n`;
        }
    }

    returnedMessage = returnedMessage + '\n----------------------------'; //adding lines above and below message to look nice

    return returnedMessage;
}
 
//bot commands, event triggers when a message is sent

client.on('messageCreate', (message) => {
    if (message.author.bot) return;     //makes sure message didnt come from the bot itself

    if (message.channelId !== DISCORD_BOT_MESSAGING_CHANNEL_ID) {       //only allows messages in its own channel
        message.reply('**Mort Bot will only respond in its designated channel.**');
        return;
    }
    
    if (message.content.startsWith(PREFIX)) {
        const [CMD_NAME, ... args] = message.content
            .trim()
            .substring(PREFIX.length)                       //methods applying to message.content
            .split(/\s+/);   //splits any whitespaces only
        //displaying upcoming tasks
        if (CMD_NAME === 'tasks') {
            (async () => {
                const tasks =  await getInfo(); //await is used to wait for promise to return a value, only works with async function
                const LENGTH = tasks.length

                //replying based on amount of tasks
                
                if (LENGTH === 0) {
                    message.reply('**No more tasks coming up at the moment!**');
                    console.log(typeof(message.channelId));
                }
                else {
                    //only displaying tasks within 10 days of command being made
                    message.reply(prepareDisplay(tasks));
                }
            })()
            
        }
        else if (CMD_NAME === 'help') {
            message.channel.send('**$tasks** --> displays tasks coming up in next 10 days');
        }
        else {
            message.reply('Invalid command. Use **$help** to see command list.');
        }
    }
});



//function activates at the 0th second of the 0th minute at 9 am every saturday
cron.schedule('0 0 8 * * 6', async () => {
    const tasks = await getInfo();
    const LENGTH = tasks.length
    if (LENGTH === 0) return;       //returning nothing to end function if no tasks for weekly message

    //takes in channel id and sends message into that channel
    //<@$id> is format to mention a role using role id
    client.channels.cache.get(DISCORD_BOT_MESSAGING_CHANNEL_ID).send(`<@&${DISCORD_BOT_ROLE_ID}> \n${prepareDisplay(tasks)}`);   
});



client.login(DISCORD_BOT_TOKEN);
