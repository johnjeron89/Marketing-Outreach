"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveCompanyProfile } from "@/actions/company";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  oneLinePitch: z.string().optional(),
  industry: z.string().min(1, "Please select an industry."),
  stage: z.string().min(1, "Please select a funding stage."),
  amountRaising: z.string().optional(),
  valuationTarget: z.string().optional(),
  location: z.string().optional(),
  traction: z.string().optional(),
  founderBio: z.string().optional(),
  calendarLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  emailSignature: z.string().optional(),
  dataRoomUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  demoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function CompanyProfilePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      url: "",
      oneLinePitch: "",
      amountRaising: "",
      valuationTarget: "",
      location: "",
      traction: "",
      founderBio: "",
      calendarLink: "",
      emailSignature: "",
      dataRoomUrl: "",
      demoUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await saveCompanyProfile(values);
      toast.success("Company profile saved!");
      router.push("/onboarding/pitch-deck");
    } catch (error) {
      toast.error("Failed to save company profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">
          Tell us about your startup to personalize your investor outreach.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="oneLinePitch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-Line Pitch</FormLabel>
                <FormControl>
                  <Input placeholder="We do X for Y by Z..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="saas">SaaS / Enterprise</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="healthtech">Healthtech</SelectItem>
                      <SelectItem value="consumer">Consumer / Marketplace</SelectItem>
                      <SelectItem value="deeptech">Deeptech / AI</SelectItem>
                      <SelectItem value="crypto">Crypto / Web3</SelectItem>
                      <SelectItem value="climate">Climate / Sustainability</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pre-seed">Pre-seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series-a">Series A</SelectItem>
                      <SelectItem value="series-b">Series B</SelectItem>
                      <SelectItem value="growth">Growth+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="amountRaising"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Raising</FormLabel>
                  <FormControl>
                    <Input placeholder="$2M" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valuationTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valuation Target (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="$15M Post-money cap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HQ Location</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco, CA / Remote" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="traction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Traction</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="E.g., $10k MRR, growing 20% MoM, 5 enterprise pilots..." 
                    className="resize-none" 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Key Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dataRoomUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Room URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://docsend.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="demoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calendarLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://cal.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
