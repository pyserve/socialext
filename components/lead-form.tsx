"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dealers, leadSources, leadTypes } from "@/lib/data";
import { leadFormSchema, type LeadFormSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { CalendarIcon, CheckCircle2Icon, Clock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import MaskedInput from "react-text-mask";
import { Address, AddressAutoComplete } from "./google-address-input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LeadForm() {
  const [created, setCreated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LeadFormSchema>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      First_Name: "",
      Last_Name: "",
      Email: "",
      Mobile: "",
      Dealer: "",
      Lead_Source: "",
      Lead_Types: "",
      Meeting_Date: "",
      Meeting_Time: "",
      Full_Address: "",
      Street: "",
      City: "",
      Province: "",
      Zip_Code: "",
      Country: "",
    },
  });
  async function onSubmit(data: LeadFormSchema) {
    const timezoneName = "America/Toronto";
    const formattedDate = dayjs(new Date(data.Meeting_Date)).format(
      "YYYY-MM-DD"
    );
    setIsSubmitting(true);

    try {
      const res1 = await axios.post("/api/leads/entry", {
        address: data.Full_Address,
        email: data.Email,
        phone: data.Mobile.replace(/[^\d]/g, ""),
        date: formattedDate,
      });
      const statuses = res1.data?.data?.map((d: any) => d.Lead_Status);
      const hasInvalidStatus = statuses?.some((status: string) =>
        ["Not Interested", "Invalid"].includes(status)
      );
      if (hasInvalidStatus) {
        toast.error(
          "This lead appears to be a duplicate. It was already booked within the past week."
        );
        setIsSubmitting(false);
        return;
      }

      const res2 = await window.ZOHO.CRM.API.insertRecord({
        Entity: "Leads",
        APIData: {
          ...data,
          Meeting_Time: dayjs
            .tz(`${formattedDate}T${data.Meeting_Time}`, timezoneName)
            .format(),
        },
        Trigger: ["workflow"],
      });
      console.log("🚀 ~ onSubmit ~ res:", res2);
      form.reset();
      toast.success("Thank you! Your response has been submitted.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCreated(true);
    } catch (error: any) {
      if (error instanceof Error) toast.error(error.message);
      if (error.data) {
        const err = error.data?.[0];
        const errorMessage = `${err?.code}: ${JSON.stringify(
          err?.details,
          null,
          4
        )}`;
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {created && (
        <div className="grid w-full max-w-4xl items-start gap-4 my-2 ">
          <Alert className="bg-green-200">
            <CheckCircle2Icon />
            <AlertTitle>Success! Lead submitted sucessfully.</AlertTitle>
            <AlertDescription>
              A lead is created with the given details. Please enter new details
              to record more...
            </AlertDescription>
          </Alert>
        </div>
      )}
      <Card className="" onClick={() => created && setCreated(false)}>
        <CardHeader>
          <CardTitle className="flex gap-1 items-center">
            <Image
              className="p-0"
              src={"/logo.png"}
              width={50}
              height={50}
              alt=""
            />
            <div className="text-2xl uppercase">Zoho Lead Form</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="First_Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Last_Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="Email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <MaskedInput
                            mask={[
                              "(",
                              /[1-9]/,
                              /\d/,
                              /\d/,
                              ")",
                              " ",
                              /\d/,
                              /\d/,
                              /\d/,
                              "-",
                              /\d/,
                              /\d/,
                              /\d/,
                              /\d/,
                            ]}
                            className={cn(
                              "w-full border rounded-md py-2 px-3 shadow-sm text-sm"
                            )}
                            placeholder="(555) 987-6543"
                            guide={false}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Lead Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Lead Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="Dealer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dealer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select dealer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dealers.map((dealer) => (
                              <SelectItem
                                key={dealer.value}
                                value={dealer.value}
                              >
                                {dealer.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Lead_Source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadSources.map((source) => (
                              <SelectItem
                                key={source.value}
                                value={source.value}
                              >
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Lead_Types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadTypes.map((leadType) => (
                              <SelectItem
                                key={leadType.label}
                                value={leadType.value}
                              >
                                {leadType.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Meeting Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Meeting Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="Meeting_Date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Meeting Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  dayjs(new Date(field.value)).format(
                                    "YYYY-MM-DD"
                                  )
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date ? date.toLocaleDateString() : ""
                                )
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Meeting_Time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Time</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="time"
                              placeholder="Select time"
                              {...field}
                              ref={(el) => {
                                field.ref(el);
                              }}
                            />
                          </FormControl>
                          <Clock className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Information</h3>
                <FormField
                  control={form.control}
                  name="Full_Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <AddressAutoComplete
                          placeholder="Enter full address"
                          displayName={field.value}
                          onAddressSelected={(data: Address) => {
                            (Object.keys(data) as (keyof Address)[]).forEach(
                              (key) => {
                                form.setValue(key, data[key] ?? "");
                              }
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="Street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            placeholder="Enter street address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="City"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input readOnly placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Region/Province</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            placeholder="Enter state/region"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="Zip_Code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal/Zip Code</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            placeholder="Enter postal/zip code"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="Country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            placeholder="Enter country"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <CardFooter className="px-0 pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Lead Information"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
