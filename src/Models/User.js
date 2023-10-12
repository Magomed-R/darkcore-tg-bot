import { Schema, model } from "mongoose"; 

let userSchema = new Schema({
    name: String,
    username: String,
    chatId: String,
    history: [
        String
    ]
}, {
    timestamps: true
})

const User = model("user", userSchema)

export default User