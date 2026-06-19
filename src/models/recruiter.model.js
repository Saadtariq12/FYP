import mongoose from "mongoose";
const recruiter_schema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  skills_req: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
    enum: ["active", "not active"],
    default: "active",
  },

});
export const recruiter = mongoose.model("recruiter", recruiter_schema);
