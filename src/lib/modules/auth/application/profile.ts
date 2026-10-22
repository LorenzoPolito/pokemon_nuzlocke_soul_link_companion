import { z } from 'zod';

/** Fields a user may change about themselves (`PATCH /api/me`). */
export const profileSchema = z
	.object({
		name: z.string().trim().min(1).max(40),
		locale: z.enum(['en', 'it']).nullable(),
		theme: z.enum(['light', 'dark', 'system']).nullable()
	})
	.partial()
	.refine((value) => Object.keys(value).length > 0, { message: 'Nothing to change' });

export type ProfileChange = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z.object({
	currentPassword: z.string().min(1).max(128),
	newPassword: z.string().min(8).max(128)
});
