import dotenv from "dotenv";
dotenv.config();

import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("polling_error", console.log);

bot.setMyCommands([
    {
        command: "/menu",
        description: "Открыть меню",
    },
]);

let groups = ["DarkCoreNews", "DarkCoreAds", "DarkCoreBlackList", "DarkCoreStories"];
let buttons = [
    {
        text: "📰Новостник",
        url: "t.me/DarkCoreNews",
    },

    {
        text: "🧭Путеводитель",
        url: "t.me/DarkCoreAds",
    },

    {
        text: "ℹ️Истории / Интервью",
        url: "t.me/DarkCoreStories",
    },

    {
        text: "💬Чат",
        url: "t.me/blackmoneyproject_chat",
    },

    {
        text: "🏴BlackList",
        url: "t.me/DarkCoreBlackList",
    },

    // [
    //     {
    //         text: "Услуги",
    //         callback_data: "",
    //     },
    // ],

    {
        text: "👨‍💻Тех. Поддержка",
        url: "t.me/PaymentBM",
    },

    {
        text: "📋Каталог DarkCore",
        callback_data: "catalog",
    },
];

async function checkSubscribe(userId) {
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

function getInlineKeyboard(userId) {
    let result = [];

    for (let i = 0; i < groups.length; i++) {
        result.push([{ text: groups[i], url: "t.me/" + groups[i] }]);

        if (i == groups.length - 1) {
            result.push([{ text: "✅Проверить", callback_data: "checksub " + userId }]);
        }
    }

    return result;
}

function getKeyboard() {
    let result = [];
    let temp = [];

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

bot.on("message", async (message) => {
    if (message.chat.type != "private") return;

    let text = message.text;
    let chatId = message.chat.id;
    let userId = message.from.id;

    if (!(await checkSubscribe(message.from.id))) {
        bot.deleteMessage(chatId, message.message_id);

        return bot.sendMessage(chatId, "Для начала вам необходимо подписаться на каналы", {
            reply_markup: {
                inline_keyboard: getInlineKeyboard(userId),
            },
        });
    }

    if (text.includes("/start") || text.includes("/menu")) {
        bot.deleteMessage(chatId, message.message_id);

        try {
            return bot.sendMessage(chatId, "📃Меню", {
                reply_markup: {
                    keyboard: getKeyboard(),
                },
            });
        } catch (error) {
            return console.log(error.response.body);
        }
    }

    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].callback_data) {
            if (buttons[i].callback_data == "catalog") {
                bot.sendMessage(chatId, "Каталог", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Здесь будет список",
                                    callback_data: "data",
                                },
                            ],
                        ],
                    },
                });
            }
            return
        }

        if (text == buttons[i].text) {
            bot.deleteMessage(chatId, message.message_id);
            bot.sendMessage(chatId, `<a href="${buttons[i]?.url}">${buttons[i].text}</a>`, { parse_mode: "HTML" });
            return;
        }
    }
});

bot.on("callback_query", async (message) => {
    let chatId = message.message.chat.id;
    let data = message.data.split(" ")[0];
    let userId = message.data.split(" ")[1];

    if (data == "checksub") {
        if (await checkSubscribe(userId)) {
            bot.sendMessage(chatId, "✅Готово!");
            bot.deleteMessage(chatId, message.message.message_id);
        } else {
            bot.sendMessage(chatId, "⛔Вы не подписались на все каналы");
        }
        return;
    }

    if (data == "catalog") {
        bot.sendMessage(chatId, "Каталог", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Здесь будет список",
                            callback_data: "data",
                        },
                    ],
                ],
            },
        });
    }
});
