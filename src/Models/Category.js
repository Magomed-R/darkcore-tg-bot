import { Schema, model } from "mongoose"; 

let categorySchema = new Schema({
    title: String,
    callback: String,
    order: Number
})

const Category = model("category", categorySchema)

export default Category