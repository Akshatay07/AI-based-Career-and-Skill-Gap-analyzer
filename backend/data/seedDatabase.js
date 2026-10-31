import CareerRole from "../models/CareerRole.js";
import { initialRoles } from "./roleSeeds.js";

export async function seedCareerRolesIfEmpty() {
  try {
    const count = await CareerRole.countDocuments();
    if (count === 0) {
      console.log("No career roles found in MongoDB. Seeding initial benchmark roles...");
      await CareerRole.insertMany(initialRoles);
      console.log(`Successfully seeded ${initialRoles.length} career roles!`);
    } else {
      console.log(`Career roles already exist in MongoDB (${count} roles available).`);
    }
  } catch (error) {
    console.error("Error seeding career roles:", error.message);
  }
}

