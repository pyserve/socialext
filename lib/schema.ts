import { z } from "zod";

export const leadFormSchema = z.object({
  First_Name: z.string().min(1, "First Name is required"),
  Last_Name: z.string().min(1, "Last Name is required"),
  Email: z.union([z.literal(""), z.string().email()]),
  Mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number is too long"),

  Dealer: z.string().min(1, "Dealer is required"),
  Lead_Source: z.string().min(1, "Lead Source is required"),
  Lead_Types: z.string().min(1, "Lead Type is required"),

  Meeting_Date: z.string().min(1, "Meeting Date is required"),
  Meeting_Time: z.string().min(1, "Meeting Date is required"),

  Full_Address: z.string().min(1, "Address is required"),
  Street: z.string().min(1, "Street Address is required"),
  City: z.string().min(1, "City is required"),
  Province: z.string().min(1, "State/Region/Province is required"),
  Zip_Code: z.string().min(1, "Postal/Zip Code is required"),
  Country: z.string().min(1, "Country is required"),
});

export type LeadFormSchema = z.infer<typeof leadFormSchema>;
