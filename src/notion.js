require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const database_id = process.env.NOTION_DATABASE_ID;

//----Initializing the notion client----
const {Client} = require("@notionhq/client"); //only worked with var not const
const { type } = require('express/lib/response');
const notion = new Client({ auth: NOTION_TOKEN });

//----function to fetch calendar info from notion----
async function getInfo() {
    const payload = {               //info for the request on notion
        path: `databases/${database_id}/query`,
        method: 'POST',      
    }
    const {results} = await notion.request(payload);                //array has to be called results 

    //constructing object from the database
    let tasks = results.map(page => {
        ///---preventing passed dates from being kept track of---
        const timeNow = Date.now();
        const timeDue = new Date(page.properties.Date.date.start);       //time of due date of current task being parsed
        if (timeNow < (timeDue.getTime() + ((1000 * 60 * 60 * 24)-(1000 * 60)))) {   //adding 23:59 mins to date 10 days away    
            return {
                id: page.id,
                title: page.properties.Name.title[0].plain_text,
                date: page.properties.Date.date.start,
                description: page.properties.Description.rich_text[0].text.content
            };
        }
        
    })
    //parsing through tasks to remove indexes of undefined which will come up for past dates
    //source: https://stackoverflow.com/questions/28607451/removing-undefined-values-from-array
    tasks = tasks.filter(function( element ) {
        return element !== undefined;
    });
    
    //sorting dates from closest to furthest using a slightly modified bubble sort
    for (let i = 0; i < tasks.length; i++) {
        for (let j = 0; j < tasks.length-1; j++) {
            let time1 = new Date(tasks[j].date);
            let time2 = new Date(tasks[j + 1].date);
            if (time1.getTime() > time2.getTime()) {
                let tmp = tasks[j];
                tasks[j] = tasks[j + 1];
                tasks[j + 1] = tmp;
            }
        }
    }
    return tasks;
    
}

module.exports= { getInfo }
