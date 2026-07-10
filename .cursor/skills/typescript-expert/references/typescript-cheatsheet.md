# TypeScript Cheatsheet

## Type Basics

```typescript
// Primitives
const name: string = 'John'
const age: number = 30
const isActive: boolean = true
const nothing: null = null
const notDefined: undefined = undefined

// Arrays
const numbers: number[] = [1, 2, 3]
const strings: Array<string> = ['a', 'b', 'c']

// Tuple
const tuple: [string, number] = ['hello', 42]

// Object
const user: { name: string; age: number } = { name: 'John', age: 30 }

// Union
const value: string | number = 'hello'

// Literal
const direction: 'up' | 'down' | 'left' | 'right' = 'up'

// Any vs Unknown
const anyValue: any = 'anything'     // Avoid
const unknownValue: unknown = 'safe' // Prefer, requires narrowing
```

## Type Aliases & Interfaces

```typescript
type Point = {
  x: number
  y: number
}

interface User {
  id: string
  name: string
  email?: string
  readonly createdAt: Date
}

interface Admin extends User {
  permissions: string[]
}

type AdminUser = User & { permissions: string[] }
```

## Generics

```typescript
function identity<T>(value: T): T {
  return value
}

function getLength<T extends { length: number }>(item: T): number {
  return item.length
}

interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

type Container<T = string> = {
  value: T
}

function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 }
}
```

## Utility Types

```typescript
interface User {
  id: string
  name: string
  email: string
  age: number
}

type PartialUser = Partial<User>
type RequiredUser = Required<User>
type ReadonlyUser = Readonly<User>
type UserName = Pick<User, 'id' | 'name'>
type UserWithoutEmail = Omit<User, 'email'>
type UserMap = Record<string, User>
type StringOrNumber = string | number | boolean
type OnlyStrings = Extract<StringOrNumber, string>
type NotString = Exclude<StringOrNumber, string>
type MaybeString = string | null | undefined
type DefinitelyString = NonNullable<MaybeString>

function getUser() { return { name: 'John' } }
type UserReturn = ReturnType<typeof getUser>
type GetUserParams = Parameters<typeof getUser>
type ResolvedUser = Awaited<Promise<User>>
```

## Conditional Types

```typescript
type IsString<T> = T extends string ? true : false
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type ToArray<T> = T extends any ? T[] : never
type Result = ToArray<string | number>
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never
```

## Template Literal Types

```typescript
type Color = 'red' | 'green' | 'blue'
type Size = 'small' | 'medium' | 'large'
type ColorSize = `${Color}-${Size}`
type EventName = 'click' | 'focus' | 'blur'
type EventHandler = `on${Capitalize<EventName>}`
```

## Mapped Types

```typescript
type Optional<T> = {
  [K in keyof T]?: T[K]
}

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}
```

## Type Guards

```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  return value.toFixed(2)
}

class Dog { bark() {} }
class Cat { meow() {} }

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark()
  } else {
    animal.meow()
  }
}

interface Bird { fly(): void }
interface Fish { swim(): void }

function move(animal: Bird | Fish) {
  if ('fly' in animal) {
    animal.fly()
  } else {
    animal.swim()
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Not a string')
  }
}
```

## Discriminated Unions

```typescript
type Success<T> = { type: 'success'; data: T }
type Error = { type: 'error'; message: string }
type Loading = { type: 'loading' }

type State<T> = Success<T> | Error | Loading

function handle<T>(state: State<T>) {
  switch (state.type) {
    case 'success':
      return state.data
    case 'error':
      return state.message
    case 'loading':
      return null
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}
```

## Branded Types

```typescript
type Brand<K, T> = K & { __brand: T }

type UserId = Brand<string, 'UserId'>
type OrderId = Brand<string, 'OrderId'>

function createUserId(id: string): UserId {
  return id as UserId
}

function createOrderId(id: string): OrderId {
  return id as OrderId
}

function getOrder(orderId: OrderId, userId: UserId) {}

const userId = createUserId('user-123')
const orderId = createOrderId('order-456')

getOrder(orderId, userId)
```

## Module Declarations

```typescript
declare module 'untyped-package' {
  export function doSomething(): void
  export const value: string
}

declare module 'express' {
  interface Request {
    user?: { id: string }
  }
}

declare global {
  interface Window {
    myGlobal: string
  }
}
```

## TSConfig Essentials

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "skipLibCheck": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Best Practices

```typescript
interface User {
  name: string
}

const routes = ['home', 'about'] as const

const config = {
  api: 'https://api.example.com'
} satisfies Record<string, string>

function parse(input: unknown) {
  if (typeof input === 'string') {
    return JSON.parse(input)
  }
}

export function getUser(id: string): User | null {
  return null
}
```
