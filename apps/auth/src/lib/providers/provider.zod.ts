import { z } from 'zod'

// R-BUILD-63: Zod schema for ProviderStub validation.
export const ProviderStubSchema = z.object({
  id: z.string().min(1, 'Provider id is required'),
  name: z.string().min(1, 'Provider name is required'),
  logo: z.string().min(1, 'Provider logo path is required'),
  about: z.string().min(1, 'Provider description is required'),
})
