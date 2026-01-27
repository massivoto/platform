/**
 * Data structure easy to transfer and save.
 */

export type Serializable = Record<
  string,
  Primitive | BaseSerializableArray | SerializableObject
>

type Primitive = string | number | boolean | undefined // undefined is needed for optional field
type BaseSerializableArray = Primitive[]

export interface SerializableObject {
  [key: string]:
    | Primitive
    | SerializableObject
    | (Primitive | SerializableObject)[]
}

/**
 * Examples
 */

// limited to first level and arrays of primitive types
const example1: Serializable = {
  name: 'John Doe',
  age: 30,
  isActive: true,
  hobbies: ['reading', 'gaming'],
}

// nested objects and arrays of primitive types
const example2: SerializableObject = {
  user: {
    id: '12345',
    name: 'Alice',
    age: 25,
    isActive: false,
  },
  preferences: {
    theme: 'dark',
    notifications: true,
  },
  tags: ['a', { x: 'y' }],
}
