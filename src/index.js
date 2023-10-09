import dotenv from "dotenv";
dotenv.config();

import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

import mongoose from "mongoose";
import chalk from "chalk";

mongoose
    .connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster.dvfjqpc.mongodb.net/darkcore`)
    .then((res) => console.log(chalk.bgGreen.bold("Connected to DB")))
    .catch((error) => console.log(error));

import Group from "./Models/Group.js";
import Button from "./Models/Button.js";
import Category from "./Models/Category.js";

bot.on("polling_error", console.log);

bot.setMyCommands([
    {
        command: "/menu",
        description: "Открыть меню",
    },
]);

async function getGroups() {
    let groups = await Group.find();
    groups = groups.map((el) => el.group);
    return groups;
}

async function getButtons() {
    let buttons = await Button.find().sort({ order: 1 });

    buttons.push({
        text: "📋Каталог DarkCore",
        callback_data: "catalog",
    });

    return buttons;
}

// let groups = getGroups();
// let buttons = getButtons();

async function checkSubscribe(userId) {
    let groups = await getGroups();
    for (let i = 0; i < groups.length; i++) {
        try {
            let pass = await bot.getChatMember("@" + groups[i], userId);
            let status = pass.status;

            if (status != "member" && status != "creator" && status != "administrator") {
                return false;
            }
        } catch (error) {
            console.log(error.response.body);
            return false;
        }
    }
    return true;
}

async function getInlineKeyboard(userId) {
    let result = [];
    let groups = await getGroups();
    console.log(groups);

    for (let i = 0; i < groups.length; i++) {
        result.push([{ text: groups[i], url: "t.me/" + groups[i] }]);

        if (i == groups.length - 1) {
            result.push([{ text: "✅Проверить", callback_data: "checksub " + userId }]);
        }
    }

    return result;
}

async function getKeyboard() {
    let result = [];
    let temp = [];
    let buttons = await getButtons();

    for (let i = 0; i < buttons.length; i++) {
        temp.push({ text: buttons[i].text });
        if (i % 2 == 1 && i != 0) {
            result.push(temp);
            temp = [];
        } else if (buttons.length - 1 == i) {
            result.push(temp);
        }
    }

    return result;
}

async function getCatalog() {
    let result = [];
    let temp = [];
    let buttons = await Category.find();

    for (let i = 0; i < buttons.length; i++) {
        let button = buttons[i]

        temp.push({ text: button.title, callback_data: `catalog ${button._id}`});
        if (i % 3 == 2 && i != 0) {
            result.push(temp);
            temp = [];
        } else if (buttons.length - 1 == i) {
            result.push(temp);
        }
    }

    return result;
}

bot.on("message", async (message) => {
    if (message.chat.type != "private") return;

    let text = message.text;
    let chatId = message.chat.id;
    let userId = message.from.id;
    let buttons = await getButtons();

    if (!(await checkSubscribe(userId))) {
        bot.deleteMessage(chatId, message.message_id);

        return bot.sendMessage(chatId, "Для начала вам необходимо подписаться на каналы", {
            reply_markup: {
                inline_keyboard: await getInlineKeyboard(userId),
            },
        });
    }

    if (text.includes("/start") || text.includes("/menu")) {
        bot.deleteMessage(chatId, message.message_id);

        try {
            return bot.sendMessage(chatId, "📃Меню", {
                reply_markup: {
                    keyboard: await getKeyboard(),
                },
            });
        } catch (error) {
            return console.log(error.response.body);
        }
    }

    bot.deleteMessage(chatId, message.message_id);

    for (let i = 0; i < buttons.length; i++) {
        let button = buttons[i];

        if (button?.callback_data) {
            if (text == "📋Каталог DarkCore") {
                bot.sendMessage(chatId, "Доступные категории", {
                    reply_markup: {
                        inline_keyboard: await getCatalog(),
                    },
                });
            }
            return;
        } else if (text == button?.text) {
            bot.sendMessage(chatId, button.url);
            return;
        }
    }
});

bot.on("callback_query", async (message) => {
    let chatId = message.message.chat.id;
    let data = message.data.split(" ")[0];
    let subData = message.data.split(" ")[1];

    if (data == "checksub") {
        if (await checkSubscribe(subData)) {
            bot.sendMessage(chatId, "✅Готово!");
            bot.deleteMessage(chatId, message.message.message_id);
        } else {
            bot.sendMessage(chatId, "⛔Вы не подписались на все каналы");
        }
        return;
    }

    if (data == "catalog") {
        let catalog = await Category.find();
        
        bot.sendMessage(chatId, catalog.find((el) => el._id == subData).callback)
    }
});
