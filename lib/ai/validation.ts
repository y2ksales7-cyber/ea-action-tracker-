import { z } from 'zod';
export const draftSchema = z.object({
  description: z.string().trim().min(1).max(1000),
  assignee: z.string().trim().max(200),
  priority: z.enum(['High', 'Medium', 'Low']),
  deadline: z.string().refine(v => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v), 'Enter a valid deadline'),
});
export const extractionSchema = z.object({ items: z.array(draftSchema).max(20) });
export type ActionDraft = z.infer<typeof draftSchema>;
