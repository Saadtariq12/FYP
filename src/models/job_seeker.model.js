import mongoose from "mongoose";
const job_seeker_schema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    skills: [
        {
            type: String
        }
    ],
});
export const job_seeker = mongoose.model("job_seeker", job_seeker_schema)