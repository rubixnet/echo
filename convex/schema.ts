import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(), 
        email: v.string(), 
        workosId: v.string(), 
    }).index("workosId", ["workosId"]),
})