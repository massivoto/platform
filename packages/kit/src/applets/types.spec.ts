/**
 * Tests for AppletDefinition type
 *
 * R-APP-01: AppletDefinition extends RegistryItem with inputSchema, outputSchema, packageName?, timeoutMs?
 * R-APP-02: Export from @massivoto/kit
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { RegistryItem } from '../registry/types.js'
import type { AppletDefinition } from './types.js'

describe('AppletDefinition', () => {
  /**
   * R-APP-01: AppletDefinition extends RegistryItem
   */
  it('should extend RegistryItem with id, type, init, dispose', () => {
    const definition: AppletDefinition = {
      id: 'confirm',
      type: 'applet',
      inputSchema: z.object({ message: z.string() }),
      outputSchema: z.object({ approved: z.boolean() }),
      init: async () => {},
      dispose: async () => {},
    }

    // Type checking: AppletDefinition should be assignable to RegistryItem
    const registryItem: RegistryItem = definition
    expect(registryItem.id).toBe('confirm')
    expect(registryItem.type).toBe('applet')
  })

  /**
   * R-APP-01: type must be 'applet'
   */
  it('should have type "applet"', () => {
    const definition: AppletDefinition = {
      id: 'grid',
      type: 'applet',
      inputSchema: z.object({ items: z.array(z.unknown()) }),
      outputSchema: z.object({ selected: z.array(z.string()) }),
      init: async () => {},
      dispose: async () => {},
    }

    expect(definition.type).toBe('applet')
  })

  /**
   * R-APP-01: inputSchema and outputSchema are required
   */
  it('should have inputSchema and outputSchema', () => {
    const inputSchema = z.object({ message: z.string(), title: z.string().optional() })
    const outputSchema = z.object({ approved: z.boolean() })

    const definition: AppletDefinition = {
      id: 'confirm',
      type: 'applet',
      inputSchema,
      outputSchema,
      init: async () => {},
      dispose: async () => {},
    }

    expect(definition.inputSchema).toBe(inputSchema)
    expect(definition.outputSchema).toBe(outputSchema)
  })

  /**
   * R-APP-01: packageName is optional
   */
  it('should allow optional packageName', () => {
    const definition: AppletDefinition = {
      id: 'custom',
      type: 'applet',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      packageName: '@acme/custom-applet',
      init: async () => {},
      dispose: async () => {},
    }

    expect(definition.packageName).toBe('@acme/custom-applet')
  })

  /**
   * R-APP-01: timeoutMs is optional
   */
  it('should allow optional timeoutMs', () => {
    const definition: AppletDefinition = {
      id: 'slow-form',
      type: 'applet',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      timeoutMs: 60000,
      init: async () => {},
      dispose: async () => {},
    }

    expect(definition.timeoutMs).toBe(60000)
  })

  /**
   * Validate schemas work correctly
   */
  it('should validate input using inputSchema', () => {
    const inputSchema = z.object({
      message: z.string(),
      title: z.string().optional(),
    })

    const definition: AppletDefinition = {
      id: 'confirm',
      type: 'applet',
      inputSchema,
      outputSchema: z.object({ approved: z.boolean() }),
      init: async () => {},
      dispose: async () => {},
    }

    // Valid input
    const result = definition.inputSchema.safeParse({ message: 'Approve this post?' })
    expect(result.success).toBe(true)

    // Invalid input
    const invalid = definition.inputSchema.safeParse({ title: 'Missing message' })
    expect(invalid.success).toBe(false)
  })

  /**
   * AC-APP-01: Emma imports AppletDefinition and creates a custom definition extending RegistryItem
   */
  it('AC-APP-01: should allow creating custom applet definition extending RegistryItem', () => {
    // Emma creates a custom applet definition
    const customApplet: AppletDefinition = {
      id: 'custom-form',
      type: 'applet',
      inputSchema: z.object({
        fields: z.array(z.object({
          name: z.string(),
          label: z.string(),
          type: z.enum(['text', 'number', 'email']),
        })),
      }),
      outputSchema: z.object({
        values: z.record(z.string(), z.unknown()),
      }),
      packageName: '@acme/custom-form',
      timeoutMs: 30000,
      init: async () => {},
      dispose: async () => {},
    }

    // It correctly extends RegistryItem
    expect(customApplet.id).toBe('custom-form')
    expect(customApplet.type).toBe('applet')
    expect(typeof customApplet.init).toBe('function')
    expect(typeof customApplet.dispose).toBe('function')
  })
})
