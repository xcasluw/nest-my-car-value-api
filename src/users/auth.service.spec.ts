import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { User } from "./user.entity";
import { UsersService } from "./users.service";

describe('AuthService', () => {
  let service: AuthService
  let fakeUsersService: Partial<UsersService>
  
  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = []
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter(user => user.email === email)
        return Promise.resolve(filteredUsers)
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password
        } as User
        users.push(user)
        return Promise.resolve(user)
      }
    }
  
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService
        }
      ]
    }).compile()
  
    service = module.get(AuthService)
  })
  
  it('can create an instance of AuthService', async () => {
    expect(service).toBeDefined()
  })

  it('creates a new user with a salted and hashed password', async () => {
    // Mandando os dados para fakeUsersService
    const user = await service.signup('asdf@asdf.com', 'asdf')
    expect(user.password).not.toEqual('asdf')
    const [salt, hash] = user.password.split('.')
    expect(salt).toBeDefined()
    expect(hash).toBeDefined()
  })

  it('throws an error if user signs up with email that is in use', async () => {
    // Fixando no código o resultado que virá de fakeUsersService
    fakeUsersService.find = () =>
      Promise.resolve([
        { id: 1, email: 'a', password: '1' } as User
      ])
    
    try {
      // Mandando os dados para fakeUsersService
      await service.signup('asdf@asdf.com', 'asdf')  
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.message).toBe('email in use')
    }
  })

  it('throws if signin is called with an unused email', async () => {
    try {
      // Mandando os dados para fakeUsersService
      await service.signin('asdf@asdf.com', 'asdf')
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      expect(error.message).toBe('user not found')
    }
  })

  it('throws if an invalid password is provided', async () => {
    // Fixando no código o resultado que virá de fakeUsersService
    fakeUsersService.find = () =>
      Promise.resolve([
        { email: 'asdf@asdf.com', password: 'qwert' } as User
      ])

    try {
      // Mandando os dados para fakeUsersService
      await service.signin('asdf@asdf.com', 'asdf')
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      expect(error.message).toBe('invalid credentials')
    }
  })

  it('returns a user if correct password is provided', async () => {
    await service.signup('asdf@asdf.com', 'anypassword')
    const user = await service.signin('asdf@asdf.com', 'anypassword')
    expect(user).toBeDefined()
  })
})
